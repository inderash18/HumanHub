"""Base Detector Interface."""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class DetectorResult(BaseModel):
    model_name: str
    version: str
    checkpoint_identifier: str
    checkpoint_sha256: Optional[str] = None
    preprocessing_version: str
    supported_formats: list[str] = Field(default_factory=lambda: ["image/jpeg", "image/png", "image/webp"])
    device: str
    raw_score: Optional[float] = None
    logit: Optional[float] = None
    is_synthetic: Optional[bool] = None
    confidence: Optional[float] = None
    latency_ms: float = 0.0
    status: str = "COMPLETED"  # COMPLETED | FAILED | UNAVAILABLE
    error_message: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)

class BaseDetector(ABC):
    def __init__(self, model_name: str, version: str, device: str = "cpu"):
        self.model_name = model_name
        self.version = version
        self.device = device
        self._is_ready = False

    @abstractmethod
    def load_model(self) -> bool:
        """Load pretrained model weights once per worker process."""
        pass

    @abstractmethod
    def predict(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> DetectorResult:
        """Run real inference on image bytes."""
        pass

    @property
    def is_ready(self) -> bool:
        return self._is_ready
