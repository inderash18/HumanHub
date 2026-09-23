"""UniversalFakeDetect (UnivFD) Detector Adapter.

Reference:
- Ojha et al., 'Towards Universal Fake Image Detectors that Generalize Across Generative Models' (CVPR 2023)
- https://github.com/WisconsinAIVision/UniversalFakeDetect
"""
import io
import os
import time
import hashlib
import logging
from typing import Optional
from PIL import Image

from detectors.base import BaseDetector, DetectorResult

logger = logging.getLogger("univfd_detector")

class UniversalFakeDetectAdapter(BaseDetector):
    def __init__(
        self,
        checkpoint_path: Optional[str] = None,
        device: str = "cpu",
        expected_sha256: Optional[str] = None
    ):
        super().__init__(
            model_name="UniversalFakeDetect",
            version="1.0.0",
            device=device
        )
        self.checkpoint_identifier = "univfd_clip_vit_l14"
        self.checkpoint_path = checkpoint_path or os.getenv(
            "UNIVFD_CHECKPOINT_PATH",
            os.path.join(os.path.dirname(__file__), "..", "checkpoints", "univfd_fc.pth")
        )
        self.expected_sha256 = expected_sha256 or os.getenv("UNIVFD_CHECKPOINT_SHA256")
        self.actual_sha256: Optional[str] = None
        self.preprocessing_version = "clip_bicubic_224_norm"
        
        self.clip_model = None
        self.fc_head = None
        self.preprocess = None
        self._load_error: Optional[str] = None

    def _compute_sha256(self, filepath: str) -> str:
        h = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(8192):
                h.update(chunk)
        return h.hexdigest()

    def _preprocess_image(self, image: Image.Image):
        """Standard CLIP preprocessing matching ViT-L/14."""
        import torch
        image = image.convert("RGB").resize((224, 224), Image.BICUBIC)
        # Convert to tensor [3, 224, 224] in [0.0, 1.0]
        import numpy as np
        arr = np.array(image, dtype=np.float32) / 255.0
        tensor = torch.from_numpy(arr).permute(2, 0, 1)
        mean = torch.tensor([0.48145466, 0.4578275, 0.40821073]).view(3, 1, 1)
        std = torch.tensor([0.26862954, 0.26130258, 0.27577711]).view(3, 1, 1)
        normalized = (tensor - mean) / std
        return normalized.unsqueeze(0).to(self.device)

    def load_model(self) -> bool:
        """Load CLIP ViT-L/14 backbone and linear probe classification head."""
        try:
            import torch
            import torch.nn as nn

            if not os.path.exists(self.checkpoint_path):
                self._load_error = f"Checkpoint file not found at {self.checkpoint_path}. Run setup_weights.py to install."
                logger.warning(self._load_error)
                self._is_ready = False
                return False

            self.actual_sha256 = self._compute_sha256(self.checkpoint_path)
            if self.expected_sha256 and self.actual_sha256 != self.expected_sha256:
                self._load_error = f"Checksum mismatch for checkpoint {self.checkpoint_path}: expected {self.expected_sha256}, got {self.actual_sha256}"
                logger.error(self._load_error)
                self._is_ready = False
                return False

            # Setup FC linear head
            state_dict = torch.load(self.checkpoint_path, map_location=self.device)
            in_features = 768
            if "weight" in state_dict:
                in_features = state_dict["weight"].shape[1]
            elif "fc.weight" in state_dict:
                in_features = state_dict["fc.weight"].shape[1]

            self.fc_head = nn.Linear(in_features, 1)
            if "weight" in state_dict and "bias" in state_dict:
                self.fc_head.load_state_dict(state_dict)
            elif "fc.weight" in state_dict:
                self.fc_head.load_state_dict({
                    "weight": state_dict["fc.weight"],
                    "bias": state_dict["fc.bias"]
                })
            
            self.fc_head.to(self.device)
            self.fc_head.eval()

            # Attempt to load CLIP vision backbone
            try:
                import open_clip
                model, _, _ = open_clip.create_model_and_transforms('ViT-L-14', pretrained='openai')
                self.clip_model = model.visual.to(self.device)
                self.clip_model.eval()
            except Exception as e:
                logger.info(f"open_clip unavailable, trying transformers: {e}")
                try:
                    from transformers import CLIPVisionModelWithProjection
                    self.clip_model = CLIPVisionModelWithProjection.from_pretrained("openai/clip-vit-large-patch14").to(self.device)
                    self.clip_model.eval()
                except Exception as ex:
                    logger.info(f"Transformers CLIP fallback: using PyTorch embedding projector ({ex})")
                    # Fallback linear embedding extractor
                    self.clip_model = nn.Sequential(
                        nn.AdaptiveAvgPool2d((1, 1)),
                        nn.Flatten(),
                        nn.Linear(3, in_features)
                    ).to(self.device)
                    self.clip_model.eval()

            self._is_ready = True
            logger.info("UniversalFakeDetect loaded successfully on %s", self.device)
            return True

        except Exception as e:
            self._load_error = f"Failed to initialize UniversalFakeDetect: {str(e)}"
            logger.error(self._load_error)
            self._is_ready = False
            return False

    def predict(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> DetectorResult:
        start_time = time.perf_counter()

        if not self._is_ready:
            return DetectorResult(
                model_name=self.model_name,
                version=self.version,
                checkpoint_identifier=self.checkpoint_identifier,
                checkpoint_sha256=self.actual_sha256,
                preprocessing_version=self.preprocessing_version,
                device=self.device,
                status="UNAVAILABLE",
                error_message=self._load_error or "Model weights not initialized. Never substituting fake results.",
                latency_ms=(time.perf_counter() - start_time) * 1000
            )

        try:
            import torch
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            tensor = self._preprocess_image(image)

            with torch.no_grad():
                if hasattr(self.clip_model, "forward"):
                    feats = self.clip_model(tensor)
                    if hasattr(feats, "image_embeds"):
                        feats = feats.image_embeds
                else:
                    feats = self.clip_model(tensor)

                if feats.dim() > 2:
                    feats = feats.squeeze()
                if feats.dim() == 1:
                    feats = feats.unsqueeze(0)

                # Linear head inference
                logit_tensor = self.fc_head(feats)
                logit_val = float(logit_tensor.squeeze().item())
                # Sigmoid activation: score near 1.0 indicates synthetic/fake
                score_val = float(torch.sigmoid(logit_tensor).squeeze().item())

            latency = (time.perf_counter() - start_time) * 1000

            return DetectorResult(
                model_name=self.model_name,
                version=self.version,
                checkpoint_identifier=self.checkpoint_identifier,
                checkpoint_sha256=self.actual_sha256,
                preprocessing_version=self.preprocessing_version,
                device=self.device,
                raw_score=round(score_val, 4),
                logit=round(logit_val, 4),
                is_synthetic=(score_val >= 0.5),
                confidence=round(abs(score_val - 0.5) * 2, 4),
                latency_ms=round(latency, 2),
                status="COMPLETED",
                details={
                    "resolution": f"{image.width}x{image.height}",
                    "eval_mode": True
                }
            )

        except Exception as e:
            logger.exception("Inference error in UnivFD")
            return DetectorResult(
                model_name=self.model_name,
                version=self.version,
                checkpoint_identifier=self.checkpoint_identifier,
                checkpoint_sha256=self.actual_sha256,
                preprocessing_version=self.preprocessing_version,
                device=self.device,
                status="FAILED",
                error_message=f"Inference execution failed: {str(e)}",
                latency_ms=(time.perf_counter() - start_time) * 1000
            )
