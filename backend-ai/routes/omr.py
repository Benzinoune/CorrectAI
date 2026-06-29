"""
Route: /detect-bubbles
Detect filled bubbles (OMR) in the answer sheet.
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
) -> JSONResponse:
    image_bytes = await file.read()
    corners_data = json.loads(corners_json)
    corners = [CornerPoint(x=c["x"], y=c["y"]) for c in corners_data]

    corrected = correct_perspective(image_bytes, corners)
    results = detect_bubbles(corrected, questions=questions)

    return JSONResponse(content={
        "detected": any(r.answer is not None for r in results),
        "answers": [r.to_dict() for r in results],
    })
