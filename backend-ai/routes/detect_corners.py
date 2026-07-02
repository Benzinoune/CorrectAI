"""
Route: /detect-corners

Detect the four corners of the answer sheet in an image.

Returns:
  detected             – bool
  corners              – list of {x, y} in detection-image coordinates
  message              – human-readable status
  detection_image_width  – width of the image used internally for detection
  detection_image_height – height of the image used internally for detection

The caller MUST pass these dimensions back to /perspective-correct,
/extract-student-info, and /detect-bubbles so corners can be scaled
to the original image resolution before the perspective warp is applied.
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
    detection_image_width: int = 0
    detection_image_height: int = 0


@router.post("/detect-corners", response_model=CornerResponse)
async def detect_corners_endpoint(
    file: UploadFile = File(...),
    gaussian_ksize: int = Form(5),
    canny_low: int = Form(20),
    canny_high: int = Form(80),
) -> CornerResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")

    image_bytes = await file.read()
    logger.info(
        "POST /detect-corners file=%s content_type=%s size=%d "
        "gaussian_ksize=%d canny_low=%d canny_high=%d",
        file.filename, file.content_type, len(image_bytes),
        gaussian_ksize, canny_low, canny_high,
    )

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Fichier image vide")

    result = detect_corners(
        image_bytes,
        gaussian_ksize=gaussian_ksize,
        canny_low=canny_low,
        canny_high=canny_high,
    )

    logger.info(
        "detect-corners result: detected=%s corners=%d "
        "detection_frame=%dx%d message=%s",
        result.detected, len(result.corners),
        result.detection_image_width, result.detection_image_height,
        result.message,
    )

    return CornerResponse(
        detected=result.detected,
        corners=[{"x": c.x, "y": c.y} for c in result.corners],
        message=result.message,
        detection_image_width=result.detection_image_width,
        detection_image_height=result.detection_image_height,
    )
