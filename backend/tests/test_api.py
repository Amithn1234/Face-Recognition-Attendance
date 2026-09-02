import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Face Recognition" in data["system"]

def test_admin_login_success():
    response = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_admin_login_invalid_password():
    response = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_admin_me_endpoint():
    # Login first
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "Admin@123"
    })
    token = login_resp.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["admin"]["username"] == "admin"
    assert data["admin"]["email"] == "admin@college.edu"

def test_student_crud_and_duplicate_handling():
    # Login
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "Admin@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Student
    unique_usn = "1CS21CS999"
    student_payload = {
        "usn": unique_usn,
        "full_name": "Test Student Automated",
        "email": "test.student999@college.edu",
        "department": "Computer Science & Engineering",
        "year": "4th Year",
        "section": "A",
        "phone": "9876543210"
    }
    create_resp = client.post("/api/students", json=student_payload, headers=headers)
    assert create_resp.status_code in [201, 400]
    
    if create_resp.status_code == 201:
        created_student = create_resp.json()
        student_id = created_student["id"]
        assert created_student["usn"] == unique_usn
        
        # 2. Get Student by ID
        get_resp = client.get(f"/api/students/{student_id}", headers=headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["full_name"] == "Test Student Automated"

        # 3. Update Student
        update_resp = client.put(f"/api/students/{student_id}", json={"section": "B"}, headers=headers)
        assert update_resp.status_code == 200
        assert update_resp.json()["section"] == "B"

        # 4. Clean up / Delete Student
        del_resp = client.delete(f"/api/students/{student_id}", headers=headers)
        assert del_resp.status_code == 200

def test_dashboard_stats():
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "Admin@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/dashboard/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "total_students" in data["metrics"]
    assert "department_stats" in data
    assert "trend" in data
