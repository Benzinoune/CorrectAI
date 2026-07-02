"""
Perspective correction service.

Takes the four detected corners (in detection-image coordinates) and the
original image bytes, scales the corners back to the original image
resolution, then applies a perspective warp to produce a top-down,
flat crop of the answer sheet with NO background around it.

This is the image that gets saved as the scanned copy and fed to OCR/OMR.

Debug images are always saved to backend-ai/debug/warped_output.jpg so the
warp result can be inspected after every request.
"""

from pathlib import Path

import cv2
import numpy as np

from .corner_detector import CornerPoint

_DEBUG_DIR = Path(__file__).resolve().parent.parent / "debug"


def _debug_save(name: str, image: np.ndarray) -> None:
    try:
        _DEBUG_DIR.mkdir(parents=True, exist_ok=True)
        path = str(_DEBUG_DIR / name)
        cv2.imwrite(path, image)
        print(f"[perspective_debug] saved {path}  shape={image.shape}")
    except Exception as exc:
        print(f"[perspective_debug] WARN: could not save {name}: {exc}")


def correct_perspective(
    image_bytes: bytes,
    corners: list[CornerPoint],
    detection_image_width: int = 0,
    detection_image_height: int = 0,
    output_dpi_target_short_side: int = 1000,
) -> bytes:
    """
    Apply perspective correction to obtain a top-down view of the sheet.

    Parameters
    ----------
    image_bytes : bytes
        The ORIGINAL (full-resolution) image captured by the camera.
    corners : list[CornerPoint]
        The four corners returned by detect_corners().  These are in
        *detection-image* coordinates (the resized image used internally
        by corner_detector.py).
    detection_image_width / detection_image_height : int
        The dimensions of the image that was actually used for detection.
        When both are > 0, the corners are scaled to the original image
        resolution before the warp is applied.  If 0, the corners are
        assumed to already be in the original image coordinate space
        (legacy behaviour).
    output_dpi_target_short_side : int
        The short side of the output image in pixels.  The long side is
        computed from the detected document dimensions to preserve the
        aspect ratio.  Set to 0 to keep native warp resolution.

    Returns
    -------
    bytes
        JPEG-encoded top-down view of the document with NO background.
    """
    np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        print("[perspective] WARN: cv2.imdecode failed – returning original bytes")
        return image_bytes

    orig_h, orig_w = image.shape[:2]
    print(f"[perspective] ── correct_perspective START ────────────────────────")
    print(f"[perspective] original image: {orig_w}x{orig_h}")
    print(f"[perspective] detection frame: {detection_image_width}x{detection_image_height}")
    print(f"[perspective] raw corners (detection space): {[(c.x, c.y) for c in corners]}")

    # ── Scale corners from detection space to original image space ───────────
    if detection_image_width > 0 and detection_image_height > 0:
        scale_x = orig_w / detection_image_width
        scale_y = orig_h / detection_image_height
        print(f"[perspective] scaling corners: scale_x={scale_x:.4f} scale_y={scale_y:.4f}")
        scaled_corners = [
            CornerPoint(x=int(c.x * scale_x), y=int(c.y * scale_y))
            for c in corners
        ]
    else:
        print("[perspective] WARN: detection_image dimensions not provided – corners assumed in original space")
        scaled_corners = corners

    print(f"[perspective] scaled corners (original space): {[(c.x, c.y) for c in scaled_corners]}")

    # ── Draw corners on original image for debug ──────────────────────────────
    orig_debug = image.copy()
    pts_debug = np.array([(c.x, c.y) for c in scaled_corners], dtype=np.int32)
    cv2.polylines(orig_debug, [pts_debug], isClosed=True, color=(0, 255, 0), thickness=4)
    labels = ["TL", "TR", "BR", "BL"]
    for pt, lbl in zip(pts_debug, labels):
        cv2.circle(orig_debug, tuple(pt), 12, (0, 0, 255), -1)
        cv2.putText(orig_debug, f"{lbl}({pt[0]},{pt[1]})", (pt[0] + 8, pt[1] - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
    _debug_save("90_corners_on_original.jpg", orig_debug)

    # ── Build source quad ────────────────────────────────────────────────────
    src = np.array([(c.x, c.y) for c in scaled_corners], dtype=np.float32)

    # ── Compute output dimensions from document edge lengths ─────────────────
    # top-left, top-right, bottom-right, bottom-left order (from _order_corners)
    tl, tr, br, bl = src[0], src[1], src[2], src[3]

    width_top    = float(np.linalg.norm(tr - tl))
    width_bottom = float(np.linalg.norm(br - bl))
    height_left  = float(np.linalg.norm(bl - tl))
    height_right = float(np.linalg.norm(br - tr))

    doc_width  = max(width_top, width_bottom)
    doc_height = max(height_left, height_right)

    print(
        f"[perspective] document edge sizes: width_top={width_top:.0f}px "
        f"width_bottom={width_bottom:.0f}px height_left={height_left:.0f}px "
        f"height_right={height_right:.0f}px"
    )
    print(
        f"[perspective] final doc_width={doc_width:.0f}px doc_height={doc_height:.0f}px "
        f"aspect={doc_width/max(doc_height,1):.3f}"
    )

    # Guard against degenerate warp (document detected as a sliver)
    if doc_width < 10 or doc_height < 10:
        print(f"[perspective] WARN: degenerate document size ({doc_width:.0f}x{doc_height:.0f}), returning original")
        return image_bytes

    # Optionally normalise output resolution
    if output_dpi_target_short_side > 0 and min(doc_width, doc_height) > 0:
        short = min(doc_width, doc_height)
        long  = max(doc_width, doc_height)
        if short < output_dpi_target_short_side:
            factor = output_dpi_target_short_side / short
            doc_width  *= factor
            doc_height *= factor
            print(f"[perspective] upscaled output to {doc_width:.0f}x{doc_height:.0f} (factor={factor:.3f})")
        elif long > 4000:
            factor = 4000 / long
            doc_width  *= factor
            doc_height *= factor
            print(f"[perspective] downscaled output to {doc_width:.0f}x{doc_height:.0f} (factor={factor:.3f})")

    out_w = max(int(doc_width), 1)
    out_h = max(int(doc_height), 1)

    # ── Build destination quad (flat rectangle) ───────────────────────────────
    dst = np.array([
        [0,         0        ],
        [out_w - 1, 0        ],
        [out_w - 1, out_h - 1],
        [0,         out_h - 1],
    ], dtype=np.float32)

    # ── Apply perspective warp ────────────────────────────────────────────────
    matrix = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(
        image, matrix, (out_w, out_h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(255, 255, 255),
    )

    print(f"[perspective] warped output: {out_w}x{out_h}")

    # Always save the warped output for inspection
    _debug_save("91_warped_output.jpg", warped)

    _, buffer = cv2.imencode(".jpg", warped, [cv2.IMWRITE_JPEG_QUALITY, 92])
    result = buffer.tobytes()
    print(f"[perspective] JPEG encoded: {len(result)} bytes")
    print(f"[perspective] ── correct_perspective END ────────────────────────")
    return result
