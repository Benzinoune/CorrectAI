"""
OCR service for extracting student information.

Extracts name, matricule, and class from predefined ROI regions
of a perspective-corrected answer sheet image using Tesseract OCR.

Pipeline per ROI:
  1. Crop region from perspective-corrected image
  2. Convert to grayscale
  3. Denoise (fastNlMeansDenoising)
  4. Adaptive threshold (Gaussian, inverse binary)
  5. Upscale for better handwriting recognition
  6. Run Tesseract LSTM (OEM 1) with fra+eng
  7. Sanitize output text
  8. Aggregate confidence from per-word data
"""

from dataclasses import dataclass, field
from typing import Any, Optional

import cv2
import numpy as np
import pytesseract
from pytesseract import TesseractError, TesseractNotFoundError
from PIL import Image


# ---------- Configuration ----------


@dataclass
class RegionOfInterest:
    x: float
    y: float
    w: float
    h: float
    label: str
    psm: int = 7


@dataclass
class OCRConfig:
    lang: str = "fra+eng"
    default_psm: int = 7
    scale_factor: float = 2.5
    denoise_h: int = 10
    threshold_block: int = 31
    threshold_c: float = 10.0
    tesseract_path: Optional[str] = None

    rois: list[RegionOfInterest] = field(default_factory=lambda: [
        RegionOfInterest(x=0.04, y=0.02, w=0.52, h=0.07, label="name", psm=7),
        RegionOfInterest(x=0.04, y=0.11, w=0.42, h=0.06, label="matricule", psm=7),
        RegionOfInterest(x=0.52, y=0.02, w=0.44, h=0.06, label="class_name", psm=7),
    ])


# ---------- Result ----------


@dataclass
class StudentInfo:
    name: Optional[str]
    matricule: Optional[str]
    class_name: Optional[str]
    confidence: float
    missing_fields: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "matricule": self.matricule,
            "class_name": self.class_name,
            "confidence": round(self.confidence, 2),
            "missing_fields": self.missing_fields,
        }


# ---------- Helpers ----------


def _preprocess_roi(roi_bgr: np.ndarray, config: OCRConfig) -> np.ndarray:
    gray = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, h=config.denoise_h)
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, config.threshold_block, config.threshold_c,
    )
    if abs(config.scale_factor - 1.0) > 0.01:
        h, w = thresh.shape
        thresh = cv2.resize(
            thresh, (int(w * config.scale_factor), int(h * config.scale_factor)),
            interpolation=cv2.INTER_CUBIC,
        )
    return thresh


def _ocr_region(roi_bgr: np.ndarray, config: OCRConfig, psm: int) -> tuple[str, float]:
    processed = _preprocess_roi(roi_bgr, config)
    pil_image = Image.fromarray(processed)
    custom_config = f"--psm {psm} --oem 1"
    data = pytesseract.image_to_data(
        pil_image, lang=config.lang, config=custom_config,
        output_type=pytesseract.Output.DICT,
    )
    words: list[str] = []
    confs: list[float] = []
    for text, conf in zip(data["text"], data["conf"]):
        text = text.strip()
        if text and conf > 0:
            words.append(text)
            confs.append(conf / 100.0)
    return " ".join(words), (sum(confs) / len(confs) if confs else 0.0)


def _sanitize(text: str) -> str:
    text = text.strip()
    text = " ".join(text.split())
    return text


# ---------- Main ----------


def extract_student_info(
    image_bytes: bytes,
    config: Optional[OCRConfig] = None,
) -> StudentInfo:
    if config is None:
        config = OCRConfig()

    if config.tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = config.tesseract_path

    np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        return StudentInfo(
            name=None, matricule=None, class_name=None,
            confidence=0.0,
            missing_fields=["name", "matricule", "class_name"],
        )

    h, w = image.shape[:2]
    field_map: dict[str, Optional[str]] = {}
    conf_sum = 0.0
    conf_count = 0

    for roi in config.rois:
        x1 = max(0, int(roi.x * w))
        y1 = max(0, int(roi.y * h))
        x2 = min(w, int((roi.x + roi.w) * w))
        y2 = min(h, int((roi.y + roi.h) * h))

        if x2 <= x1 or y2 <= y1:
            field_map[roi.label] = None
            continue

        crop = image[y1:y2, x1:x2]

        try:
            text, conf = _ocr_region(crop, config, psm=roi.psm)
            text = _sanitize(text)
            field_map[roi.label] = text if text else None
            if text:
                conf_sum += conf
                conf_count += 1
        except (TesseractNotFoundError, TesseractError):
            field_map[roi.label] = None
        except Exception:
            field_map[roi.label] = None

    overall_conf = conf_sum / conf_count if conf_count > 0 else 0.0
    missing = [k for k, v in field_map.items() if not v]

    return StudentInfo(
        name=field_map.get("name"),
        matricule=field_map.get("matricule"),
        class_name=field_map.get("class_name"),
        confidence=overall_conf,
        missing_fields=missing,
    )
