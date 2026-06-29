"""
Perspective correction service.

Takes the four detected corners and applies a perspective transform
to obtain a top-down, rectangular view of the answer sheet.
"""

import cv2
import numpy as np

from .corner_detector import CornerPoint


def correct_perspective(image_bytes: bytes, corners: list[CornerPoint]) -> bytes:
    """
    Apply perspective correction to obtain a top-down view of the sheet.

    Returns the warped image as JPEG bytes.
    """
    np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        return image_bytes

    src = np.array([(c.x, c.y) for c in corners], dtype=np.float32)

    width = int(max(
        np.linalg.norm(src[1] - src[0]),
        np.linalg.norm(src[2] - src[3]),
    ))
    height = int(max(
        np.linalg.norm(src[3] - src[0]),
        np.linalg.norm(src[2] - src[1]),
    ))

    dst = np.array([
        [0, 0],
        [width - 1, 0],
        [width - 1, height - 1],
        [0, height - 1],
    ], dtype=np.float32)

    matrix = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(image, matrix, (width, height))

    _, buffer = cv2.imencode(".jpg", warped, [cv2.IMWRITE_JPEG_QUALITY, 92])
    return buffer.tobytes()
