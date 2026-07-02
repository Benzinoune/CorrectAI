"""
Route: /extract-student-info

Extract student name, matricule, and class using OCR on the perspective-
corrected answer sheet.

Parameters
----------
file                   – original camera image (full resolution)
corners_json           – JSON array of {x, y} corner objects
                         (in detection-image coordinates from /detect-corners)
lang                   – Tesseract language code(s), default "fra+eng"
detection_image_width  – width reported by /detect-corners  (0 = legacy)
detection_image_height – height reported by /detect-corners (0 = legacy)
"""

import json
import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from services.corner_detector import CornerPoint
from services.ocr_service import OCRConfig, extract_student_info
from services.perspective_service import correct_perspective

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/extract-student-info")
async def extract_student_info_endpoint(
    file: UploadFile = File(...),
    corners_json: str = Form(...),
    lang: str = Form("fra+eng"),
    detection_image_width: int = Form(0),
    detection_image_height: int = Form(0),
) -> JSONResponse:
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Fichier image vide")

    corners_data = json.loads(corners_json)
    corners = [CornerPoint(x=c["x"], y=c["y"]) for c in corners_data]

    logger.info(
        "POST /extract-student-info corners=%d detection_frame=%dx%d image_size=%d lang=%s",
        len(corners), detection_image_width, detection_image_height, len(image_bytes), lang,
    )

    corrected = correct_perspective(
        image_bytes,
        corners,
        detection_image_width=detection_image_width,
        detection_image_height=detection_image_height,
    )

    config = OCRConfig(lang=lang)
    info = extract_student_info(corrected, config=config)

    return JSONResponse(content={
        "extracted": len(info.missing_fields) < 3,
        **info.to_dict(),
    })
