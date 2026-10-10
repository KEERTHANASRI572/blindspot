import sys
import os
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app, init_db, SessionLocal
from config import settings
from models.db_models import DBUser, DBCourse, DBQuestion, DBAttempt, DBAuditLog

def test_full_simplified_pipeline_smoke():
    init_db()
    client = TestClient(app)

    # 1. Health check
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    # 2. Admin Login
    res_admin_login = client.post("/api/auth/admin-login", json={"password": settings.ADMIN_PASSWORD})
    assert res_admin_login.status_code == 200
    admin_token = res_admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Load Sample Course (Operating Systems: Deadlock)
    res_sample = client.post("/api/admin/courses/load-sample", headers=admin_headers)
    assert res_sample.status_code == 200
    sample_data = res_sample.json()
    course_id = sample_data["course_id"]
    assert sample_data["status"] == "loaded"

    # 4. Verify Admin Course Details has questions and translations
    res_course_detail = client.get(f"/api/admin/courses/{course_id}", headers=admin_headers)
    assert res_course_detail.status_code == 200
    course_detail = res_course_detail.json()
    assert len(course_detail["questions"]) >= 3
    assert course_detail["title_en"] != ""
    assert course_detail["title_ta"] != ""
    assert course_detail["title_hi"] != ""

    # 5. User Signup
    user_email = f"learner_{os.urandom(4).hex()}@university.edu"
    res_signup = client.post("/api/auth/signup", json={
        "name": "Jane Doe",
        "email": user_email,
        "password": "SecurePassword123!",
        "language": "en"
    })
    assert res_signup.status_code == 200
    user_token = res_signup.json()["token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 6. Learner sees published course in English, Tamil, and Hindi
    res_courses_en = client.get("/api/courses?lang=en", headers=user_headers)
    assert res_courses_en.status_code == 200
    assert any(c["id"] == course_id for c in res_courses_en.json())

    res_courses_ta = client.get("/api/courses?lang=ta", headers=user_headers)
    assert res_courses_ta.status_code == 200
    ta_course = next(c for c in res_courses_ta.json() if c["id"] == course_id)
    assert "முடக்கம்" in ta_course["title"] or len(ta_course["title"]) > 0

    # 7. Learner views course for practice
    res_learner_study = client.get(f"/api/courses/{course_id}?lang=en", headers=user_headers)
    assert res_learner_study.status_code == 200
    study_data = res_learner_study.json()
    question = study_data["questions"][0]

    # 8. Learner submits Practice answer with high confidence (e.g. 90%)
    res_practice = client.post("/api/practice/submit", json={
        "course_id": course_id,
        "question_id": question["id"],
        "confidence": 90,
        "answer": "Deadlock happens only when memory runs out and CPU usage is 100%.",
        "hints_used": 0,
        "language": "en"
    }, headers=user_headers)
    assert res_practice.status_code == 200
    result = res_practice.json()
    assert "gap" in result
    assert "friendly_summary" in result
    assert "hints" in result
    assert len(result["hints"]) >= 1

    # 9. Learner checks progress & calibration chart
    res_progress = client.get("/api/progress/me", headers=user_headers)
    assert res_progress.status_code == 200
    progress_data = res_progress.json()
    assert progress_data["total_attempts"] >= 1
    assert len(progress_data["history"]) >= 1

    # 10. Admin checks learners list and dashboard stats
    res_users = client.get("/api/admin/users", headers=admin_headers)
    assert res_users.status_code == 200
    users_list = res_users.json()
    assert any(u["email"] == user_email for u in users_list)

    res_dash = client.get("/api/admin/dashboard", headers=admin_headers)
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["total_courses"] >= 1
    assert dash_data["total_learners"] >= 1

    # 11. Admin duplicates course
    res_dup = client.post(f"/api/admin/courses/{course_id}/duplicate", headers=admin_headers)
    assert res_dup.status_code == 200
    new_course_id = res_dup.json()["new_course_id"]

    # 12. Admin deletes duplicate course with exact title confirmation
    dup_title = res_dup.json()["title"]
    res_del = client.request("DELETE", f"/api/admin/courses/{new_course_id}", json={"confirm_title": dup_title}, headers=admin_headers)
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "deleted"

    print("\n✓ Full simplified pipeline smoke test passed flawlessly!")
