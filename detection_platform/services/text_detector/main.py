from fastapi import FastAPI
from shared.models import ScanRequest, DetectionLayer
import numpy as np

app = FastAPI(title="Text AI Detector")

def calculate_perplexity(text):
    # Mock perplexity calculation (lower = more likely AI)
    return 25.4

def calculate_burstiness(text):
    # Variance in sentence length
    return 0.5 

@app.post("/analyze")
async def analyze_text(request: ScanRequest):
    layers = []
    
    # Layer 39: Perplexity Scoring
    layers.append(DetectionLayer(
        name="perplexity_scoring",
        group=8,
        score=0.7, # Mock: AI detected
        confidence=0.85
    ))

    # Layer 40: Burstiness Analysis
    layers.append(DetectionLayer(
        name="burstiness_analysis",
        group=8,
        score=0.6,
        confidence=0.8
    ))

    # Layer 41: Stylometric Classification
    layers.append(DetectionLayer(
        name="stylometric_fingerprinting",
        group=8,
        score=0.8,
        confidence=0.9
    ))

    # Layer 43: Transformer-based AI Text Detection (RoBERTa)
    layers.append(DetectionLayer(
        name="transformer_classifier",
        group=8,
        score=0.92,
        confidence=0.98
    ))

    return {"layers": layers}

@app.get("/health")
def health():
    return {"status": "healthy"}
