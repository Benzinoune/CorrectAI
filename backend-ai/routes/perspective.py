"""
Route: /perspective-correct

Apply perspective correction to obtain a top-down view of the detected sheet.
Returns JPEG bytes of the flat, cropped document (no surrounding background).

Parameters
----------
file                   – original camera image (full resolution)
corners_json           – JSON array of {x, y} corner objects
                         (in detection-image coordinates from /detect-corners)
detection_image_width  – width reported by /detect-corners  (0 = legacy)
detection_image_height – height reported by /detect-corners (0 = legacy)
"""

import json
import logging

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response

from services.corner_detector import CornerPoint
from services.perspective_service import correct_perspective

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/perspective-correct")
async def perspective_correct_endpoint(
    file: UploadFile = File(...),
    corners_json: str = Form(...),
    detection_image_width: int = Form(0),
    detection_image_height: int = Form(0),
) -> Response:
    image_bytes = await file.read()
    corners_data = json.loads(corners_json)
    corners = [CornerPoint(x=c["x"], y=c["y"]) for c in corners_data]

    logger.info(
        "POST /perspective-correct corners=%d detection_frame=%dx%d image_size=%d",
        len(corners), detection_image_width, detection_image_height, len(image_bytes),
    )

    result = correct_perspective(
        image_bytes,
        corners,
        detection_image_width=detection_image_width,
        detection_image_height=detection_image_height,
    )
    return Response(content=result, media_type="image/jpeg")
