"""Detection API contract. No trained detector is bundled with this repository."""
from fastapi import FastAPI, HTTPException

app = FastAPI(title="HumanHub Detection Service", version="1.1.0")

@app.get("/")
@app.get("/health")
def health():
    return {"status": "unavailable", "reason": "No validated detection model is configured"}

@app.post("/analyze")
@app.post("/analyze/text")
@app.post("/analyze/media")
@app.post("/analyze/behavior")
def analyze():
    raise HTTPException(
        status_code=503,
        detail="No validated detection model is configured. Content requires moderator review."
    )
