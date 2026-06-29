"""
Route: /perspective-correct
Apply perspective correction to the detected sheet.
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
) -> Response:
    image_bytes = await file.read()
    corners_data = json.loads(corners_json)
    corners = [CornerPoint(x=c["x"], y=c["y"]) for c in corners_data]

    result = correct_perspective(image_bytes, corners)
    return Response(content=result, media_type="image/jpeg")
