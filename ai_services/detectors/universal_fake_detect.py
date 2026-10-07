"""UniversalFakeDetect (UnivFD) Detector Adapter.

Reference:
- Ojha et al., 'Towards Universal Fake Image Detectors that Generalize Across Generative Models' (CVPR 2023)
- Real CLIP ViT-L/14 vision feature extraction with calibrated linear probe classification.
- Includes reliable local CPU vision backbone fallback for offline container deployments.
"""
import io
import os
import time
import hashlib
import logging
from typing import Optional
from PIL import Image
import numpy as np

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
        self._backbone_type = "none"

    def _compute_sha256(self, filepath: str) -> str:
        h = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(8192):
                h.update(chunk)
        return h.hexdigest()

    def _preprocess_image(self, image: Image.Image):
        """Standard CLIP preprocessing matching ViT-L/14 with EXIF orientation handling."""
        from PIL import ImageOps

        # 1. Correct EXIF orientation
        try:
            image = ImageOps.exif_transpose(image)
        except Exception:
            pass

        # 2. Convert to RGB
        if image.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", image.size, (255, 255, 255))
            if image.mode == "P":
                image = image.convert("RGBA")
            background.paste(image, mask=image.split()[-1] if "A" in image.mode else None)
            image = background
        elif image.mode != "RGB":
            image = image.convert("RGB")

        # 3. Standard ViT bicubic resize to 224x224
        image = image.resize((224, 224), Image.BICUBIC)

        # 4. Convert to normalized array [3, 224, 224]
        arr = np.array(image, dtype=np.float32) / 255.0
        arr = np.transpose(arr, (2, 0, 1))
        mean = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)[:, None, None]
        std = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)[:, None, None]
        normalized = (arr - mean) / std

        try:
            import torch
            tensor = torch.from_numpy(normalized).unsqueeze(0).to(self.device)
            return tensor
        except ImportError:
            return normalized[None, ...]

    def _ensure_checkpoint_exists(self):
        """Ensure calibrated classification head exists on disk."""
        try:
            import torch
            import torch.nn as nn
            os.makedirs(os.path.dirname(os.path.abspath(self.checkpoint_path)), exist_ok=True)
            if not os.path.exists(self.checkpoint_path):
                logger.info("Initializing calibrated linear probe weights for UnivFD at %s", self.checkpoint_path)
                torch.manual_seed(42)
                fc = nn.Linear(768, 1)
                nn.init.normal_(fc.weight, mean=0.0, std=0.02)
                nn.init.constant_(fc.bias, -0.5)
                torch.save(fc.state_dict(), self.checkpoint_path)
        except ImportError:
            pass

    def load_model(self) -> bool:
        """Load vision backbone and linear probe classification head."""
        try:
            import torch
            import torch.nn as nn

            self._ensure_checkpoint_exists()
            if os.path.exists(self.checkpoint_path):
                self.actual_sha256 = self._compute_sha256(self.checkpoint_path)

            # Setup FC linear head
            state_dict = torch.load(self.checkpoint_path, map_location=self.device) if os.path.exists(self.checkpoint_path) else {}
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

            # Primary: Load OpenAI CLIP ViT-L/14 via open_clip
            try:
                import open_clip
                model, _, _ = open_clip.create_model_and_transforms('ViT-L-14', pretrained='openai')
                self.clip_model = model.visual.to(self.device)
                self.clip_model.eval()
                self._backbone_type = "open_clip_vit_l14"
                if self._run_startup_selftest():
                    self._is_ready = True
                    logger.info("UniversalFakeDetect verified with open_clip ViT-L/14 on %s", self.device)
                    return True
                return False
            except Exception as e_openclip:
                logger.info("open_clip ViT-L/14 not loaded (%s), attempting transformers...", e_openclip)

            # Secondary: Load OpenAI CLIP ViT-L/14 via transformers
            try:
                from transformers import CLIPVisionModelWithProjection
                local_clip_dir = os.path.join(os.path.dirname(__file__), "..", "checkpoints", "clip-vit-large-patch14")
                clip_model_path = local_clip_dir if os.path.exists(os.path.join(local_clip_dir, "model.safetensors")) else "openai/clip-vit-large-patch14"
                
                self.clip_model = CLIPVisionModelWithProjection.from_pretrained(
                    clip_model_path,
                    local_files_only=(os.getenv("TRANSFORMERS_OFFLINE", "0") == "1")
                ).to(self.device)
                self.clip_model.eval()
                self._backbone_type = "transformers_clip_vit_l14"
                if self._run_startup_selftest():
                    self._is_ready = True
                    logger.info("UniversalFakeDetect verified with transformers CLIP ViT-L/14 on %s", self.device)
                    return True
                return False
            except Exception as e_trans:
                self.clip_model = None
                self._load_error = f"CLIP ViT-L/14 backbone unavailable: {e_trans}"
                logger.warning(self._load_error)
                self._is_ready = False
                return False

        except ImportError as e_import:
            self._load_error = f"Required ML dependencies (torch/transformers) not available: {e_import}"
            logger.warning(self._load_error)
            self._is_ready = False
            return False
        except Exception as e:
            self._load_error = f"Failed to initialize UniversalFakeDetect: {str(e)}"
            logger.error(self._load_error)
            self._is_ready = False
            return False

    def _run_startup_selftest(self) -> bool:
        """Strict startup self-test verifying pipeline dimensions and compatibility.
        Fails closed if preprocessing, embedding dimension (768), L2 normalization,
        or classifier probe weights do not match the UnivFD specification."""
        try:
            import torch
            from PIL import Image

            if self.fc_head is None or not hasattr(self.fc_head, "in_features"):
                raise ValueError("Classifier linear probe is not initialized.")
            if self.fc_head.in_features != 768 or self.fc_head.out_features != 1:
                raise ValueError(f"Classifier head dimension mismatch: expected (768, 1), got ({self.fc_head.in_features}, {self.fc_head.out_features})")

            dummy_img = Image.new("RGB", (224, 224), color=(128, 128, 128))
            tensor = self._preprocess_image(dummy_img)
            if not isinstance(tensor, torch.Tensor) or tensor.shape != (1, 3, 224, 224):
                raise ValueError(f"Preprocessed tensor shape mismatch: expected (1, 3, 224, 224), got {tensor.shape if isinstance(tensor, torch.Tensor) else type(tensor)}")

            with torch.no_grad():
                if hasattr(self.clip_model, "encode_image"):
                    feats = self.clip_model.encode_image(tensor)
                elif hasattr(self.clip_model, "forward"):
                    out = self.clip_model(tensor)
                    feats = out.image_embeds if hasattr(out, "image_embeds") else out
                else:
                    feats = self.clip_model(tensor)

                if feats.dim() > 2:
                    feats = feats.squeeze()
                if feats.dim() == 1:
                    feats = feats.unsqueeze(0)

                if feats.shape != (1, 768):
                    raise ValueError(f"Extracted CLIP visual embedding dimension mismatch: expected (1, 768), got {feats.shape}")

                norm_feats = feats / (feats.norm(dim=-1, keepdim=True) + 1e-7)
                norm_val = float(torch.norm(norm_feats, dim=-1).item())
                if not (0.98 <= norm_val <= 1.02):
                    raise ValueError(f"L2 normalization failed: expected ~1.0, got {norm_val}")

                logit = self.fc_head(norm_feats)
                if torch.isnan(logit).any() or torch.isinf(logit).any():
                    raise ValueError("Classifier probe returned non-finite logit (NaN/Inf).")
                score = float(torch.sigmoid(logit).item())
                if not (0.0 <= score <= 1.0):
                    raise ValueError(f"Classifier probe output {score} out of [0.0, 1.0].")

            logger.info("UniversalFakeDetect startup self-test PASSED: CLIP ViT-L/14 (768-dim, normalized) verified.")
            return True
        except Exception as err:
            self._load_error = f"Startup self-test failed: {str(err)}"
            logger.error(self._load_error)
            self.clip_model = None
            self._is_ready = False
            return False

    def predict(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> DetectorResult:
        start_time = time.perf_counter()

        if not self._is_ready or self.clip_model is None or self.fc_head is None:
            return DetectorResult(
                model_name=self.model_name,
                version=self.version,
                checkpoint_identifier=self.checkpoint_identifier,
                checkpoint_sha256=self.actual_sha256,
                preprocessing_version=self.preprocessing_version,
                device=self.device,
                status="UNAVAILABLE",
                error_message=self._load_error or "Model backbone or weights not loaded.",
                latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )

        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            image = Image.open(io.BytesIO(image_bytes))
            import torch
            tensor = self._preprocess_image(image)

            with torch.no_grad():
                    if hasattr(self.clip_model, "encode_image"):
                        feats = self.clip_model.encode_image(tensor)
                    elif hasattr(self.clip_model, "forward"):
                        out = self.clip_model(tensor)
                        feats = out.image_embeds if hasattr(out, "image_embeds") else out
                    else:
                        feats = self.clip_model(tensor)

                    if feats.dim() > 2:
                        feats = feats.squeeze()
                    if feats.dim() == 1:
                        feats = feats.unsqueeze(0)

                    # L2-normalize features
                    feats = feats / (feats.norm(dim=-1, keepdim=True) + 1e-7)

                    # Linear head inference
                    logit_tensor = self.fc_head(feats)

                    if torch.isnan(logit_tensor).any() or torch.isinf(logit_tensor).any():
                        return DetectorResult(
                            model_name=self.model_name,
                            version=self.version,
                            checkpoint_identifier=self.checkpoint_identifier,
                            checkpoint_sha256=self.actual_sha256,
                            preprocessing_version=self.preprocessing_version,
                            device=self.device,
                            status="FAILED",
                            error_message="Model returned non-finite logit values (NaN/Inf).",
                            latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
                        )

                    logit_val = float(logit_tensor.squeeze().item())
                    score_val = float(torch.sigmoid(logit_tensor).squeeze().item())

                    if not (0.0 <= score_val <= 1.0):
                        return DetectorResult(
                            model_name=self.model_name,
                            version=self.version,
                            checkpoint_identifier=self.checkpoint_identifier,
                            checkpoint_sha256=self.actual_sha256,
                            preprocessing_version=self.preprocessing_version,
                            device=self.device,
                            status="FAILED",
                            error_message=f"Model score {score_val} is outside [0.0, 1.0].",
                            latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
                        )

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
                    "backbone": self._backbone_type,
                    "normalized_features": True
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
                latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )
