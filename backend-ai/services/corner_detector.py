"""
OpenCV-based corner detection for answer sheet quadrilateral extraction.

Pipeline (tried in order until one succeeds):
  A. CLAHE equalisation  → Adaptive threshold  → morph-close  → contours
  B. Canny edges         → dilate              → contours
  C. Otsu threshold      → morph-close         → contours
  D. Aggressive blur + bilateral filter + Canny (for noisy / low-contrast images)

Debug images are ALWAYS saved to backend-ai/debug/ so you can inspect what
OpenCV actually sees on each request without restarting the server.

Every rejection reason is logged so you know exactly which stage fails.
"""

import os
import time
import traceback
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2
import numpy as np


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class CornerPoint:
    x: int
    y: int


@dataclass
class DetectionResult:
    detected: bool
    corners: list[CornerPoint]
    message: str
    # Width and height of the image that was actually used for
    # detection.  The caller uses these to scale corners back to
    # the original image resolution.
    detection_image_width: int = 0
    detection_image_height: int = 0


# ---------------------------------------------------------------------------
# Debug helpers
# ---------------------------------------------------------------------------

_DEBUG_DIR = Path(__file__).resolve().parent.parent / "debug"


def _debug_save(name: str, image: np.ndarray) -> None:
    """Always save debug images unconditionally – no env-var gate."""
    try:
        _DEBUG_DIR.mkdir(parents=True, exist_ok=True)
        path = str(_DEBUG_DIR / name)
        cv2.imwrite(path, image)
        print(f"[corner_debug] saved {path}  shape={image.shape}")
    except Exception as exc:
        print(f"[corner_debug] WARN: could not save {name}: {exc}")


# ---------------------------------------------------------------------------
# Image helpers
# ---------------------------------------------------------------------------

def _resize_for_detection(image: np.ndarray, target_long_side: int = 1024) -> np.ndarray:
    """
    Resize so the longest side is target_long_side.
    Returns the resized image.  Corner coordinates are returned in the
    resized-image space; the caller scales back using the ratios.
    """
    h, w = image.shape[:2]
    long_side = max(h, w)
    if long_side <= target_long_side:
        return image
    scale = target_long_side / long_side
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
    print(f"[corner] resize: {w}x{h} -> {new_w}x{new_h} (scale={scale:.3f})")
    return resized


# ---------------------------------------------------------------------------
# Corner ordering
# ---------------------------------------------------------------------------

def _order_corners(pts: np.ndarray) -> np.ndarray:
    """
    Order 4 points as: top-left, top-right, bottom-right, bottom-left.
    Uses the sum/diff trick which is robust for near-rectangular quads.
    """
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]   # top-left  (smallest x+y)
    rect[2] = pts[np.argmax(s)]   # bottom-right (largest x+y)
    d = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(d)]   # top-right  (smallest y-x)
    rect[3] = pts[np.argmax(d)]   # bottom-left (largest y-x)
    return rect


# ---------------------------------------------------------------------------
# Contour validation
# ---------------------------------------------------------------------------

def _is_valid_sheet(
    contour: np.ndarray,
    image_area: float,
    min_area_ratio: float = 0.03,
    max_area_ratio: float = 0.99,
    epsilon_ratio: float = 0.05,
) -> tuple[bool, str, Optional[np.ndarray]]:
    """
    Validate a contour as a document sheet.

    Returns (valid, reason_string, approx_4pts_or_None).
    The approx array is returned so the caller does not re-run approxPolyDP.

    Tuning notes
    ────────────
    • epsilon_ratio = 0.05  → tolerates moderately rounded physical corners
      without collapsing real quadrilaterals into triangles.
    • min_area_ratio = 0.03 → 3% of image area; allows documents held
      farther from the camera or held at a steeper angle.
    """
    peri = cv2.arcLength(contour, closed=True)
    if peri < 100:
        return False, f"perimeter={peri:.0f} < 100 (too small)", None

    approx = cv2.approxPolyDP(contour, epsilon=epsilon_ratio * peri, closed=True)
    vertices = len(approx)

    if vertices != 4:
        # Try a slightly tighter epsilon before giving up — sometimes a large
        # epsilon merges two sides into one.
        for alt_eps in [0.04, 0.03, 0.06, 0.07]:
            alt_approx = cv2.approxPolyDP(contour, epsilon=alt_eps * peri, closed=True)
            if len(alt_approx) == 4:
                approx = alt_approx
                vertices = 4
                print(f"[corner]   fallback epsilon={alt_eps:.2f} produced 4 vertices")
                break

    if vertices != 4:
        return False, f"vertices={vertices} (need 4, tried eps 0.03-0.07)", None

    area = cv2.contourArea(approx)
    area_ratio = area / image_area

    if area_ratio < min_area_ratio:
        return False, f"area_ratio={area_ratio:.4f} < {min_area_ratio} (document too small)", None
    if area_ratio > max_area_ratio:
        return False, f"area_ratio={area_ratio:.4f} > {max_area_ratio} (fills entire frame)", None

    # Convexity check – a document should be convex
    if not cv2.isContourConvex(approx):
        return False, "contour not convex", None

    # Aspect-ratio sanity: avoid detecting very thin or very wide shapes.
    # A document in perspective can have ratios from ~0.2 to ~5.0.
    x, y, bw, bh = cv2.boundingRect(approx)
    if bh == 0:
        return False, "degenerate bounding rect (h=0)", None
    aspect = bw / bh
    if aspect < 0.15 or aspect > 6.5:
        return False, f"aspect_ratio={aspect:.2f} (allowed 0.15-6.50)", None

    return True, f"area_ratio={area_ratio:.4f} vertices={vertices} aspect={aspect:.2f}", approx


# ---------------------------------------------------------------------------
# Contour search
# ---------------------------------------------------------------------------

def _detect_from_edges(
    edge_image: np.ndarray,
    image_area: float,
    label: str,
    min_area_ratio: float = 0.03,
) -> Optional[np.ndarray]:
    """
    Find the largest quadrilateral contour in an edge/binary image.
    Returns the raw contour (not approxPolyDP) if found, None otherwise.

    Logs rejection reason for every examined contour.
    """
    contours, _ = cv2.findContours(edge_image, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    print(f"[corner] {label}: total contours found={len(contours)}")

    if not contours:
        print(f"[corner] {label}: no contours at all")
        return None

    # Sort by area descending and examine top-30
    contours_sorted = sorted(contours, key=cv2.contourArea, reverse=True)[:30]

    print(f"[corner] {label}: examining top-{len(contours_sorted)} contours by area:")
    for i, c in enumerate(contours_sorted[:8]):
        area = cv2.contourArea(c)
        peri = cv2.arcLength(c, closed=True)
        # Quick vertex count at multiple epsilons for diagnosis
        v04 = len(cv2.approxPolyDP(c, 0.04 * peri, True))
        v05 = len(cv2.approxPolyDP(c, 0.05 * peri, True))
        v03 = len(cv2.approxPolyDP(c, 0.03 * peri, True))
        x, y, bw, bh = cv2.boundingRect(c)
        aspect = bw / bh if bh > 0 else 0
        print(
            f"  [{i}] area={int(area)} area_ratio={area/image_area:.4f} "
            f"perimeter={peri:.0f} vertices(eps 0.03/0.04/0.05)={v03}/{v04}/{v05} "
            f"aspect={aspect:.2f}"
        )

    for i, contour in enumerate(contours_sorted):
        area = cv2.contourArea(contour)
        valid, reason, _ = _is_valid_sheet(contour, image_area, min_area_ratio=min_area_ratio)
        if valid:
            print(f"[corner] {label}: ACCEPTED contour[{i}] area_ratio={area/image_area:.4f} → {reason}")
            return contour
        else:
            if i < 15:
                print(f"[corner] {label}: REJECTED contour[{i}] area_ratio={area/image_area:.4f} → {reason}")

    print(f"[corner] {label}: no valid sheet contour among {len(contours_sorted)} candidates")
    return None


# ---------------------------------------------------------------------------
# Finalisation
# ---------------------------------------------------------------------------

def _finalize_detection(sheet_contour: np.ndarray, label: str) -> DetectionResult:
    """
    Convert a validated raw contour to an ordered 4-corner DetectionResult.

    Uses epsilon=0.05 * perimeter (same as validation) so the vertex count
    is guaranteed to be 4 (validation already confirmed this).
    """
    peri = cv2.arcLength(sheet_contour, closed=True)
    # Try epsilon values in order until we get exactly 4 pts
    pts = None
    for eps in [0.05, 0.04, 0.03, 0.06, 0.07]:
        approx = cv2.approxPolyDP(sheet_contour, epsilon=eps * peri, closed=True)
        if len(approx) == 4:
            pts = approx.reshape(-1, 2).astype(np.float32)
            print(f"[corner] finalize: epsilon={eps:.2f} produced {len(pts)} points")
            break

    if pts is None or len(pts) != 4:
        print(f"[corner] WARN: finalize could not get 4 pts after approx, using convexHull")
        hull = cv2.convexHull(sheet_contour)
        peri2 = cv2.arcLength(hull, closed=True)
        for eps in [0.05, 0.04, 0.06, 0.03]:
            hull_approx = cv2.approxPolyDP(hull, eps * peri2, closed=True)
            if len(hull_approx) == 4:
                pts = hull_approx.reshape(-1, 2).astype(np.float32)
                break
        if pts is None or len(pts) != 4:
            # Last resort: bounding rect corners
            x, y, w, h = cv2.boundingRect(sheet_contour)
            pts = np.array([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], dtype=np.float32)
            print(f"[corner] WARN: using bounding rect corners")

    ordered = _order_corners(pts)
    corners = [CornerPoint(x=int(pt[0]), y=int(pt[1])) for pt in ordered]
    print(f"[corner] SUCCESS via {label}: corners={[(c.x, c.y) for c in corners]}")
    return DetectionResult(
        detected=True,
        corners=corners,
        message=f"Feuille détectée ({label})",
    )


# ---------------------------------------------------------------------------
# Failure debug image
# ---------------------------------------------------------------------------

def _save_failure_debug(det_image: np.ndarray, all_contours_by_pipeline: dict) -> None:
    """
    When ALL pipelines fail, save an annotated image showing the top-3
    largest contours found across all pipelines, with their areas labelled.
    """
    vis = det_image.copy()
    h, w = vis.shape[:2]
    image_area = float(w * h)

    # Gather all contours from all pipelines, sort by area
    all_contours = []
    for label, conts in all_contours_by_pipeline.items():
        for c in conts[:5]:
            all_contours.append((cv2.contourArea(c), label, c))
    all_contours.sort(key=lambda x: x[0], reverse=True)

    colors = [(0, 0, 255), (0, 165, 255), (0, 255, 255)]
    for idx, (area, label, cnt) in enumerate(all_contours[:3]):
        color = colors[idx % len(colors)]
        cv2.drawContours(vis, [cnt], -1, color, 2)
        M = cv2.moments(cnt)
        if M["m00"] > 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            cv2.putText(
                vis,
                f"{label} ar={area/image_area:.3f}",
                (max(cx - 60, 0), max(cy, 15)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1,
            )

    cv2.putText(vis, "ALL PIPELINES FAILED", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    _debug_save("98_all_pipelines_failed.jpg", vis)


# ---------------------------------------------------------------------------
# Main detection entry point
# ---------------------------------------------------------------------------

def detect_corners(
    image_bytes: bytes,
    gaussian_ksize: int = 5,
    canny_low: int = 20,
    canny_high: int = 80,
) -> DetectionResult:
    """
    Attempt to detect the four corners of an answer sheet in image_bytes.

    Debug images are ALWAYS saved to backend-ai/debug/ so failures can be
    diagnosed without any env-var or server restart.
    """
    t0 = time.perf_counter()
    det_w, det_h = 0, 0   # set as soon as we have a decoded image

    try:
        # ── 1. Decode ────────────────────────────────────────────────────────
        np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            print("[corner] FAIL: cv2.imdecode returned None – image bytes may be corrupt")
            return DetectionResult(
                detected=False, corners=[], message="Image non décodable",
                detection_image_width=0, detection_image_height=0,
            )

        orig_h, orig_w = image.shape[:2]
        print(f"[corner] ── detect_corners START ──────────────────────────────")
        print(f"[corner] received bytes={len(image_bytes)} decoded {orig_w}x{orig_h} channels={image.shape[2]}")

        _debug_save("01_original.jpg", image)

        # ── 2. Resize for detection (keep coords in detection space) ─────────
        det_image = _resize_for_detection(image, target_long_side=1024)
        det_h, det_w = det_image.shape[:2]
        image_area = float(det_w * det_h)

        _debug_save("02_resized.jpg", det_image)

        # ── 3. Grayscale ─────────────────────────────────────────────────────
        gray = cv2.cvtColor(det_image, cv2.COLOR_BGR2GRAY)
        _debug_save("03_grayscale.jpg", gray)
        print(
            f"[corner] gray: shape={gray.shape} min={int(gray.min())} "
            f"max={int(gray.max())} mean={gray.mean():.1f} std={gray.std():.1f}"
        )

        ksize = gaussian_ksize if gaussian_ksize % 2 == 1 else gaussian_ksize + 1

        # Collect top contours from each pipeline for the failure debug image
        pipeline_contours: dict = {}

        # ── 4. Pipeline A: CLAHE → Adaptive threshold ─────────────────────────
        print(f"[corner] ── Pipeline A: CLAHE + Adaptive Threshold ────────────")
        t_a = time.perf_counter()

        # CLAHE equalisation before blurring helps with uneven mobile lighting
        clahe_a = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray_a = clahe_a.apply(gray)
        _debug_save("04a_clahe.jpg", gray_a)

        blurred_a = cv2.GaussianBlur(gray_a, (ksize, ksize), 0)
        _debug_save("04a_blur_gaussian.jpg", blurred_a)

        thresh_a = cv2.adaptiveThreshold(
            blurred_a, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            blockSize=21, C=4,
        )
        _debug_save("05a_adaptive_thresh.jpg", thresh_a)

        kernel_a = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
        closed_a = cv2.morphologyEx(thresh_a, cv2.MORPH_CLOSE, kernel_a, iterations=2)
        _debug_save("06a_morph_close.jpg", closed_a)

        contour_vis_a = det_image.copy()
        conts_a, _ = cv2.findContours(closed_a, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(contour_vis_a, conts_a, -1, (0, 255, 0), 2)
        _debug_save("07a_contours_all.jpg", contour_vis_a)
        pipeline_contours["adaptive"] = sorted(conts_a, key=cv2.contourArea, reverse=True)[:5]

        sheet = _detect_from_edges(closed_a, image_area, "adaptive-thresh")
        print(f"[corner] Pipeline A done in {1000*(time.perf_counter()-t_a):.0f}ms")
        if sheet is not None:
            result = _finalize_detection(sheet, "adaptive-thresh")
            _save_final_debug(det_image, result.corners, "A")
            result.detection_image_width = det_w
            result.detection_image_height = det_h
            print(f"[corner] ── detect_corners END ({1000*(time.perf_counter()-t0):.0f} ms) ──")
            return result

        # ── 5. Pipeline B: Canny edges ───────────────────────────────────────
        print(f"[corner] ── Pipeline B: Canny ───────────────────────────────")
        t_b = time.perf_counter()

        bilateral = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)
        _debug_save("04b_bilateral.jpg", bilateral)

        edges_b = cv2.Canny(bilateral, canny_low, canny_high)
        _debug_save("05b_canny.jpg", edges_b)
        edge_px = int(edges_b.sum() / 255)
        print(f"[corner] canny: low={canny_low} high={canny_high} edge_pixels={edge_px} ratio={edge_px/image_area:.5f}")

        if edge_px < 200:
            print(f"[corner] canny: too few edge pixels ({edge_px}), retrying with 10/40")
            edges_b = cv2.Canny(bilateral, 10, 40)
            _debug_save("05b_canny_retry.jpg", edges_b)
            edge_px = int(edges_b.sum() / 255)
            print(f"[corner] canny retry: edge_pixels={edge_px}")

        kernel_b = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        edges_dilated_b = cv2.dilate(edges_b, kernel_b, iterations=2)
        _debug_save("06b_canny_dilated.jpg", edges_dilated_b)

        contour_vis_b = det_image.copy()
        conts_b, _ = cv2.findContours(edges_dilated_b, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(contour_vis_b, conts_b, -1, (0, 255, 0), 2)
        _debug_save("07b_contours_all.jpg", contour_vis_b)
        pipeline_contours["canny"] = sorted(conts_b, key=cv2.contourArea, reverse=True)[:5]

        sheet = _detect_from_edges(edges_dilated_b, image_area, "canny")
        print(f"[corner] Pipeline B done in {1000*(time.perf_counter()-t_b):.0f}ms")
        if sheet is not None:
            result = _finalize_detection(sheet, "canny")
            _save_final_debug(det_image, result.corners, "B")
            result.detection_image_width = det_w
            result.detection_image_height = det_h
            print(f"[corner] ── detect_corners END ({1000*(time.perf_counter()-t0):.0f} ms) ──")
            return result

        # ── 6. Pipeline C: Otsu threshold ────────────────────────────────────
        print(f"[corner] ── Pipeline C: Otsu Threshold ─────────────────────")
        t_c = time.perf_counter()

        blurred_c = cv2.GaussianBlur(gray, (ksize, ksize), 0)
        _, otsu_c = cv2.threshold(blurred_c, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        _debug_save("04c_otsu.jpg", otsu_c)

        kernel_c = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
        closed_c = cv2.morphologyEx(otsu_c, cv2.MORPH_CLOSE, kernel_c, iterations=2)
        _debug_save("05c_otsu_morph.jpg", closed_c)

        contour_vis_c = det_image.copy()
        conts_c, _ = cv2.findContours(closed_c, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(contour_vis_c, conts_c, -1, (0, 255, 0), 2)
        _debug_save("07c_contours_all.jpg", contour_vis_c)
        pipeline_contours["otsu"] = sorted(conts_c, key=cv2.contourArea, reverse=True)[:5]

        sheet = _detect_from_edges(closed_c, image_area, "otsu")
        print(f"[corner] Pipeline C done in {1000*(time.perf_counter()-t_c):.0f}ms")
        if sheet is not None:
            result = _finalize_detection(sheet, "otsu")
            _save_final_debug(det_image, result.corners, "C")
            result.detection_image_width = det_w
            result.detection_image_height = det_h
            print(f"[corner] ── detect_corners END ({1000*(time.perf_counter()-t0):.0f} ms) ──")
            return result

        # ── 7. Pipeline D: CLAHE + aggressive Canny for bad lighting ─────────
        print(f"[corner] ── Pipeline D: Aggressive CLAHE + Canny ────────────")
        t_d = time.perf_counter()

        clahe_d = cv2.createCLAHE(clipLimit=3.5, tileGridSize=(8, 8))
        gray_eq = clahe_d.apply(gray)
        _debug_save("04d_clahe.jpg", gray_eq)

        blurred_d = cv2.GaussianBlur(gray_eq, (11, 11), 0)
        edges_d = cv2.Canny(blurred_d, 10, 50)
        _debug_save("05d_canny_clahe.jpg", edges_d)

        kernel_d = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        dilated_d = cv2.dilate(edges_d, kernel_d, iterations=3)
        _debug_save("06d_dilated.jpg", dilated_d)

        contour_vis_d = det_image.copy()
        conts_d, _ = cv2.findContours(dilated_d, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(contour_vis_d, conts_d, -1, (0, 255, 0), 2)
        _debug_save("07d_contours_all.jpg", contour_vis_d)
        pipeline_contours["clahe-canny"] = sorted(conts_d, key=cv2.contourArea, reverse=True)[:5]

        # More lenient area threshold for this last pipeline
        sheet = _detect_from_edges(dilated_d, image_area, "clahe-canny", min_area_ratio=0.02)
        print(f"[corner] Pipeline D done in {1000*(time.perf_counter()-t_d):.0f}ms")
        if sheet is not None:
            result = _finalize_detection(sheet, "clahe-canny")
            _save_final_debug(det_image, result.corners, "D")
            result.detection_image_width = det_w
            result.detection_image_height = det_h
            print(f"[corner] ── detect_corners END ({1000*(time.perf_counter()-t0):.0f} ms) ──")
            return result

        # ── 8. All pipelines exhausted ────────────────────────────────────────
        print(f"[corner] ALL PIPELINES FAILED – no sheet contour found in any of A/B/C/D")
        _save_failure_debug(det_image, pipeline_contours)
        print(f"[corner] ── detect_corners END ({1000*(time.perf_counter()-t0):.0f} ms) ──")
        return DetectionResult(
            detected=False, corners=[], message="Aucune feuille détectée",
            detection_image_width=det_w, detection_image_height=det_h,
        )

    except Exception:
        tb = traceback.format_exc()
        print(f"[corner] EXCEPTION:\n{tb}")
        return DetectionResult(
            detected=False, corners=[], message=f"Erreur: {tb[:200]}",
            detection_image_width=det_w, detection_image_height=det_h,
        )


# ---------------------------------------------------------------------------
# Final result debug image
# ---------------------------------------------------------------------------

def _save_final_debug(image: np.ndarray, corners: list[CornerPoint], pipeline: str) -> None:
    """Draw detected corners on the image and save it."""
    vis = image.copy()
    pts = np.array([(c.x, c.y) for c in corners], dtype=np.int32)
    cv2.polylines(vis, [pts], isClosed=True, color=(0, 255, 0), thickness=3)
    labels = ["TL", "TR", "BR", "BL"]
    for i, (pt, label) in enumerate(zip(pts, labels)):
        cv2.circle(vis, tuple(pt), 10, (0, 0, 255), -1)
        cv2.putText(vis, f"{label}({pt[0]},{pt[1]})", (pt[0] + 8, pt[1] - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)
    _debug_save(f"99_final_pipeline{pipeline}.jpg", vis)


# ---------------------------------------------------------------------------
# draw_corners utility (used by routes that want annotated preview)
# ---------------------------------------------------------------------------

def draw_corners(image_bytes: bytes, corners: list[CornerPoint]) -> bytes:
    np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        return image_bytes

    pts = np.array([(c.x, c.y) for c in corners], dtype=np.int32)
    cv2.polylines(image, [pts], isClosed=True, color=(0, 255, 0), thickness=3)
    labels = ["TL", "TR", "BR", "BL"]
    for i, (pt, label) in enumerate(zip(pts, labels)):
        cv2.circle(image, tuple(pt), 10, (108, 92, 255), -1)
        cv2.putText(image, f"{i+1}", (pt[0] + 10, pt[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (108, 92, 255), 2)

    _, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return buffer.tobytes()
