from fastapi import FastAPI
from shared.models import DetectionResult, DetectionLayer, MediaType
from typing import List, Dict, Any
import datetime

app = FastAPI(title="Trust Score Engine")

# Weights for different groups (total sum doesn't have to be 1, we normalize)
GROUP_WEIGHTS = {
    1: 0.1,  # File Integrity
    2: 0.15, # Metadata
    3: 0.2,  # Provenance (High trust if valid)
    4: 0.25, # Image Analysis
    5: 0.1,  # Sensor
    6: 0.25, # Video
    7: 0.2,  # Audio
    8: 0.25, # Text
    9: 0.1,  # Behavior
    10: 0.1  # Similarity
}

@app.post("/calculate", response_model=DetectionResult)
async def calculate_trust(data: Dict[str, Any]):
    media_id = data.get("media_id")
    layers_data = data.get("layers", [])
    layers = [DetectionLayer(**l) for l in layers_data]
    
    if not layers:
        return DetectionResult(
            media_id=media_id,
            media_type=MediaType.IMAGE, # Default
            is_synthetic=False,
            trust_score=1.0,
            layers=[],
            verdict="publish",
            timestamp=str(datetime.datetime.utcnow())
        )

    # Calculate weighted synthetic score
    total_weighted_score = 0
    total_weight = 0
    
    for layer in layers:
        weight = GROUP_WEIGHTS.get(layer.group, 0.1)
        # We adjust weight by confidence
        effective_weight = weight * layer.confidence
        total_weighted_score += layer.score * effective_weight
        total_weight += effective_weight

    synthetic_probability = total_weighted_score / total_weight if total_weight > 0 else 0
    trust_score = 1 - synthetic_probability

    # Decision Logic
    is_synthetic = synthetic_probability > 0.6
    
    if trust_score > 0.8:
        verdict = "publish"
    elif trust_score < 0.4:
        verdict = "reject"
    else:
        verdict = "review"

    return DetectionResult(
        media_id=media_id,
        media_type=MediaType.IMAGE, # Should be passed in
        is_synthetic=is_synthetic,
        trust_score=round(trust_score, 4),
        layers=layers,
        verdict=verdict,
        timestamp=str(datetime.datetime.utcnow())
    )

@app.get("/health")
def health():
    return {"status": "healthy"}
