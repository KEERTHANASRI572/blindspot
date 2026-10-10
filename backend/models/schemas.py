from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import re

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

# --- AUTH SCHEMAS ---
class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=8, max_length=100)
    language: Optional[str] = "en"

    @field_validator('email')
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(EMAIL_REGEX, v):
            raise ValueError('Please enter a valid email address.')
        return v

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=150)
    password: str

    @field_validator('email')
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(EMAIL_REGEX, v):
            raise ValueError('Please enter a valid email address.')
        return v

class AdminLoginRequest(BaseModel):
    password: str

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    language: str
    created_at: datetime
    attempts_count: Optional[int] = 0
    average_gap: Optional[float] = 0.0

# --- VERIFIER & AUXILIARY SCHEMAS ---
class VerifierVerdict(BaseModel):
    is_valid: bool
    ambiguity_score_0_10: int = 1
    recall_dependency_score_0_10: int = 1
    factual_correctness: bool = True
    verdict_explanation: str = ""
    trust_rationale: str = ""

# --- QUESTION SCHEMAS ---
class QuestionModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    course_id: str
    text_en: str
    text_ta: Optional[str] = ""
    text_hi: Optional[str] = ""
    key_points: List[str] = []
    hints_en: List[Dict[str, Any]] = []
    hints_ta: List[Dict[str, Any]] = []
    hints_hi: List[Dict[str, Any]] = []
    verifier_result: Optional[Dict[str, Any]] = None
    approved: bool = True
    manually_edited: bool = False
    position: int = 0

class QuestionCreateRequest(BaseModel):
    text_en: str
    text_ta: Optional[str] = ""
    text_hi: Optional[str] = ""
    key_points: List[str] = []
    hints_en: List[Dict[str, Any]] = []
    hints_ta: Optional[List[Dict[str, Any]]] = []
    hints_hi: Optional[List[Dict[str, Any]]] = []
    approved: Optional[bool] = True

class QuestionUpdateRequest(BaseModel):
    text_en: Optional[str] = None
    text_ta: Optional[str] = None
    text_hi: Optional[str] = None
    key_points: Optional[List[str]] = None
    hints_en: Optional[List[Dict[str, Any]]] = None
    hints_ta: Optional[List[Dict[str, Any]]] = None
    hints_hi: Optional[List[Dict[str, Any]]] = None
    approved: Optional[bool] = None
    position: Optional[int] = None

# --- COURSE SCHEMAS ---
class CourseCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field("", max_length=500)
    notes: Optional[str] = Field("", max_length=50000)
    difficulty: Optional[str] = "Easy"

class CourseUpdateRequest(BaseModel):
    title_en: Optional[str] = None
    title_ta: Optional[str] = None
    title_hi: Optional[str] = None
    description_en: Optional[str] = None
    description_ta: Optional[str] = None
    description_hi: Optional[str] = None
    notes: Optional[str] = None
    difficulty: Optional[str] = None
    status: Optional[str] = None

class CourseDeleteRequest(BaseModel):
    confirm_title: str

class CourseListItem(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    status: str
    question_count: int
    learners_enrolled: int
    created_at: datetime
    updated_at: datetime
    is_new: bool = False
    is_updated: bool = False

class CourseDetailResponse(BaseModel):
    id: str
    title_en: str
    title_ta: str
    title_hi: str
    description_en: str
    description_ta: str
    description_hi: str
    notes: str
    difficulty: str
    status: str
    questions: List[QuestionModel] = []
    created_at: datetime
    updated_at: datetime

# --- LEARNER PRACTICE & PROGRESS ---
class PracticeSubmitRequest(BaseModel):
    course_id: str
    question_id: str
    confidence: float = Field(..., ge=0, le=100)
    answer: str
    hints_used: int = 0
    language: Optional[str] = "en"

class PracticeResultResponse(BaseModel):
    attempt_id: str
    confidence: float
    score: float
    gap: float
    status_color: str
    friendly_summary: str
    misconception_name: Optional[str] = None
    evidence_quote: Optional[str] = None
    explanation: str
    hints: List[Dict[str, Any]] = []

class UserProgressResponse(BaseModel):
    average_gap: float
    courses_completed: int
    total_attempts: int
    history: List[Dict[str, Any]] = []
    top_mistake: str
    top_strength: str

# --- JOB & ADMIN DASHBOARD ---
class JobStatusResponse(BaseModel):
    job_id: str
    course_id: str
    status: str
    progress: str
    created_at: datetime

class AdminDashboardStats(BaseModel):
    total_courses: int
    total_learners: int
    average_confidence_gap: float
    recent_activity: List[Dict[str, Any]] = []
