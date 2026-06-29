"""
OpenCV-based corner detection for answer sheet quadrilateral extraction.

Pipeline:
  1. Convert image to grayscale
  2. Apply Gaussian Blur
  3. Detect edges using Canny algorithm
  4. Find contours
  5. Detect the largest quadrilateral (answer sheet)
  6. Extract and return the four corners
"""

from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np


@dataclass
class CornerPoint:
    x: int
    y: int


@dataclass
class DetectionResult:
    detected: bool
    corners: list[CornerPoint]
    message: str


def _resize_if_large(image: np.ndarray, max_dim: int = 2048) -> np.ndarray:
    h, w = image.shape[:2]
    largest = max(h, w)
    if largest <= max_dim:
        return image
    scale = max_dim / largest
    return cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def _order_corners(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    d = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(d)]
    rect[3] = pts[np.argmax(d)]
    return rect


def _is_valid_sheet(contour: np.ndarray, image_area: float) -> bool:
    peri = cv2.arcLength(contour, closed=True)
    approx = cv2.approxPolyDP(contour, epsilon=0.02 * peri, closed=True)
    if len(approx) != 4:
        return False
    area = cv2.contourArea(approx)
    if area < image_area * 0.15 or area > image_area * 0.98:
        return False
    return True


def detect_corners(
    image_bytes: bytes,
    gaussian_ksize: int = 5,
    canny_low: int = 50,
    canny_high: int = 150,
) -> DetectionResult:
    try:
        np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None:
            return DetectionResult(detected=False, corners=[], message="Impossible de décoder l'image")

        image = _resize_if_large(image)
        h, w = image.shape[:2]
        image_area = h * w

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (gaussian_ksize, gaussian_ksize), 0)
        edges = cv2.Canny(blurred, canny_low, canny_high)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return DetectionResult(detected=False, corners=[], message="Aucun contour détecté")

        contours = sorted(contours, key=cv2.contourArea, reverse=True)

        sheet_contour: Optional[np.ndarray] = None
        for contour in contours:
            if _is_valid_sheet(contour, image_area):
                sheet_contour = contour
                break

        if sheet_contour is None:
            return DetectionResult(detected=False, corners=[], message="Aucune feuille détectée")

        peri = cv2.arcLength(sheet_contour, closed=True)
        approx = cv2.approxPolyDP(sheet_contour, epsilon=0.02 * peri, closed=True)
        ordered = _order_corners(approx.reshape(4, 2))

        corners = [CornerPoint(x=int(pt[0]), y=int(pt[1])) for pt in ordered]
        return DetectionResult(detected=True, corners=corners, message="Feuille détectée")

    except Exception as exc:
        return DetectionResult(detected=False, corners=[], message=f"Erreur de détection : {exc!s}")


def draw_corners(image_bytes: bytes, corners: list[CornerPoint]) -> bytes:
    np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        return image_bytes

    pts = np.array([(c.x, c.y) for c in corners], dtype=np.int32)
    cv2.polylines(image, [pts], isClosed=True, color=(0, 255, 0), thickness=3)
    for i, pt in enumerate(pts):
        cv2.circle(image, tuple(pt), 8, (108, 92, 255), -1)
        cv2.putText(image, str(i + 1), (pt[0] + 10, pt[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (108, 92, 255), 2)

    _, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return buffer.tobytes()
