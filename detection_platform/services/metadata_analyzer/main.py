from fastapi import FastAPI
from shared.models import ScanRequest, DetectionLayer
import hashlib
import os
import magic
import math
from typing import List

app = FastAPI(title="Metadata Analyzer")

def calculate_entropy(data):
    if not data:
        return 0
    entropy = 0
    for x in range(256):
        p_x = data.count(x) / len(data)
        if p_x > 0:
            entropy += - p_x * math.log(p_x, 2)
    return entropy

@app.post("/analyze")
async def analyze_metadata(request: ScanRequest):
    layers = []
    
    # Layer 3: SHA256 Hashing
    # In real scenario, we'd read the file from content_path
    # For now, we simulate
    file_hash = "mock_hash"
    
    # Layer 4: Entropy Analysis
    # Higher entropy can indicate compression or encryption (or AI noise)
    entropy_score = 0.5 # Mock
    layers.append(DetectionLayer(
        name="entropy_analysis",
        group=1,
        score=entropy_score,
        confidence=0.9
    ))

    # Layer 6: EXIF Metadata extraction
    # Logic to look for "Midjourney", "DALL-E", etc.
    layers.append(DetectionLayer(
        name="exif_detector",
        group=2,
        score=0.1, # Mock result
        confidence=0.95
    ))

    # Layer 11: C2PA Verification
    layers.append(DetectionLayer(
        name="c2pa_verification",
        group=3,
        score=0.0, # 0 = Provenance found/valid
        confidence=1.0
    ))

    return {"layers": layers}

@app.get("/health")
def health():
    return {"status": "healthy"}
