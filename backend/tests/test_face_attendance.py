import pytest
import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.utils.image_utils import cv2_to_base64

client = TestClient(app)

def get_auth_headers():
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "Admin@123"
    })
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_face_register_validation():
    headers = get_auth_headers()
    
    # 1. Test non-existent student ID
    dummy_img = np.zeros((320, 320, 3), dtype=np.uint8)
    b64 = cv2_to_base64(dummy_img)

    resp = client.post("/api/face/register", json={
        "student_id": 999999,
        "image_base64": b64
    }, headers=headers)
    assert resp.status_code == 404

    # 2. Create a temporary student to test image validation
    s_resp = client.post("/api/students", json={
        "usn": "1CS21TESTVAL",
        "full_name": "Validation Student",
        "email": "val.student@college.edu",
        "department": "Computer Science & Engineering",
        "year": "4th Year"
    }, headers=headers)
    
    student_id = s_resp.json()["id"] if s_resp.status_code == 201 else None
    if student_id:
        # Test invalid/empty base64
        resp = client.post("/api/face/register", json={
            "student_id": student_id,
            "image_base64": "invalid_base64_data"
        }, headers=headers)
        assert resp.status_code == 400

        # Clean up
        client.delete(f"/api/students/{student_id}", headers=headers)

def test_attendance_csv_export():
    headers = get_auth_headers()
    resp = client.get("/api/attendance/export", headers=headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "Record ID,USN,Student Name" in resp.text
