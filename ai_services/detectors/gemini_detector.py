"""Gemini AI Vision Origin Detector.

Performs authoritative AI generation verification using Google's Gemini Vision models.
Under platform policy, only Gemini's explicit AI_GENERATED verdict can block posts.
"""
import os
import json
import time
import base64
import logging
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

logger = logging.getLogger("gemini_detector")

class GeminiDetectionResult(BaseModel):
    status: str = "NOT_CONFIGURED"  # COMPLETED | NOT_CONFIGURED | UNAVAILABLE | FAILED | TIMEOUT
    provider: str = "gemini"
    label: str = "UNVERIFIED"  # AI_GENERATED | LIKELY_AI_GENERATED | LIKELY_AUTHENTIC | INCONCLUSIVE | UNVERIFIED
    is_ai_generated: Optional[bool] = None
    confidence: Optional[float] = None
    explanation: str = ""
    model_version: str = "gemini-1.5-flash"
    latency_ms: float = 0.0
    error_message: Optional[str] = None

class GeminiDetector:
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_GENAI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", model_name)
        self.is_configured = bool(self.api_key)

    def analyze(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> GeminiDetectionResult:
        start_time = time.perf_counter()
        
        if not self.is_configured:
            # Check if key was added to env dynamically
            self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_GENAI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if not self.api_key:
                return GeminiDetectionResult(
                    status="NOT_CONFIGURED",
                    provider="gemini",
                    label="UNVERIFIED",
                    is_ai_generated=None,
                    explanation="Gemini API key not configured.",
                    latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
                )
            self.is_configured = True

        try:
            b64_img = base64.b64encode(image_bytes).decode('utf-8')
            
            prompt = (
                "Analyze this image and determine if it is an AI-generated image (e.g. Midjourney, DALL-E, Stable Diffusion, Imagen, Flux, Gemini) "
                "or a real photograph/human-created work. "
                "Respond ONLY with a JSON object in this exact schema: "
                "{\"verdict\": \"AI_GENERATED\" | \"LIKELY_AI_GENERATED\" | \"LIKELY_AUTHENTIC\" | \"INCONCLUSIVE\", \"confidence\": 0.0 to 1.0, \"explanation\": \"brief explanation\"}"
            )
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": b64_img
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                    "responseMimeType": "application/json"
                }
            }

            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
            req_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = json.loads(response.read().decode('utf-8'))
                
            text_resp = res_body.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '{}')
            parsed = json.loads(text_resp.strip())
            
            verdict = parsed.get("verdict", "INCONCLUSIVE").upper()
            confidence = float(parsed.get("confidence", 0.5))
            explanation = parsed.get("explanation", "Gemini automated analysis completed.")
            
            is_ai = verdict in ("AI_GENERATED", "LIKELY_AI_GENERATED")
            
            return GeminiDetectionResult(
                status="COMPLETED",
                provider="gemini",
                label=verdict,
                is_ai_generated=is_ai,
                confidence=confidence,
                explanation=explanation,
                model_version=self.model_name,
                latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )

        except urllib.error.HTTPError as http_err:
            logger.warning("Gemini API HTTP error %d: %s", http_err.code, http_err.reason)
            return GeminiDetectionResult(
                status="UNAVAILABLE",
                provider="gemini",
                label="UNVERIFIED",
                error_message=f"Gemini API returned HTTP {http_err.code}",
                latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )
        except Exception as e:
            logger.warning("Gemini detector exception: %s", e)
            return GeminiDetectionResult(
                status="FAILED",
                provider="gemini",
                label="UNVERIFIED",
                error_message=str(e),
                latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )
