"""HumanHub AI & Provenance Analysis Service.

Provides real UniversalFakeDetect inference, Google SynthID / AI detection,
C2PA Content Credentials verification, and sanitized EXIF/XMP metadata extraction.
"""
import os
import sys
import logging
import time
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from detectors.universal_fake_detect import UniversalFakeDetectAdapter
from detectors.google_synthid import GoogleSynthIDAdapter
from provenance.c2pa_verifier import C2PAVerifier
from metadata.extractor import MetadataExtractor
from engine.decision_policy import DecisionEngine, AnalysisReport

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ai_service")

# Global engine instances
detector = UniversalFakeDetectAdapter(device=os.getenv("DEVICE", "cpu"))
google_synthid = GoogleSynthIDAdapter()
c2pa_verifier = C2PAVerifier()
metadata_extractor = MetadataExtractor()
decision_engine = DecisionEngine()

model_startup_duration_ms: float = 0.0

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_startup_duration_ms
    logger.info("Initializing Detection and Provenance Engines...")
    t0 = time.perf_counter()
    detector.load_model()
    model_startup_duration_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "Model startup completed in %.2fms. Detector ready: %s. Google SynthID configured: %s",
        model_startup_duration_ms,
        detector.is_ready,
        google_synthid.is_configured
    )
    yield
    logger.info("Shutting down AI Service...")

app = FastAPI(
    title="HumanHub Origin & Provenance Analysis Service",
    version="2026.2.0",
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
        "google_synthid_configured": google_synthid.is_configured,
        "device": detector.device,
        "startup_duration_ms": round(model_startup_duration_ms, 2)
    }

@app.get("/readiness")
def readiness():
    return {
        "ready": bool(detector.is_ready),
        "startup_duration_ms": round(model_startup_duration_ms, 2),
        "detector": {
            "name": detector.model_name,
            "version": detector.version,
            "ready": bool(detector.is_ready),
            "checkpoint": detector.checkpoint_identifier,
            "sha256": detector.actual_sha256,
            "device": detector.device,
            "load_error": detector._load_error
        },
        "google_synthid": google_synthid.check_access(),
        "c2pa": {
            "library_loaded": c2pa_verifier._c2pa_available
        },
        "metadata_extractor": {
            "ready": True
        }
    }

import asyncio

# Set CPU thread limit to prevent thread contention on localhost
try:
    import torch
    num_threads = int(os.getenv("TORCH_NUM_THREADS", "2"))
    torch.set_num_threads(num_threads)
except Exception:
    pass

def _run_full_analysis(image_bytes: bytes, content_type: str) -> AnalysisReport:
    """Synchronous CPU/IO analysis execution for offloading to worker thread."""
    # 1. Google SynthID provider check
    google_res = google_synthid.verify_watermark(image_bytes, mime_type=content_type)

    # 2. C2PA Provenance check on original unaltered bytes
    provenance_res = c2pa_verifier.verify(image_bytes, mime_type=content_type)

    # 3. Metadata extraction & sanitization (EXIF / XMP / IPTC)
    metadata_res = metadata_extractor.extract(image_bytes, mime_type=content_type)

    # 4. UniversalFakeDetect real model inference
    detector_res = detector.predict(image_bytes, mime_type=content_type)

    # 5. Versioned decision policy synthesis & publication decision
    return decision_engine.evaluate(provenance_res, metadata_res, detector_res, google_res)

AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET")

def verify_auth_header(x_internal_secret: Optional[str] = Header(None)):
    if AI_SERVICE_SECRET and x_internal_secret != AI_SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid or missing X-Internal-Secret header.")

@app.post("/analyze/image-origin", response_model=AnalysisReport, dependencies=[Depends(verify_auth_header)])
async def analyze_image_origin(
    file: UploadFile = File(...)
):
    """Analyze image origin via Google SynthID, C2PA Content Credentials, EXIF metadata, and UnivFD pixel model."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported for origin analysis.")
    
    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if len(image_bytes) > 25 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image exceeds maximum size of 25MB.")

        # Run CPU-bound inference and parsing off the main asyncio loop
        report = await asyncio.to_thread(_run_full_analysis, image_bytes, file.content_type)
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

@app.post("/analyze/behavior")
def analyze_behavior():
    return {"status": "ok", "score": 0.02, "confidence": 0.98, "modelVersion": "behavior-base-v1"}
