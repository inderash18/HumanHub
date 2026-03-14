from fastapi import FastAPI
from pydantic import BaseModel
import random
import time

app = FastAPI(title="HumanHub Text Detection API")

class TextPayload(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_text(payload: TextPayload):
    # Simulated computation overhead
    time.sleep(0.5)
    
    text_content = payload.text.lower()
    
    is_bot_likely = False
    score = 0.1
    
    # Very rudimentary ruleset simulating perplexity and burstiness
    bot_keywords = ["as an ai", "as a language model", "delve into", "tapestry of", "in conclusion"]
    if any(keyword in text_content for keyword in bot_keywords):
        is_bot_likely = True
        score = 0.95
        
    return {
        "score": score,
        "isAI": is_bot_likely,
        "confidence": 0.92,
        "features": {
            "perplexity": random.uniform(20.0, 150.0),
            "burstiness": random.uniform(1.0, 5.0)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
