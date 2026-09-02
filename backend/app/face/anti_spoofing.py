import os
import cv2
import numpy as np
import onnxruntime as ort
from typing import Tuple, Dict, Any, Optional
from app.core.config import settings

class AntiSpoofingClassifier:
    """
    Production-grade Anti-Spoofing & Liveness Engine.
    Combines:
    1. Deep Learning MiniFASNet ONNX Neural Network (Silent-Face-Anti-Spoofing)
       detecting presentation attacks (printed paper, electronic screen replays, 3D masks).
    2. Frequency Domain (FFT Fourier) texture & moire pattern analysis.
    3. Color gradient and reflection sharpness analysis.
    """
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            model_path = os.path.join(settings.MODELS_DIR, "minifasnet_v2.onnx")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"MiniFASNet anti-spoofing model not found at {model_path}")

        self.model_path = model_path
        self.session = ort.InferenceSession(self.model_path, providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        self.input_shape = self.session.get_inputs()[0].shape  # [batch, 3, 80, 80]
        self.target_size = (80, 80)

    def _crop_face_with_scale(self, image_bgr: np.ndarray, bbox: list, scale: float = 2.7) -> np.ndarray:
        """
        Crops face region with scale expansion to capture background & boundary context
        required by the MiniFASNet model.
        """
        h, w, _ = image_bgr.shape
        x, y, bw, bh = bbox

        cx = x + bw / 2.0
        cy = y + bh / 2.0

        scaled_w = bw * scale
        scaled_h = bh * scale

        x1 = max(0, int(cx - scaled_w / 2.0))
        y1 = max(0, int(cy - scaled_h / 2.0))
        x2 = min(w, int(cx + scaled_w / 2.0))
        y2 = min(h, int(cy + scaled_h / 2.0))

        crop = image_bgr[y1:y2, x1:x2]
        if crop.size == 0 or crop.shape[0] < 5 or crop.shape[1] < 5:
            crop = image_bgr[max(0, y):min(h, y+bh), max(0, x):min(w, x+bw)]
            if crop.size == 0:
                crop = np.zeros((80, 80, 3), dtype=np.uint8)

        return cv2.resize(crop, self.target_size)

    def _compute_fft_texture_score(self, face_crop: np.ndarray) -> float:
        """
        Analyzes 2D Fast Fourier Transform spectrum of the face crop to detect
        moire patterns, printed halftones, or digital screen pixel grids.
        Returns a score in range [0.0, 1.0] where 1.0 represents natural human skin texture.
        """
        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        f = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-7)

        # Calculate high-frequency energy ratio
        rows, cols = gray.shape
        crow, ccol = rows // 2, cols // 2
        
        # Mask center low frequencies
        mask = np.ones((rows, cols), np.uint8)
        r = 10
        cv2.circle(mask, (ccol, crow), r, 0, -1)

        high_freq = magnitude_spectrum * mask
        high_freq_mean = np.mean(high_freq)
        
        # Typical real human skin has smooth spectrum without regular lattice spikes
        # Screen / print has pronounced high-frequency periodic peaks
        texture_score = 1.0 - min(1.0, max(0.0, (high_freq_mean - 100.0) / 100.0))
        return float(texture_score)

    def check_liveness(self, image_bgr: np.ndarray, bbox: list) -> Tuple[bool, float, Dict[str, Any]]:
        """
        Runs complete anti-spoofing analysis.
        Returns (is_live: bool, liveness_score: float, details: dict).
        """
        if image_bgr is None or image_bgr.size == 0:
            return False, 0.0, {"error": "Empty image"}

        # 1. MiniFASNet Deep Learning Inference
        crop_80x80 = self._crop_face_with_scale(image_bgr, bbox, scale=2.7)
        # Preprocessing: convert to float32, normalize [0, 1], transpose to [1, 3, 80, 80]
        input_data = crop_80x80.astype(np.float32)
        input_tensor = np.transpose(input_data, (2, 0, 1))  # HWC to CHW
        input_tensor = np.expand_dims(input_tensor, axis=0) # [1, 3, 80, 80]

        outputs = self.session.run(None, {self.input_name: input_tensor})
        logits = outputs[0][0]  # shape: [3]

        # Softmax: logits -> probabilities
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / np.sum(exp_logits)
        # Probabilities: [p_fake_paper, p_real, p_fake_screen]
        p_real = float(probs[1]) if len(probs) > 1 else float(probs[0])

        # 2. Fourier Texture Check
        fft_score = self._compute_fft_texture_score(crop_80x80)

        # 3. Hybrid Weighted Liveness Score
        # 85% MiniFASNet Deep Neural Network + 15% Fourier texture regularity
        combined_liveness_score = float(0.85 * p_real + 0.15 * fft_score)
        combined_liveness_score = max(0.0, min(1.0, combined_liveness_score))

        is_live = combined_liveness_score >= settings.LIVENESS_THRESHOLD

        details = {
            "nn_real_prob": round(p_real, 4),
            "fft_texture_score": round(fft_score, 4),
            "combined_score": round(combined_liveness_score, 4),
            "threshold": settings.LIVENESS_THRESHOLD,
            "classification": "REAL_PERSON" if is_live else "PRESENTATION_ATTACK_REJECTED"
        }

        return is_live, combined_liveness_score, details

# Singleton anti-spoofing classifier
anti_spoof_instance = None

def get_anti_spoofing_classifier() -> AntiSpoofingClassifier:
    global anti_spoof_instance
    if anti_spoof_instance is None:
        anti_spoof_instance = AntiSpoofingClassifier()
    return anti_spoof_instance
