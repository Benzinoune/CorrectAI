"""
Route: /detect-corners
Detect the four corners of the answer sheet in an image.
"""

import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from services.corner_detector import detect_corners

logger = logging.getLogger(__name__)
router = APIRouter()


class CornerResponse(BaseModel):
    detected: bool
    corners: list[dict[str, int]]
    message: str


@router.post("/detect-corners", response_model=CornerResponse)
async def detect_corners_endpoint(
    file: UploadFile = File(...),
    gaussian_ksize: int = Form(5),
    canny_low: int = Form(50),
    canny_high: int = Form(150),
) -> CornerResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Fichier image vide")

    result = detect_corners(
        image_bytes,
        gaussian_ksize=gaussian_ksize,
        canny_low=canny_low,
        canny_high=canny_high,
    )

    return CornerResponse(
        detected=result.detected,
        corners=[{"x": c.x, "y": c.y} for c in result.corners],
        message=result.message,
    )
