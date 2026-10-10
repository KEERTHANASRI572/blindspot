import sys
import os
import uuid
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app, init_db
from config import settings

@pytest.fixture(scope="module")
def client():
    init_db()
    return TestClient(app)

@pytest.fixture(scope="module")
def admin_headers(client):
    res = client.post("/api/auth/admin-login", json={"password": settings.ADMIN_PASSWORD})
    assert res.status_code == 200
    token = res.json()["token"]
    return {"Authorization": f"Bearer {token}"}

def test_add_course_minimal_title_only(client, admin_headers):
    unique_title = f"Thermodynamics {uuid.uuid4().hex[:6]}"
    res = client.post("/api/admin/courses", json={"title": unique_title}, headers=admin_headers)
    assert res.status_code == 200, res.text
    data = res.json()

    # Verify guaranteed fields
    assert "id" in data
    assert data["title_en"] == unique_title
    assert "title_ta" in data
    assert "title_hi" in data
    assert data["status"] == "draft"
    assert data["question_count"] == 0
    assert "job_id" in data
    assert "created_at" in data
    assert "updated_at" in data

    course_id = data["id"]
    job_id = data["job_id"]

    # Verify job status endpoint
    if job_id:
        job_res = client.get(f"/api/admin/jobs/{job_id}", headers=admin_headers)
        assert job_res.status_code == 200
        job_data = job_res.json()
        assert "status" in job_data
        assert "progress" in job_data

    # Verify get course detail endpoint returns safe questions list
    detail_res = client.get(f"/api/admin/courses/{course_id}", headers=admin_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert isinstance(detail["questions"], list)
    assert detail["status"] == "draft"

def test_add_course_validation_too_short(client, admin_headers):
    # Empty title or 1 character rejected
    res = client.post("/api/admin/courses", json={"title": "A"}, headers=admin_headers)
    assert res.status_code in (400, 422)

    res_empty = client.post("/api/admin/courses", json={"title": "   "}, headers=admin_headers)
    assert res_empty.status_code in (400, 422)

def test_add_course_with_notes_and_txt_content(client, admin_headers):
    title = f"Fluid Dynamics {uuid.uuid4().hex[:6]}"
    notes = "Fluid dynamics describes the flow of fluids—liquids and gases. It has several subdisciplines, including aerodynamics and hydrodynamics."
    res = client.post("/api/admin/courses", json={
        "title": title,
        "notes": notes,
        "difficulty": "Medium"
    }, headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["title_en"] == title
    assert data["difficulty"] == "Medium"
    assert data["status"] == "draft"

def test_cancel_job_flow(client, admin_headers):
    title = f"Quantum Optics {uuid.uuid4().hex[:6]}"
    res = client.post("/api/admin/courses", json={"title": title}, headers=admin_headers)
    assert res.status_code == 200
    job_id = res.json()["job_id"]

    if job_id:
        cancel_res = client.post(f"/api/admin/jobs/{job_id}/cancel", headers=admin_headers)
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "cancelled"
