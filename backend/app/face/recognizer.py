import os
import cv2
import numpy as np
from typing import Optional, Tuple, List
from app.core.config import settings

class FaceRecognizer:
    """
    Feature extractor and matcher using OpenCV SFace ONNX model (ArcFace architecture).
    Aligns faces using 5 facial landmarks and generates unit-normalized feature embeddings.
    Matches embeddings using Cosine Similarity.
    """
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            model_path = os.path.join(settings.MODELS_DIR, "face_recognition_sface_2021dec.onnx")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"SFace recognition model not found at {model_path}")

        self.model_path = model_path
        self.recognizer = cv2.FaceRecognizerSF.create(
            model=self.model_path,
            config="",
            backend_id=cv2.dnn.DNN_BACKEND_OPENCV,
            target_id=cv2.dnn.DNN_TARGET_CPU
        )

    def extract_embedding(self, image_bgr: np.ndarray, raw_face: np.ndarray) -> np.ndarray:
        """
        Aligns the face and extracts a 128-dimensional L2-normalized feature embedding vector.
        """
        # Align face to standard canonical pose
        aligned_face = self.recognizer.alignCrop(image_bgr, raw_face)
        # Extract feature vector
        embedding = self.recognizer.feature(aligned_face)
        # Flatten and ensure float32 array
        embedding = embedding.flatten().astype(np.float32)
        # L2-normalize
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        return embedding

    def match_embeddings(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Computes Cosine Similarity between two normalized face embeddings.
        Returns similarity score in range [-1.0, 1.0], typically [0.0, 1.0].
        A score >= settings.FACE_SIMILARITY_THRESHOLD (default 0.60) indicates the same identity.
        """
        # Cosine similarity for unit vectors is simply dot product
        similarity = float(np.dot(embedding1, embedding2))
        return max(0.0, min(1.0, similarity))

# Singleton recognizer instance
recognizer_instance = None

def get_face_recognizer() -> FaceRecognizer:
    global recognizer_instance
    if recognizer_instance is None:
        recognizer_instance = FaceRecognizer()
    return recognizer_instance
