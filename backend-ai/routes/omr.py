"""
Route: /detect-bubbles

Detect filled bubbles (OMR) in the answer sheet.

The perspective correction is applied server-side before OMR so the bubbles
are in a flat, undistorted image.

Parameters
----------
file                   – original camera image (full resolution)
corners_json           – JSON array of {x, y} corner objects
                         (in detection-image coordinates from /detect-corners)
questions              – expected number of questions
detection_image_width  – width reported by /detect-corners  (0 = legacy)
detection_image_height – height reported by /detect-corners (0 = legacy)
"""

import json
import logging

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse

from services.corner_detector import CornerPoint
from services.omr_service import detect_bubbles
from services.perspective_service import correct_perspective

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/detect-bubbles")
async def detect_bubbles_endpoint(
    file: UploadFile = File(...),
    corners_json: str = Form(...),
    questions: int = Form(20),
    detection_image_width: int = Form(0),
    detection_image_height: int = Form(0),
) -> JSONResponse:
    image_bytes = await file.read()
    corners_data = json.loads(corners_json)
    corners = [CornerPoint(x=c["x"], y=c["y"]) for c in corners_data]

    logger.info(
        "POST /detect-bubbles questions=%d corners=%d detection_frame=%dx%d image_size=%d",
        questions, len(corners), detection_image_width, detection_image_height, len(image_bytes),
    )

    corrected = correct_perspective(
        image_bytes,
        corners,
        detection_image_width=detection_image_width,
        detection_image_height=detection_image_height,
    )
    results = detect_bubbles(corrected, questions=questions)

    return JSONResponse(content={
        "detected": any(r.answer is not None for r in results),
        "answers": [r.to_dict() for r in results],
    })
