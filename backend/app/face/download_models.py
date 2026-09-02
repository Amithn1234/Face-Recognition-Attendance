import os
import requests

MODELS = {
    "face_detection_yunet_2023mar.onnx": "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    "face_recognition_sface_2021dec.onnx": "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
    "minifasnet_v2.onnx": "https://huggingface.co/garciafido/minifasnet-v2-anti-spoofing-onnx/resolve/main/minifasnet_v2.onnx"
}

def ensure_models_downloaded(target_dir=None):
    if target_dir is None:
        target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models_weights"))
    
    os.makedirs(target_dir, exist_ok=True)
    headers = {"User-Agent": "Mozilla/5.0"}

    for filename, url in MODELS.items():
        dest = os.path.join(target_dir, filename)
        if not os.path.exists(dest) or os.path.getsize(dest) < 1000:
            print(f"Downloading model: {filename}...")
            r = requests.get(url, headers=headers, allow_redirects=True, verify=False, timeout=90)
            r.raise_for_status()
            with open(dest, "wb") as f:
                f.write(r.content)
            print(f"Downloaded {filename} ({os.path.getsize(dest)} bytes)")
        else:
            print(f"Model already present: {filename}")

if __name__ == "__main__":
    ensure_models_downloaded()
