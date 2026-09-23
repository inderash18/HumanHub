"""HumanHub AI & Provenance Analysis Service.

Provides real UniversalFakeDetect inference, C2PA Content Credentials verification,
and sanitized EXIF/XMP metadata extraction.
"""
import os
import sys
import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from detectors.universal_fake_detect import UniversalFakeDetectAdapter
from provenance.c2pa_verifier import C2PAVerifier
from metadata.extractor import MetadataExtractor
from engine.decision_policy import DecisionEngine, AnalysisReport

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ai_service")

# Global engine instances
detector = UniversalFakeDetectAdapter(device=os.getenv("DEVICE", "cpu"))
c2pa_verifier = C2PAVerifier()
metadata_extractor = MetadataExtractor()
decision_engine = DecisionEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Detection and Provenance Engines...")
    detector.load_model()
    yield
    logger.info("Shutting down AI Service...")

app = FastAPI(
    title="HumanHub Origin & Provenance Analysis Service",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "HumanHub Origin Analysis",
        "detector_ready": detector.is_ready,
        "detector_name": detector.model_name,
        "device": detector.device
    }

@app.get("/readiness")
def readiness():
    return {
        "ready": True,
        "detector": {
            "name": detector.model_name,
            "version": detector.version,
            "ready": detector.is_ready,
            "checkpoint": detector.checkpoint_identifier,
            "sha256": detector.actual_sha256,
            "device": detector.device
        },
        "c2pa": {
            "library_loaded": c2pa_verifier._c2pa_available
        },
        "metadata_extractor": {
            "ready": True
        }
    }

@app.post("/analyze/image-origin", response_model=AnalysisReport)
async def analyze_image_origin(
    file: UploadFile = File(...)
):
    """Analyze image origin via C2PA credentials, EXIF metadata, and UnivFD pixel model."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported for origin analysis.")
    
    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if len(image_bytes) > 20 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image exceeds maximum size of 20MB.")

        # 1. Provenance check on original unaltered bytes
        provenance_res = c2pa_verifier.verify(image_bytes, mime_type=file.content_type)

        # 2. Metadata extraction & sanitization
        metadata_res = metadata_extractor.extract(image_bytes, mime_type=file.content_type)

        # 3. UniversalFakeDetect real model inference
        detector_res = detector.predict(image_bytes, mime_type=file.content_type)

        # 4. Decision policy synthesis
        report = decision_engine.evaluate(provenance_res, metadata_res, detector_res)
        return report

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during image-origin analysis")
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

# Legacy compatibility endpoints
@app.post("/analyze/text")
def analyze_text():
    return {"status": "ok", "score": 0.05, "confidence": 0.95, "modelVersion": "text-base-v1"}

@app.post("/analyze/media")
def analyze_media():
    return {"status": "ok", "score": 0.1, "confidence": 0.9, "modelVersion": "media-base-v1"}

@app.post("/analyze/behavior")
def analyze_behavior():
    return {"status": "ok", "score": 0.02, "confidence": 0.98, "modelVersion": "behavior-base-v1"}
