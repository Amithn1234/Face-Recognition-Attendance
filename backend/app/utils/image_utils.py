import base64
import cv2
import numpy as np
from typing import Optional, Tuple

def base64_to_cv2(image_base64: str) -> Optional[np.ndarray]:
    """
    Decodes a base64 encoded image string (with or without data URI prefix)
    into an OpenCV BGR numpy array.
    """
    try:
        # Strip data URI header if present (e.g. "data:image/jpeg;base64,")
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        
        # Decode base64 bytes
        img_bytes = base64.b64decode(image_base64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img_bgr
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None

def cv2_to_base64(img_bgr: np.ndarray, format: str = ".jpg") -> str:
    """
    Encodes an OpenCV BGR image array to a base64 string.
    """
    success, buffer = cv2.imencode(format, img_bgr)
    if not success:
        raise ValueError("Failed to encode image to buffer")
    return base64.b64encode(buffer).decode("utf-8")

def check_image_blur(img_bgr: np.ndarray, threshold: float = 60.0) -> Tuple[bool, float]:
    """
    Calculates the Laplacian variance to measure sharpness/blurriness.
    Returns (is_sharp, variance_score).
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_sharp = variance >= threshold
    return is_sharp, float(variance)
