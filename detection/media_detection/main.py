from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import random
import time

app = FastAPI(title="HumanHub Media Detection API")

class MediaPayload(BaseModel):
    urls: List[str]

@app.post("/analyze")
async def analyze_media(payload: MediaPayload):
    time.sleep(1.2) # simulate heavy pixel-level scanning
    
    # 20% random base failure chance if any media is present
    has_media = len(payload.urls) > 0
    score = random.uniform(0.6, 0.9) if (has_media and random.random() > 0.8) else random.uniform(0.01, 0.3)
    
    return {
        "score": score if has_media else 0,
        "isAI": score > 0.80,
        "confidence": random.uniform(0.7, 0.98),
        "markers": ["noise_distribution", "stitching_artifacts"] if score > 0.8 else []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
