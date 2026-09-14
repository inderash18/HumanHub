"""Keep experimental scoring services out of content-approval decisions."""
from fastapi import FastAPI, HTTPException

app = FastAPI(title="HumanHub Detection Orchestrator")

@app.get("/health")
def health():
    return {"status": "unavailable", "reason": "Detection services contain experimental scores"}

@app.post("/scan")
@app.post("/analyze/text")
@app.post("/analyze/media")
@app.post("/analyze/behavior")
def scan():
    raise HTTPException(
        status_code=503,
        detail="Experimental detectors are not validated for content approval. Moderator review is required."
    )
