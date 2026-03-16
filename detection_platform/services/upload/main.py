from fastapi import FastAPI, UploadFile, File
import httpx
import uuid
import os
from shared.models import ScanRequest, MediaType

app = FastAPI(title="Upload Service")

STORAGE_PATH = "/tmp/humanhub_uploads"
os.makedirs(STORAGE_PATH, exist_ok=True)

@app.post("/upload")
async def handle_upload(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    file_extension = file.filename.split(".")[-1]
    saved_path = os.path.join(STORAGE_PATH, f"{file_id}.{file_extension}")
    
    with open(saved_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Trigger Orchestrator
    scan_req = ScanRequest(
        media_id=file_id,
        media_type=MediaType.IMAGE, # Simple logic to detect type based on extension
        content_path=saved_path
    )
    
    async with httpx.AsyncClient() as client:
        orchestrator_resp = await client.post("http://orchestrator:8000/scan", json=scan_req.dict())
        return orchestrator_resp.json()

@app.get("/health")
def health():
    return {"status": "healthy"}
