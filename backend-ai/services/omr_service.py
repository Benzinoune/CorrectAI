import math
from typing import Any

import cv2
import numpy as np


class BubbleResult:
    def __init__(self, question: int, answer: str | None, confidence: float):
        self.question = question
        self.answer = answer
        self.confidence = confidence

    def to_dict(self) -> dict[str, Any]:
        return {
            "question": self.question,
            "answer": self.answer,
            "confidence": round(self.confidence, 2),
        }


class _BubbleCandidate:
    def __init__(self, cx: float, cy: float, radius: float, contour: np.ndarray):
        self.cx = cx
        self.cy = cy
        self.radius = radius
        self.contour = contour


def _find_bubble_contours(
    gray: np.ndarray,
    min_radius: int = 8,
    max_radius: int = 30,
) -> list[_BubbleCandidate]:
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 4
    )

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    bubbles: list[_BubbleCandidate] = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < math.pi * min_radius * min_radius * 0.5:
            continue
        if area > math.pi * max_radius * max_radius * 1.5:
            continue

        perimeter = cv2.arcLength(cnt, closed=True)
        if perimeter == 0:
            continue
        circularity = 4 * math.pi * area / (perimeter * perimeter)
        if circularity < 0.6:
            continue

        (cx, cy), r = cv2.minEnclosingCircle(cnt)
        if r < min_radius or r > max_radius:
            continue

        bubbles.append(_BubbleCandidate(cx=cx, cy=cy, radius=r, contour=cnt))

    return bubbles


def _cluster_into_rows(
    bubbles: list[_BubbleCandidate],
    y_tolerance: int = 20,
) -> list[list[_BubbleCandidate]]:
    sorted_bubbles = sorted(bubbles, key=lambda b: b.cy)
    rows: list[list[_BubbleCandidate]] = []
    current_row: list[_BubbleCandidate] = []
    current_y = -1

    for bubble in sorted_bubbles:
        y = bubble.cy
        if current_y < 0:
            current_y = y
            current_row.append(bubble)
        elif abs(y - current_y) < y_tolerance:
            current_row.append(bubble)
        else:
            if current_row:
                current_row.sort(key=lambda b: b.cx)
                rows.append(current_row)
            current_row = [bubble]
            current_y = y

    if current_row:
        current_row.sort(key=lambda b: b.cx)
        rows.append(current_row)

    return rows


def _is_bubble_filled(
    gray: np.ndarray,
    contour: np.ndarray,
    fill_threshold: float = 0.45,
) -> tuple[bool, float]:
    mask = np.zeros(gray.shape, dtype=np.uint8)
    cv2.drawContours(mask, [contour], -1, 255, -1)

    mean_val = cv2.mean(gray, mask=mask)[0]
    inv_val = 255 - mean_val
    fill_ratio = inv_val / 255.0

    return fill_ratio > fill_threshold, fill_ratio


_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']


def detect_bubbles(image_bytes: bytes, questions: int = 20) -> list[BubbleResult]:
    np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        return []

    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    bubbles = _find_bubble_contours(gray)
    if not bubbles:
        return [BubbleResult(question=i + 1, answer=None, confidence=0.0) for i in range(questions)]

    rows = _cluster_into_rows(bubbles)

    rows = sorted(rows, key=lambda r: r[0].cy)[:questions]

    max_columns = max(len(row) for row in rows) if rows else 5

    results: list[BubbleResult] = []
    for row_idx, row in enumerate(rows):
        row.sort(key=lambda b: b.cx)

        detected_answer: str | None = None
        best_confidence = 0.0

        for col_idx, candidate in enumerate(row):
            is_filled, fill_ratio = _is_bubble_filled(gray, candidate.contour)
            if is_filled and fill_ratio > best_confidence:
                col_label = _LABELS[col_idx] if col_idx < len(_LABELS) else f"Q{col_idx}"
                detected_answer = col_label
                best_confidence = fill_ratio

        results.append(BubbleResult(
            question=row_idx + 1,
            answer=detected_answer,
            confidence=best_confidence,
        ))

    remaining = questions - len(results)
    for i in range(remaining):
        results.append(BubbleResult(question=len(results) + 1, answer=None, confidence=0.0))

    return results
