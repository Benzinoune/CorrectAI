"""
Route: /scan  (unified endpoint)

One-shot pipeline:
  1. Corner detection (or use pre-detected corners from the caller)
  2. Apply perspective correction  →  flat, cropped document image
  3. Run OCR  (student info extraction)
  4. Run OMR  (bubble detection)
  5. Return everything in one JSON response, including the warped image
     as a base64-encoded JPEG that the frontend saves as the scanned copy.

Optional form fields
--------------------
corners_json           – JSON array of {x,y} objects already detected by
                          /detect-corners.  When provided (non-empty), corner
                          detection is SKIPPED and these corners are used
                          directly for the perspective warp.  This eliminates
                          the double-detection inconsistency between the low-res
                          detection snapshot and the high-res capture image.
detection_image_width  – width of the image used when corners were detected
detection_image_height – height of the image used when corners were detected

Parameters (multipart/form-data)
---------------------------------
file        – original camera image (full resolution)
questions   – number of questions (int, default 20)
lang        – Tesseract language (str, default "fra+eng")
corners_json           – optional, see above
detection_image_width  – optional (required when corners_json is provided)
detection_image_height – optional (required when corners_json is provided)
"""

import base64
import json
import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from services.corner_detector import CornerPoint, detect_corners
from services.ocr_service import OCRConfig, extract_student_info
from services.omr_service import detect_bubbles
from services.perspective_service import correct_perspective

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/scan")
async def scan_endpoint(
    file: UploadFile = File(...),
    questions: int = Form(20),
    lang: str = Form("fra+eng"),
    corners_json: str = Form(""),
    detection_image_width: int = Form(0),
    detection_image_height: int = Form(0),
) -> JSONResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Fichier image vide")

    logger.info(
        "POST /scan file=%s size=%d questions=%d lang=%s "
        "corners_provided=%s detection_frame=%dx%d",
        file.filename, len(image_bytes), questions, lang,
        bool(corners_json.strip()), detection_image_width, detection_image_height,
    )

    # ── Step 1: Corner detection or use pre-detected corners ─────────────────
    predetected_corners: list[CornerPoint] = []

    if corners_json.strip():
        try:
            corners_data = json.loads(corners_json)
            predetected_corners = [CornerPoint(x=int(c["x"]), y=int(c["y"])) for c in corners_data]
        except Exception as exc:
            logger.warning("POST /scan: failed to parse corners_json=%r – %s", corners_json[:100], exc)
            predetected_corners = []

    if len(predetected_corners) == 4:
        # Use the corners provided by the client (from the earlier /detect-corners call)
        logger.info(
            "POST /scan: using_predetected_corners corners=%s detection_frame=%dx%d",
            [(c.x, c.y) for c in predetected_corners],
            detection_image_width,
            detection_image_height,
        )
        corners = predetected_corners
        det_w = detection_image_width
        det_h = detection_image_height
        message = "Feuille détectée (pré-détectée)"
    else:
        # Fall back to running corner detection on the high-res image
        logger.info("POST /scan: running_corner_detection on full-res image (%d bytes)", len(image_bytes))
        detection = detect_corners(image_bytes)
        if not detection.detected or len(detection.corners) != 4:
            logger.info("POST /scan: corner detection failed – %s", detection.message)
            return JSONResponse(content={
                "detected": False,
                "corners": [],
                "message": detection.message,
                "warped_image_base64": None,
                "ocr": None,
                "omr": None,
            })
        corners = detection.corners
        det_w = detection.detection_image_width
        det_h = detection.detection_image_height
        message = detection.message
        logger.info(
            "POST /scan: corners detected – %s (detection_frame=%dx%d)",
            [(c.x, c.y) for c in corners],
            det_w,
            det_h,
        )

    # ── Step 2: Perspective correction ───────────────────────────────────────
    warped_bytes = correct_perspective(
        image_bytes,
        corners,
        detection_image_width=det_w,
        detection_image_height=det_h,
    )
    warped_b64 = base64.b64encode(warped_bytes).decode("utf-8")

    # ── Step 3: OCR (on the warped image – no coordinate scaling needed) ─────
    ocr_config = OCRConfig(lang=lang)
    student_info = extract_student_info(warped_bytes, config=ocr_config)

    # ── Step 4: OMR (on the warped image) ────────────────────────────────────
    bubble_results = detect_bubbles(warped_bytes, questions=questions)

    # ── Assemble response ────────────────────────────────────────────────────
    response = {
        "detected": True,
        "corners": [{"x": c.x, "y": c.y} for c in corners],
        "detection_image_width": det_w,
        "detection_image_height": det_h,
        "message": message,
        # base64 JPEG – the frontend saves this as the imageUri for the copy
        "warped_image_base64": warped_b64,
        "ocr": {
            "extracted": len(student_info.missing_fields) < 3,
            **student_info.to_dict(),
        },
        "omr": {
            "detected": any(r.answer is not None for r in bubble_results),
            "answers": [r.to_dict() for r in bubble_results],
        },
    }

    logger.info(
        "POST /scan: success ocr_extracted=%s omr_detected=%s warped_size=%d",
        response["ocr"]["extracted"],
        response["omr"]["detected"],
        len(warped_bytes),
    )
    return JSONResponse(content=response)
