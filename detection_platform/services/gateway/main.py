from fastapi import FastAPI, Request, HTTPException
import httpx
import time

app = FastAPI(title="Secure Upload Gateway")

@app.post("/v1/upload")
async def gateway_upload(request: Request):
    # Layer 0: Secure Upload Gateway
    # Implementation of rate limiting and auth would go here
    
    body = await request.json()
    
    async with httpx.AsyncClient() as client:
        response = await client.post("http://upload-service:8010/upload", json=body)
        return response.json()

@app.get("/health")
def health():
    return {"status": "healthy"}
