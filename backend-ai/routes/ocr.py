"""
Route: /extract-student-info
Extract student name and matricule using OCR.
"""

import json
import logging

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse

from services.corner_detector import CornerPoint
from services.ocr_service import extract_student_info
from services.perspective_service import correct_perspective

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/extract-student-info")
async def extract_student_info_endpoint(
    file: UploadFile = File(...),
    corners_json: str = Form(...),
) -> JSONResponse:
    image_bytes = await file.read()
    corners_data = json.loads(corners_json)
    corners = [CornerPoint(x=c["x"], y=c["y"]) for c in corners_data]

    corrected = correct_perspective(image_bytes, corners)
    info = extract_student_info(corrected)

    return JSONResponse(content={
        "extracted": info.name is not None,
        **info.to_dict(),
    })
