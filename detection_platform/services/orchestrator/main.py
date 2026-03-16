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

@app.get("/health")
def health():
    return {"status": "healthy"}
