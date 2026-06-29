"""
OCR service for extracting student information.

Extracts name, matricule, and other text fields from the answer sheet.
"""

from typing import Any


class StudentInfo:
    def __init__(self, name: str | None, matricule: str | None, confidence: float):
        self.name = name
        self.matricule = matricule
        self.confidence = confidence

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "matricule": self.matricule,
            "confidence": round(self.confidence, 2),
        }


def extract_student_info(image_bytes: bytes) -> StudentInfo:
    """
    Extract student name and matricule from a corrected answer sheet.

    Args:
        image_bytes: Perspective-corrected sheet image.

    Returns:
        StudentInfo with extracted name and matricule.

    Note: This is a stub for future OCR integration.
    """
    return StudentInfo(name=None, matricule=None, confidence=0.0)
