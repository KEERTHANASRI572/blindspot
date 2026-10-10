import sys
import os
import uuid
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app, init_db, get_db
from models.db_models import DBUser, DBCourse, DBQuestion, DBAttempt, DBAuditLog

@pytest.fixture(scope="module")
def client():
    init_db()
    return TestClient(app)

def test_signup_and_duplicate_email(client):
    # 1. Successful signup
    email = f"student1_{uuid.uuid4().hex[:6]}@example.com"
    res = client.post("/api/auth/signup", json={
        "name": "Arun Kumar",
        "email": email,
        "password": "password123",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == email

    # 2. Duplicate email rejected
    res_dup = client.post("/api/auth/signup", json={
        "name": "Arun Duplicate",
        "email": email,
        "password": "anotherpassword",
        "language": "en"
    })
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]

def test_login_success_and_failure(client):
    email = f"student2_{uuid.uuid4().hex[:6]}@example.com"
    client.post("/api/auth/signup", json={
        "name": "Priya",
        "email": email,
        "password": "securepassword123"
    })

    # Wrong password
    res_fail = client.post("/api/auth/login", json={
        "email": email,
        "password": "wrongpassword"
    })
    assert res_fail.status_code == 401

    # Correct password
    res_ok = client.post("/api/auth/login", json={
        "email": email,
        "password": "securepassword123"
    })
    assert res_ok.status_code == 200
    assert "token" in res_ok.json()

def test_admin_login_and_rbac_protection(client):
    # Admin login with correct password
    res_admin = client.post("/api/auth/admin-login", json={"password": "admin123"})
    assert res_admin.status_code == 200
    admin_token = res_admin.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Student login
    email = f"learner_{uuid.uuid4().hex[:6]}@example.com"
    res_user = client.post("/api/auth/signup", json={
        "name": "Normal Learner",
        "email": email,
        "password": "password123"
    })
    user_token = res_user.json()["token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Admin access to admin routes -> 200
    res_admin_dash = client.get("/api/admin/dashboard", headers=admin_headers)
    assert res_admin_dash.status_code == 200

    # User access to admin routes -> 403 Forbidden
    res_user_forbidden = client.get("/api/admin/dashboard", headers=user_headers)
    assert res_user_forbidden.status_code == 403

def test_course_lifecycle_and_learner_isolation(client):
    # Admin login
    res_admin = client.post("/api/auth/admin-login", json={"password": "admin123"})
    admin_headers = {"Authorization": f"Bearer {res_admin.json()['token']}"}

    # Learner login
    email = f"kavitha_{uuid.uuid4().hex[:6]}@example.com"
    res_user = client.post("/api/auth/signup", json={
        "name": "Kavitha",
        "email": email,
        "password": "password123"
    })
    user_headers = {"Authorization": f"Bearer {res_user.json()['token']}"}

    # 1. Admin creates course -> status starts as 'draft'
    course_title = f"Test Systems {uuid.uuid4().hex[:4]}"
    res_create = client.post("/api/admin/courses", json={
        "title": course_title,
        "description": "Understanding core system fundamentals.",
        "notes": "A deadlock happens in concurrent systems when a set of processes are blocked because each process is holding a resource and waiting for another resource allocated to another process in the system. The four necessary Coffman conditions are mutual exclusion, hold and wait, no preemption, and circular wait.",
        "difficulty": "Medium"
    }, headers=admin_headers)
    assert res_create.status_code == 200
    course_id = res_create.json()["course_id"]

    # 2. Learner should NOT see draft courses in published list
    res_learner_courses = client.get("/api/courses", headers=user_headers)
    assert not any(c["id"] == course_id for c in res_learner_courses.json())

    # 3. Publish course (created with 5 approved questions & translations by background generator)
    res_pub = client.post(f"/api/admin/courses/{course_id}/publish", headers=admin_headers)
    assert res_pub.status_code == 200

    # 4. Now learner CAN see it
    res_learner_courses_after = client.get("/api/courses", headers=user_headers)
    assert any(c["id"] == course_id for c in res_learner_courses_after.json())

    # 6. Admin Cancels (archives) course
    res_cancel = client.post(f"/api/admin/courses/{course_id}/cancel", headers=admin_headers)
    assert res_cancel.status_code == 200

    # 6. Learner must NO LONGER see cancelled course
    res_learner_courses_cancelled = client.get("/api/courses", headers=user_headers)
    assert not any(c["id"] == course_id for c in res_learner_courses_cancelled.json())

    # 7. Admin Restores to Draft
    res_restore = client.post(f"/api/admin/courses/{course_id}/restore", headers=admin_headers)
    assert res_restore.status_code == 200

    # 8. Admin Deletes permanently (requires typed title)
    # Wrong title fails
    res_del_wrong = client.request("DELETE", f"/api/admin/courses/{course_id}", json={"confirm_title": "Wrong Title"}, headers=admin_headers)
    assert res_del_wrong.status_code == 400

    # Exact title succeeds
    res_del_ok = client.request("DELETE", f"/api/admin/courses/{course_id}", json={"confirm_title": course_title}, headers=admin_headers)
    assert res_del_ok.status_code == 200
    assert res_del_ok.json()["status"] == "deleted"
