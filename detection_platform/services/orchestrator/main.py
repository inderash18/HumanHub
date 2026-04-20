from fastapi import FastAPI, BackgroundTasks, HTTPException
import httpx
import asyncio
from typing import List
from shared.models import ScanRequest, DetectionResult, DetectionLayer, MediaType
import time

app = FastAPI(title="Detection Orchestrator")

# Service Map
SERVICES = {
    "groups_1_2_3": "http://metadata-analyzer:8001",
    "group_4": "http://image-detector:8002",
    "group_5": "http://sensor-verify:8003",
    "group_6": "http://video-detector:8004",
    "group_7": "http://audio-detector:8005",
    "group_8": "http://text-detector:8006",
    "group_9": "http://behavior-engine:8007",
    "group_10": "http://similarity-engine:8008"
}

@app.post("/scan", response_model=DetectionResult)
async def orchestrate_scan(request: ScanRequest):
    start_time = time.time()
    
    # Identify relevant services based on media type
    relevant_services = []
    if request.media_type == MediaType.IMAGE:
        relevant_services = ["groups_1_2_3", "group_4", "group_5", "group_10"]
    elif request.media_type == MediaType.VIDEO:
        relevant_services = ["groups_1_2_3", "group_6", "group_10"]
    elif request.media_type == MediaType.AUDIO:
        relevant_services = ["groups_1_2_3", "group_7"]
    elif request.media_type == MediaType.TEXT:
        relevant_services = ["group_8", "group_9"]

    # Execute scans in parallel
    results = []
    async with httpx.AsyncClient() as client:
        tasks = [
            client.post(f"{SERVICES[svc]}/analyze", json=request.dict()) 
            for svc in relevant_services
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        for response in responses:
            if isinstance(response, httpx.Response) and response.status_code == 200:
                results.extend(response.json().get("layers", []))
            else:
                print(f"Service call failed: {response}")

    # Forward results to Trust Score Engine
    async with httpx.AsyncClient() as client:
        tse_response = await client.post(
            "http://trust-score-engine:8009/calculate", 
            json={"media_id": request.media_id, "layers": results}
        )
        final_result = tse_response.json()

    return final_result

# --- LEGACY COMPATIBILITY ENDPOINTS ---

@app.post("/analyze/text")
async def analyze_text_legacy(payload: dict):
    text = payload.get("text", "")
    req = ScanRequest(media_id="legacy", media_type=MediaType.TEXT, raw_text=text)
    result = await orchestrate_scan(req)
    # Extract compatible score from layers
    text_layers = [l for l in result.layers if l.group == 8]
    avg_score = sum(l.score for l in text_layers) / len(text_layers) if text_layers else 0.1
    return {
        "score": avg_score,
        "isAI": avg_score > 0.5,
        "confidence": 0.95
    }

@app.post("/analyze/media")
async def analyze_media_legacy(payload: dict):
    urls = payload.get("urls", [])
    req = ScanRequest(media_id="legacy", media_type=MediaType.IMAGE, content_url=urls[0] if urls else None)
    result = await orchestrate_scan(req)
    # Extract compatible score from layers (Group 4 = Image)
    image_layers = [l for l in result.layers if l.group == 4]
    avg_score = sum(l.score for l in image_layers) / len(image_layers) if image_layers else 0.1
    return {
        "score": avg_score,
        "isAI": avg_score > 0.5,
        "confidence": 0.85
    }

@app.post("/analyze/behavior")
async def analyze_behavior_legacy(payload: dict):
    user_id = payload.get("userId")
    req = ScanRequest(media_id="legacy", media_type=MediaType.TEXT, metadata={"userId": user_id})
    result = await orchestrate_scan(req)
    # Extract compatible score from layers (Group 9 = Behavior)
    behavior_layers = [l for l in result.layers if l.group == 9]
    avg_score = sum(l.score for l in behavior_layers) / len(behavior_layers) if behavior_layers else 0.1
    return {
        "score": avg_score,
        "isBotLikely": avg_score > 0.6,
        "confidence": 0.9
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
