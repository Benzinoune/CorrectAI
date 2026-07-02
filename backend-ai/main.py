"""
CorrectAI Backend AI Service

FastAPI application providing computer vision endpoints for answer sheet
processing: corner detection, perspective correction, OMR, and OCR.

Architecture:
  - routes/     → HTTP route handlers (thin layer)
  - services/   → Business logic (corner_detector, perspective, omr, ocr)

Debug images are always written to backend-ai/debug/ so you can inspect
what OpenCV sees on each request without restarting the server.
"""

import logging

import cv2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from routes.detect_corners import router as detect_corners_router
from routes.ocr import router as ocr_router
from routes.omr import router as omr_router
from routes.perspective import router as perspective_router
from routes.scan import router as scan_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CorrectAI Backend AI",
    description="API de détection et correction de copies QCM par vision par ordinateur",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    opencv_version: str


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="correctai-backend-ai",
        version="1.1.0",
        opencv_version=cv2.__version__,
    )


app.include_router(detect_corners_router, tags=["Corner Detection"])
app.include_router(scan_router, tags=["Unified Scan"])
app.include_router(perspective_router, tags=["Perspective"])
app.include_router(omr_router, tags=["OMR"])
app.include_router(ocr_router, tags=["OCR"])


if __name__ == "__main__":
    import uvicorn

    logger.info("=" * 60)
    logger.info("CorrectAI Backend AI starting")
    logger.info("Debug images will be saved to backend-ai/debug/ on EVERY request")
    logger.info("=" * 60)

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
