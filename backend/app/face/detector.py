import os
import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings

class FaceDetector:
    """
    High-speed face detector using OpenCV YuNet ONNX model.
    Detects faces, computes bounding boxes, confidence scores, and 5 facial landmarks
    (right eye, left eye, nose tip, right mouth corner, left mouth corner).
    """
    def __init__(self, model_path: Optional[str] = None, score_threshold: float = 0.7, nms_threshold: float = 0.3):
        if model_path is None:
            model_path = os.path.join(settings.MODELS_DIR, "face_detection_yunet_2023mar.onnx")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"YuNet face detection model not found at {model_path}")
        
        self.model_path = model_path
        self.score_threshold = score_threshold
        self.nms_threshold = nms_threshold
        self.detector = cv2.FaceDetectorYN.create(
            model=self.model_path,
            config="",
            input_size=(320, 320),
            score_threshold=self.score_threshold,
            nms_threshold=self.nms_threshold,
            top_k=5000,
            backend_id=cv2.dnn.DNN_BACKEND_OPENCV,
            target_id=cv2.dnn.DNN_TARGET_CPU
        )

    def detect_faces(self, image_bgr: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detects all faces in the provided BGR image.
        Returns a list of dicts containing bbox [x, y, w, h], landmarks (5 points), and score.
        """
        if image_bgr is None or image_bgr.size == 0:
            return []

        h, w, _ = image_bgr.shape
        self.detector.setInputSize((w, h))

        _, faces = self.detector.detect(image_bgr)

        if faces is None or len(faces) == 0:
            return []

        results = []
        for face in faces:
            # face array layout: [x, y, w, h, x_re, y_re, x_le, y_le, x_nt, y_nt, x_rcm, y_rcm, x_lcm, y_lcm, score]
            bbox = [int(face[0]), int(face[1]), int(face[2]), int(face[3])]
            landmarks = [
                (float(face[4]), float(face[5])),   # right eye
                (float(face[6]), float(face[7])),   # left eye
                (float(face[8]), float(face[9])),   # nose tip
                (float(face[10]), float(face[11])), # right mouth corner
                (float(face[12]), float(face[13]))  # left mouth corner
            ]
            score = float(face[14])

            # Ensure bounding box is within image bounds
            x, y, bw, bh = bbox
            x = max(0, x)
            y = max(0, y)
            bw = min(bw, w - x)
            bh = min(bh, h - y)

            results.append({
                "bbox": [x, y, bw, bh],
                "landmarks": landmarks,
                "score": score,
                "raw_face": face
            })

        # Sort faces by area descending (largest face first)
        results.sort(key=lambda f: f["bbox"][2] * f["bbox"][3], reverse=True)
        return results

# Singleton detector instance for reuse across requests
detector_instance = None

def get_face_detector() -> FaceDetector:
    global detector_instance
    if detector_instance is None:
        detector_instance = FaceDetector()
    return detector_instance
