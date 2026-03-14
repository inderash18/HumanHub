from fastapi import FastAPI
from pydantic import BaseModel
import random
import time

app = FastAPI(title="HumanHub Bot Behavior API")

class BehaviorPayload(BaseModel):
    userId: str
    sessionData: dict = None

@app.post("/analyze")
async def analyze_behavior(payload: BehaviorPayload):
    time.sleep(0.3)
    
    # Baseline normal human cadence simulation
    score = random.uniform(0.05, 0.4)
    
    return {
        "score": score,
        "isBotLikely": score >= 0.75,
        "confidence": 0.85
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
