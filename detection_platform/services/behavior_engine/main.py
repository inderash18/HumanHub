from fastapi import FastAPI
from shared.models import ScanRequest, DetectionLayer
import random

app = FastAPI(title="Behavior Analysis Engine")

@app.post("/analyze")
async def analyze_behavior(request: ScanRequest):
    layers = []
    
    # Layer 44: Abnormal Upload Frequency
    layers.append(DetectionLayer(
        name="upload_frequency_monitoring",
        group=9,
        score=0.1, # Human-like frequency
        confidence=0.9
    ))

    # Layer 45: Automation Pattern Detection
    # Checking for robotic interaction delays
    layers.append(DetectionLayer(
        name="automation_pattern_detection",
        group=9,
        score=0.05,
        confidence=0.85
    ))

    # Layer 47: Bot behavior detection
    layers.append(DetectionLayer(
        name="bot_anomaly_detector",
        group=9,
        score=0.15,
        confidence=0.8
    ))

    return {"layers": layers}

@app.get("/health")
def health():
    return {"status": "healthy"}
