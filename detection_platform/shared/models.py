from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    TEXT = "text"

class DetectionLayer(BaseModel):
    name: str
    group: int
    score: float = Field(..., ge=0, le=1)  # 0 = Human, 1 = AI
    confidence: float = Field(..., ge=0, le=1)
    metadata: Optional[Dict[str, Any]] = None

class DetectionResult(BaseModel):
    media_id: str
    media_type: MediaType
    is_synthetic: bool
    trust_score: float = Field(..., ge=0, le=1)  # 1 = Fully Human, 0 = Fully AI
    layers: List[DetectionLayer] = []
    verdict: str  # "publish", "reject", "review"
    timestamp: str

class ScanRequest(BaseModel):
    media_id: str
    media_type: MediaType
    content_url: Optional[str] = None
    content_path: Optional[str] = None
    raw_text: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
