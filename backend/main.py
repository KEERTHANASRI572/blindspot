import os
import json
import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Request, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from config import settings
from database import init_db, get_db, SessionLocal
from models.db_models import DBUser, DBCourse, DBQuestion, DBAttempt, DBJob, DBAuditLog
from models.schemas import (
    SignupRequest, LoginRequest, AdminLoginRequest, AuthResponse, UserResponse,
    CourseCreateRequest, CourseUpdateRequest, CourseDeleteRequest,
    CourseListItem, CourseDetailResponse, QuestionModel,
    QuestionCreateRequest, QuestionUpdateRequest,
    PracticeSubmitRequest, PracticeResultResponse,
    UserProgressResponse, JobStatusResponse, AdminDashboardStats
)
from services.auth_service import (
    hash_password, verify_password, create_jwt_token,
    verify_admin_password, check_login_rate_limit
)
from services.course_service import course_service
from services.diagnoser_service import diagnoser_service
from services.bkt_service import bkt_service
from services.teach_service import teach_service
from services.viva_service import viva_service
from services.study_lab_service import study_lab_service
from dependencies import require_admin, require_user, get_optional_user

app = FastAPI(
    title=settings.APP_NAME,
    description="Cognitive Calibration & Simple Learning Platform",
    version="2.0.0"
)

# CORS setup: allows only FRONTEND_URL and http://localhost:5173
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if settings.FRONTEND_URL:
    clean_url = settings.FRONTEND_URL.strip().rstrip("/")
    if clean_url and clean_url != "*" and clean_url not in allowed_origins:
        allowed_origins.append(clean_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    with SessionLocal() as db:
        course_service.seed_default_courses(db)

# --- HEALTH ---
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# ==========================================
# AUTHENTICATION ROUTES
# ==========================================

@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(DBUser).filter(func.lower(DBUser.email) == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in."
        )

    user = DBUser(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        name=req.name.strip(),
        email=req.email.lower().strip(),
        password_hash=hash_password(req.password),
        language=req.language or "en"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_jwt_token({"sub": user.id, "role": "user", "name": user.name})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": "user",
            "language": user.language
        }
    }

@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    if not check_login_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please wait a minute and try again."
        )

    user = db.query(DBUser).filter(func.lower(DBUser.email) == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong email or password. Please check your credentials."
        )

    token = create_jwt_token({"sub": user.id, "role": "user", "name": user.name})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": "user",
            "language": user.language
        }
    }

@app.post("/api/auth/admin-login", response_model=AuthResponse)
def admin_login(req: AdminLoginRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    if not check_login_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many admin login attempts. Please wait a minute."
        )

    if not verify_admin_password(req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin password."
        )

    token = create_jwt_token({"sub": "admin", "role": "admin", "name": "Administrator"})
    return {
        "token": token,
        "user": {
            "id": "admin",
            "name": "Administrator",
            "email": "admin@blindspot.app",
            "role": "admin",
            "language": "en"
        }
    }

@app.get("/api/auth/me")
def get_me(user: Optional[DBUser] = Depends(get_optional_user)):
    if not user:
        return {"authenticated": False}
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": "user",
            "language": user.language
        }
    }

@app.put("/api/auth/language")
def update_language(
    language: str = Query(..., pattern="^(en|ta|hi)$"),
    user: DBUser = Depends(require_user),
    db: Session = Depends(get_db)
):
    user.language = language
    db.commit()
    return {"status": "updated", "language": language}

# ==========================================
# LEARNER COURSE & PRACTICE ROUTES
# ==========================================

@app.get("/api/courses", response_model=List[CourseListItem])
def list_published_courses(
    lang: str = "en",
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns ONLY published courses for students.
    Draft and cancelled courses are strictly filtered out in SQL query.
    """
    query = db.query(DBCourse).filter(DBCourse.status == "published")
    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(DBCourse.title_en).like(s)) |
            (func.lower(DBCourse.description_en).like(s))
        )

    courses = query.order_by(DBCourse.updated_at.desc()).all()
    now = datetime.datetime.utcnow()
    res = []

    for c in courses:
        title = c.title_ta if lang == "ta" and c.title_ta else (c.title_hi if lang == "hi" and c.title_hi else c.title_en)
        desc = c.description_ta if lang == "ta" and c.description_ta else (c.description_hi if lang == "hi" and c.description_hi else c.description_en)
        
        q_count = len([q for q in c.questions if q.approved])
        learners_count = db.query(func.count(func.distinct(DBAttempt.user_id))).filter(DBAttempt.course_id == c.id).scalar() or 0
        
        days_old = (now - c.created_at).days
        days_updated = (now - c.updated_at).days
        
        res.append({
            "id": c.id,
            "title": title or c.title_en,
            "description": desc or c.description_en,
            "difficulty": c.difficulty,
            "status": c.status,
            "question_count": q_count,
            "learners_enrolled": learners_count,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "is_new": days_old <= 7,
            "is_updated": days_updated <= 7 and days_old > 7
        })

    return res

@app.get("/api/courses/{course_id}")
def get_course_for_learner(
    course_id: str,
    lang: str = "en",
    db: Session = Depends(get_db)
):
    """Get published course for learner."""
    course = db.query(DBCourse).filter(
        DBCourse.id == course_id,
        DBCourse.status == "published"
    ).first()
    
    if not course:
        # Check if cancelled to provide specific friendly message
        cancelled = db.query(DBCourse).filter(DBCourse.id == course_id, DBCourse.status == "cancelled").first()
        if cancelled:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="This course is no longer available."
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not yet published."
        )

    title = course.title_ta if lang == "ta" and course.title_ta else (course.title_hi if lang == "hi" and course.title_hi else course.title_en)
    desc = course.description_ta if lang == "ta" and course.description_ta else (course.description_hi if lang == "hi" and course.description_hi else course.description_en)

    questions_res = []
    for q in course.questions:
        if not q.approved:
            continue
        q_text = q.text_ta if lang == "ta" and q.text_ta else (q.text_hi if lang == "hi" and q.text_hi else q.text_en)
        hints_raw = q.hints_ta_json if lang == "ta" and q.hints_ta_json != "[]" else (q.hints_hi_json if lang == "hi" and q.hints_hi_json != "[]" else q.hints_en_json)
        
        try:
            hints = json.loads(hints_raw or "[]")
        except Exception:
            hints = []

        questions_res.append({
            "id": q.id,
            "course_id": q.course_id,
            "text": q_text or q.text_en,
            "position": q.position,
            "hints": hints
        })

    return {
        "id": course.id,
        "title": title or course.title_en,
        "description": desc or course.description_en,
        "notes": course.notes,
        "difficulty": course.difficulty,
        "status": course.status,
        "questions": questions_res
    }

@app.post("/api/practice/submit", response_model=PracticeResultResponse)
def submit_practice_answer(
    req: PracticeSubmitRequest,
    user: DBUser = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Submits learner's confidence and answer.
    Computes Confidence Gap (confidence - score), extracts evidence quote,
    and returns friendly 8th-grade explanation + 4-step hint ladder.
    """
    course = db.query(DBCourse).filter(DBCourse.id == req.course_id).first()
    question = db.query(DBQuestion).filter(DBQuestion.id == req.question_id).first()
    
    if not course or not question:
        raise HTTPException(status_code=404, detail="Course or practice question not found.")

    key_points = json.loads(question.key_points_json or "[]")
    hints = json.loads(question.hints_en_json or "[]")

    # Diagnose reasoning
    diagnosis = diagnoser_service.diagnose_answer(
        scenario={"scenario": course.notes, "question": question.text_en, "expected_reasoning_points": key_points},
        user_answer=req.answer,
        confidence_0_100=req.confidence,
        hints_used=req.hints_used,
        language=req.language or user.language or "en"
    )

    actual_score = float(diagnosis.get("score_0_100", 50.0))
    gap = round(req.confidence - actual_score, 1)

    # Color status based on calibration
    if abs(gap) <= 15:
        status_color = "green"
        friendly_summary = "Great job! Your confidence and understanding were well-matched."
    elif gap > 15:
        status_color = "red"
        friendly_summary = f"You felt {int(req.confidence)}% sure, but your answer was {int(actual_score)}% complete. Confidence Gap: {int(gap)}."
    else:
        status_color = "amber"
        friendly_summary = f"You were more capable than you gave yourself credit for! Confidence Gap: {int(gap)}."

    # Save attempt tied to user
    attempt = DBAttempt(
        id=f"att-{uuid.uuid4().hex[:8]}",
        user_id=user.id,
        course_id=course.id,
        question_id=question.id,
        confidence=req.confidence,
        answer=req.answer,
        score=actual_score,
        gap=gap,
        hints_used=req.hints_used,
        misconception_id=diagnosis.get("misconception_id"),
        misconception_name=diagnosis.get("misconception_name"),
        evidence_quote=diagnosis.get("evidence_quote"),
        explanation=diagnosis.get("grounded_explanation")
    )
    db.add(attempt)
    db.commit()

    return {
        "attempt_id": attempt.id,
        "confidence": req.confidence,
        "score": actual_score,
        "gap": gap,
        "status_color": status_color,
        "friendly_summary": friendly_summary,
        "misconception_name": diagnosis.get("misconception_name"),
        "evidence_quote": diagnosis.get("evidence_quote"),
        "explanation": diagnosis.get("grounded_explanation", "Good attempt! Check the hints below to see how to solve it completely."),
        "hints": hints
    }

@app.get("/api/progress/me", response_model=UserProgressResponse)
def get_user_progress(
    user: DBUser = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Returns learner's personal progress data only."""
    attempts = db.query(DBAttempt).filter(DBAttempt.user_id == user.id).order_by(DBAttempt.created_at.asc()).all()
    
    if not attempts:
        return {
            "average_gap": 0.0,
            "courses_completed": 0,
            "total_attempts": 0,
            "history": [],
            "top_mistake": "No practice attempts yet. Try your first course!",
            "top_strength": "Ready to learn"
        }

    avg_gap = round(sum(a.gap for a in attempts) / len(attempts), 1)
    completed_courses = db.query(func.count(func.distinct(DBAttempt.course_id))).filter(
        DBAttempt.user_id == user.id,
        DBAttempt.score >= 70
    ).scalar() or 0

    history = [
        {
            "date": a.created_at.strftime("%b %d"),
            "confidence": a.confidence,
            "score": a.score,
            "gap": a.gap
        }
        for a in attempts[-15:]
    ]

    # Find common misconception
    misconceptions = [a.misconception_name for a in attempts if a.misconception_name]
    top_mistake = max(set(misconceptions), key=misconceptions.count) if misconceptions else "Assuming circular wait always causes deadlock."

    return {
        "average_gap": avg_gap,
        "courses_completed": completed_courses,
        "total_attempts": len(attempts),
        "history": history,
        "top_mistake": top_mistake,
        "top_strength": "Strong conceptual recall"
    }

# ==========================================
# TEACH A FRIEND (CONFUSED STUDENT) ROUTES
# ==========================================

@app.post("/api/teach/start")
def start_teach(req: Dict[str, Any], user: DBUser = Depends(require_user)):
    session_id = f"teach-{uuid.uuid4().hex[:8]}"
    course_id = req.get("course_id", "course-physics")
    concept_name = req.get("concept_name", "Core Principles")
    language = req.get("language", "en")
    res = teach_service.start_teach_session(session_id, course_id, concept_name, language)
    return res

@app.post("/api/teach/chat")
def chat_teach(req: Dict[str, Any], user: DBUser = Depends(require_user)):
    session_id = req.get("session_id")
    user_msg = req.get("message", "")
    history = req.get("history", [])
    language = req.get("language", "en")
    res = teach_service.process_teach_turn(session_id, user_msg, history, language)
    return res

@app.post("/api/teach/evaluate")
def evaluate_teach(req: Dict[str, Any], user: DBUser = Depends(require_user)):
    session_id = req.get("session_id")
    history = req.get("history", [])
    res = teach_service.evaluate_teaching(session_id, history)
    return res

# ==========================================
# VIVA SIMULATOR (ORAL DEFENSE) ROUTES
# ==========================================

@app.post("/api/viva/start")
def start_viva(req: Dict[str, Any], user: DBUser = Depends(require_user)):
    session_id = f"viva-{uuid.uuid4().hex[:8]}"
    course_id = req.get("course_id", "course-physics")
    title = req.get("title", "Physics")
    language = req.get("language", "en")
    res = viva_service.start_viva(session_id, course_id, title, language)
    return res

@app.post("/api/viva/answer")
def answer_viva(req: Dict[str, Any], user: DBUser = Depends(require_user)):
    session_id = req.get("viva_session_id")
    answer = req.get("answer", "")
    language = req.get("language", "en")
    res = viva_service.process_viva_turn(session_id, answer, language)
    return res

@app.post("/api/viva/report")
def report_viva(req: Dict[str, Any], user: DBUser = Depends(require_user)):
    session_id = req.get("viva_session_id")
    language = req.get("language", "en")
    res = viva_service.finalize_viva_report(session_id, language)
    return res

# ==========================================
# CLASS RESULTS (STUDY LAB) ADMIN ROUTES
# ==========================================

@app.get("/api/admin/class-results")
def get_class_results(
    course_id: Optional[str] = "all",
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    analytics = study_lab_service.get_group_analytics("cohort-1", db)
    return analytics

@app.get("/api/admin/class-results/csv")
def get_class_results_csv(
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from fastapi.responses import Response
    csv_content = study_lab_service.export_csv("cohort-1", db)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=blindspot_class_results.csv"}
    )


# ==========================================
# ADMIN COURSE MANAGEMENT ROUTES
# ==========================================

@app.get("/api/admin/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_courses = db.query(func.count(DBCourse.id)).scalar() or 0
    total_learners = db.query(func.count(DBUser.id)).scalar() or 0
    attempts = db.query(DBAttempt).all()
    avg_gap = round(sum(a.gap for a in attempts) / len(attempts), 1) if attempts else 0.0

    recent_logs = db.query(DBAuditLog).order_by(DBAuditLog.created_at.desc()).limit(8).all()
    recent_activity = [
        {
            "id": log.id,
            "action": log.action,
            "course_id": log.course_id,
            "details": log.details,
            "time": log.created_at.strftime("%b %d, %H:%M")
        }
        for log in recent_logs
    ]

    return {
        "total_courses": total_courses,
        "total_learners": total_learners,
        "average_confidence_gap": avg_gap,
        "recent_activity": recent_activity
    }

@app.get("/api/admin/courses")
def admin_list_courses(
    status_filter: Optional[str] = "all",
    search: Optional[str] = None,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(DBCourse)
    if status_filter and status_filter != "all":
        query = query.filter(DBCourse.status == status_filter)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(DBCourse.title_en).like(s)) |
            (func.lower(DBCourse.description_en).like(s))
        )

    courses = query.order_by(DBCourse.updated_at.desc()).all()
    res = []
    for c in courses:
        learners_count = db.query(func.count(func.distinct(DBAttempt.user_id))).filter(DBAttempt.course_id == c.id).scalar() or 0
        res.append({
            "id": c.id,
            "title": c.title_en or c.title_ta or c.title_hi or "Untitled course",
            "title_en": c.title_en or "",
            "title_ta": c.title_ta or "",
            "title_hi": c.title_hi or "",
            "description": c.description_en or c.description_ta or c.description_hi or "",
            "description_en": c.description_en or "",
            "description_ta": c.description_ta or "",
            "description_hi": c.description_hi or "",
            "difficulty": c.difficulty or "Easy",
            "status": c.status or "draft",
            "question_count": len(c.questions) if c.questions else 0,
            "learners_enrolled": learners_count or 0,
            "created_at": c.created_at or datetime.datetime.utcnow(),
            "updated_at": c.updated_at or datetime.datetime.utcnow()
        })
    return res

@app.post("/api/admin/courses")
def create_course(
    req: CourseCreateRequest,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new course in draft status and kick off background question generation."""
    title_clean = req.title.strip()
    if len(title_clean) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course title must be at least 2 characters long."
        )

    # Check title uniqueness
    existing = db.query(DBCourse).filter(func.lower(DBCourse.title_en) == title_clean.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A course with this title already exists. Please choose a unique title."
        )

    course_id = f"course-{uuid.uuid4().hex[:8]}"
    desc_clean = req.description.strip() if req.description else ""
    notes_clean = req.notes.strip() if req.notes else ""
    if not notes_clean:
        notes_clean = (
            f"Core conceptual introduction and practical principles of {title_clean}. "
            f"This course explores foundational definitions, everyday applications, and real-life scenarios "
            f"to help students deeply understand the concepts behind {title_clean} without rote memorization."
        )

    difficulty_clean = req.difficulty or "Easy"

    course = DBCourse(
        id=course_id,
        title_en=title_clean,
        description_en=desc_clean,
        notes=notes_clean,
        difficulty=difficulty_clean,
        status="draft",
        created_by="admin"
    )
    db.add(course)

    # Add audit log
    audit = DBAuditLog(
        id=f"log-{uuid.uuid4().hex[:8]}",
        action="create",
        course_id=course_id,
        user_id="admin",
        details=f"Created course '{course.title_en}' (Draft)"
    )
    db.add(audit)

    # Create job entry
    job_id = f"job-{uuid.uuid4().hex[:8]}"
    job = DBJob(
        id=job_id,
        course_id=course_id,
        status="queued",
        progress="Starting AI scenario generation..."
    )
    db.add(job)
    db.commit()
    db.refresh(course)

    # Trigger background AI generation
    course_service.generate_course_content_background(
        db_factory=SessionLocal,
        job_id=job_id,
        course_id=course_id,
        notes=notes_clean,
        title=title_clean,
        difficulty=difficulty_clean
    )

    return {
        "id": course.id,
        "course_id": course.id,
        "title": course.title_en,
        "title_en": course.title_en,
        "title_ta": course.title_ta or "",
        "title_hi": course.title_hi or "",
        "description": course.description_en or "",
        "description_en": course.description_en or "",
        "description_ta": course.description_ta or "",
        "description_hi": course.description_hi or "",
        "status": "draft",
        "difficulty": course.difficulty or "Easy",
        "question_count": 0,
        "learners_enrolled": 0,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "job_id": job_id,
        "message": "Course created. AI practice questions are generating in the background."
    }

@app.get("/api/admin/courses/{course_id}")
def admin_get_course(
    course_id: str,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    questions_res = []
    for q in course.questions:
        try:
            key_pts = json.loads(q.key_points_json or "[]")
            hints_en = json.loads(q.hints_en_json or "[]")
            hints_ta = json.loads(q.hints_ta_json or "[]")
            hints_hi = json.loads(q.hints_hi_json or "[]")
            verifier = json.loads(q.verifier_result_json or "{}")
        except Exception:
            key_pts, hints_en, hints_ta, hints_hi, verifier = [], [], [], [], {}

        questions_res.append({
            "id": q.id,
            "course_id": q.course_id,
            "text_en": q.text_en,
            "text_ta": q.text_ta,
            "text_hi": q.text_hi,
            "key_points": key_pts,
            "hints_en": hints_en,
            "hints_ta": hints_ta,
            "hints_hi": hints_hi,
            "verifier_result": verifier,
            "approved": q.approved,
            "manually_edited": q.manually_edited,
            "position": q.position
        })

    return {
        "id": course.id,
        "title_en": course.title_en,
        "title_ta": course.title_ta,
        "title_hi": course.title_hi,
        "description_en": course.description_en,
        "description_ta": course.description_ta,
        "description_hi": course.description_hi,
        "notes": course.notes,
        "difficulty": course.difficulty,
        "status": course.status,
        "questions": questions_res,
        "created_at": course.created_at,
        "updated_at": course.updated_at
    }

@app.put("/api/admin/courses/{course_id}")
def admin_update_course(
    course_id: str,
    req: CourseUpdateRequest,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    if req.title_en is not None:
        course.title_en = req.title_en.strip()
    if req.title_ta is not None:
        course.title_ta = req.title_ta.strip()
    if req.title_hi is not None:
        course.title_hi = req.title_hi.strip()
    if req.description_en is not None:
        course.description_en = req.description_en.strip()
    if req.description_ta is not None:
        course.description_ta = req.description_ta.strip()
    if req.description_hi is not None:
        course.description_hi = req.description_hi.strip()
    if req.notes is not None:
        course.notes = req.notes.strip()
    if req.difficulty is not None:
        course.difficulty = req.difficulty
    if req.status is not None:
        course.status = req.status

    course.updated_at = datetime.datetime.utcnow()

    # Audit log
    audit = DBAuditLog(
        id=f"log-{uuid.uuid4().hex[:8]}",
        action="update",
        course_id=course_id,
        user_id="admin",
        details=f"Updated details of course '{course.title_en}'"
    )
    db.add(audit)
    db.commit()

    return {"status": "updated", "course_id": course_id}

@app.post("/api/admin/courses/{course_id}/publish")
def publish_course(
    course_id: str,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    approved_q = [q for q in course.questions if q.approved]
    if len(approved_q) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot publish. Course needs at least 3 approved questions (currently has {len(approved_q)})."
        )

    # Check multilingual completeness
    has_ta = bool(course.title_ta and any(q.text_ta for q in approved_q))
    has_hi = bool(course.title_hi and any(q.text_hi for q in approved_q))
    if not (has_ta and has_hi):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish. Course requires complete Tamil and Hindi translations."
        )

    course.status = "published"
    course.updated_at = datetime.datetime.utcnow()

    audit = DBAuditLog(
        id=f"log-{uuid.uuid4().hex[:8]}",
        action="publish",
        course_id=course_id,
        user_id="admin",
        details=f"Published course '{course.title_en}'"
    )
    db.add(audit)
    db.commit()

    return {"status": "published", "course_id": course_id}

@app.post("/api/admin/courses/{course_id}/unpublish")
def unpublish_course(
    course_id: str,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    course.status = "draft"
    course.updated_at = datetime.datetime.utcnow()

    audit = DBAuditLog(
        id=f"log-{uuid.uuid4().hex[:8]}",
        action="unpublish",
        course_id=course_id,
        user_id="admin",
        details=f"Unpublished course '{course.title_en}' (set to Draft)"
    )
    db.add(audit)
    db.commit()

    return {"status": "draft", "course_id": course_id}

@app.post("/api/admin/courses/{course_id}/cancel")
def cancel_course(
    course_id: str,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    course.status = "cancelled"
    course.updated_at = datetime.datetime.utcnow()

    audit = DBAuditLog(
        id=f"log-{uuid.uuid4().hex[:8]}",
        action="cancel",
        course_id=course_id,
        user_id="admin",
        details=f"Archived/Cancelled course '{course.title_en}'"
    )
    db.add(audit)
    db.commit()

    return {"status": "cancelled", "course_id": course_id, "message": "Course archived. Learner progress is preserved."}

@app.post("/api/admin/courses/{course_id}/restore")
def restore_course(
    course_id: str,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    course.status = "draft"
    course.updated_at = datetime.datetime.utcnow()

    audit = DBAuditLog(
        id=f"log-{uuid.uuid4().hex[:8]}",
        action="restore",
        course_id=course_id,
        user_id="admin",
        details=f"Restored cancelled course '{course.title_en}' to Draft"
    )
    db.add(audit)
    db.commit()

    return {"status": "draft", "course_id": course_id, "message": "Course restored to Draft."}

@app.delete("/api/admin/courses/{course_id}")
def delete_course(
    course_id: str,
    req: CourseDeleteRequest,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes course, questions, and all attempts after exact title confirmation.
    """
    course = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    if req.confirm_title.strip().lower() != course.title_en.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation failed. The typed title does not match the course title exactly."
        )

    learners_affected = db.query(func.count(func.distinct(DBAttempt.user_id))).filter(DBAttempt.course_id == course.id).scalar() or 0

    # Delete course (cascades to questions, attempts, jobs, audit_logs)
    db.delete(course)
    db.commit()

    return {
        "status": "deleted",
        "course_id": course_id,
        "learners_affected": learners_affected,
        "message": f"Course permanently deleted. {learners_affected} learners had progress removed."
    }

@app.post("/api/admin/courses/{course_id}/duplicate")
def duplicate_course(
    course_id: str,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    original = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Original course not found.")

    new_id = f"course-{uuid.uuid4().hex[:8]}"
    new_course = DBCourse(
        id=new_id,
        title_en=f"Copy of {original.title_en}",
        title_ta=f"{original.title_ta} (நகல்)" if original.title_ta else "",
        title_hi=f"{original.title_hi} (प्रतिलिपि)" if original.title_hi else "",
        description_en=original.description_en,
        description_ta=original.description_ta,
        description_hi=original.description_hi,
        notes=original.notes,
        difficulty=original.difficulty,
        status="draft",
        created_by="admin"
    )
    db.add(new_course)
    db.flush()

    # Clone questions
    for q in original.questions:
        new_q = DBQuestion(
            id=f"q-{uuid.uuid4().hex[:8]}",
            course_id=new_id,
            text_en=q.text_en,
            text_ta=q.text_ta,
            text_hi=q.text_hi,
            key_points_json=q.key_points_json,
            hints_en_json=q.hints_en_json,
            hints_ta_json=q.hints_ta_json,
            hints_hi_json=q.hints_hi_json,
            verifier_result_json=q.verifier_result_json,
            approved=q.approved,
            manually_edited=q.manually_edited,
            position=q.position
        )
        db.add(new_q)

    audit = DBAuditLog(
        id=f"log-{uuid.uuid4().hex[:8]}",
        action="create",
        course_id=new_id,
        user_id="admin",
        details=f"Duplicated course from '{original.title_en}'"
    )
    db.add(audit)
    db.commit()

    return {"status": "duplicated", "new_course_id": new_id, "title": new_course.title_en}

@app.post("/api/admin/courses/load-sample")
def load_sample_course(
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = course_service.create_sample_deadlock_course(db)
    return {"status": "loaded", "course_id": course.id, "title": course.title_en}

@app.post("/api/admin/courses/{course_id}/regenerate-all")
def regenerate_all_questions(
    course_id: str,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    job_id = f"job-{uuid.uuid4().hex[:8]}"
    job = DBJob(
        id=job_id,
        course_id=course_id,
        status="queued",
        progress="Starting question regeneration..."
    )
    db.add(job)
    db.commit()

    course_service.generate_course_content_background(
        db_factory=SessionLocal,
        job_id=job_id,
        course_id=course_id,
        notes=course.notes,
        title=course.title_en,
        difficulty=course.difficulty
    )

    return {"status": "started", "job_id": job_id}

@app.post("/api/admin/courses/{course_id}/questions")
def add_question_manually(
    course_id: str,
    req: QuestionCreateRequest,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    q_count = len(course.questions)
    new_q = DBQuestion(
        id=f"q-{uuid.uuid4().hex[:8]}",
        course_id=course_id,
        text_en=req.text_en.strip(),
        text_ta=req.text_ta.strip() if req.text_ta else "",
        text_hi=req.text_hi.strip() if req.text_hi else "",
        key_points_json=json.dumps(req.key_points),
        hints_en_json=json.dumps(req.hints_en),
        hints_ta_json=json.dumps(req.hints_ta or []),
        hints_hi_json=json.dumps(req.hints_hi or []),
        verifier_result_json=json.dumps({"is_valid": True, "manually_authored": True}),
        approved=req.approved if req.approved is not None else True,
        manually_edited=True,
        position=q_count + 1
    )
    db.add(new_q)
    course.updated_at = datetime.datetime.utcnow()
    db.commit()

    return {"status": "created", "question_id": new_q.id}

@app.put("/api/admin/questions/{question_id}")
def update_question(
    question_id: str,
    req: QuestionUpdateRequest,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    q = db.query(DBQuestion).filter(DBQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    if req.text_en is not None:
        q.text_en = req.text_en.strip()
    if req.text_ta is not None:
        q.text_ta = req.text_ta.strip()
    if req.text_hi is not None:
        q.text_hi = req.text_hi.strip()
    if req.key_points is not None:
        q.key_points_json = json.dumps(req.key_points)
    if req.hints_en is not None:
        q.hints_en_json = json.dumps(req.hints_en)
    if req.hints_ta is not None:
        q.hints_ta_json = json.dumps(req.hints_ta)
    if req.hints_hi is not None:
        q.hints_hi_json = json.dumps(req.hints_hi)
    if req.approved is not None:
        q.approved = req.approved
    if req.position is not None:
        q.position = req.position

    q.manually_edited = True
    if q.course:
        q.course.updated_at = datetime.datetime.utcnow()
    db.commit()

    return {"status": "updated", "question_id": question_id}

@app.delete("/api/admin/questions/{question_id}")
def delete_question(
    question_id: str,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    q = db.query(DBQuestion).filter(DBQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    db.delete(q)
    db.commit()
    return {"status": "deleted", "question_id": question_id}

@app.get("/api/admin/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(
    job_id: str,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return {
        "job_id": job.id,
        "course_id": job.course_id,
        "status": job.status,
        "progress": job.progress,
        "created_at": job.created_at
    }

@app.post("/api/admin/jobs/{job_id}/cancel")
def cancel_job_endpoint(
    job_id: str,
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    course_service.cancel_job(job_id)
    job.status = "cancelled"
    job.progress = "Cancelled by admin."
    db.commit()

    return {"status": "cancelled", "job_id": job_id}

@app.get("/api/admin/users", response_model=List[UserResponse])
def admin_list_users(
    admin: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = db.query(DBUser).order_by(DBUser.created_at.desc()).all()
    res = []
    for u in users:
        att_count = len(u.attempts)
        avg_gap = round(sum(a.gap for a in u.attempts) / att_count, 1) if att_count > 0 else 0.0
        res.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "language": u.language or "en",
            "created_at": u.created_at,
            "attempts_count": att_count,
            "average_gap": avg_gap
        })
    return res

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT)
