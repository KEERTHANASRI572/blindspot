from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()

class DBUser(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempts = relationship("DBAttempt", back_populates="user", cascade="all, delete-orphan")

class DBCourse(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True)
    title_en = Column(String, nullable=False)
    title_ta = Column(String, default="")
    title_hi = Column(String, default="")
    
    description_en = Column(Text, default="")
    description_ta = Column(Text, default="")
    description_hi = Column(Text, default="")
    
    notes = Column(Text, nullable=False)
    difficulty = Column(String, default="Easy") # Easy | Medium | Hard
    status = Column(String, default="draft", index=True) # draft | published | cancelled
    
    created_by = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    questions = relationship("DBQuestion", back_populates="course", cascade="all, delete-orphan", order_by="DBQuestion.position")
    attempts = relationship("DBAttempt", back_populates="course", cascade="all, delete-orphan")
    jobs = relationship("DBJob", back_populates="course", cascade="all, delete-orphan")
    audit_logs = relationship("DBAuditLog", back_populates="course", cascade="all, delete-orphan")

class DBQuestion(Base):
    __tablename__ = "questions"
    id = Column(String, primary_key=True)
    course_id = Column(String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    text_en = Column(Text, nullable=False)
    text_ta = Column(Text, default="")
    text_hi = Column(Text, default="")
    
    key_points_json = Column(Text, default="[]") # List of key reasoning points
    hints_en_json = Column(Text, default="[]") # 4 hints
    hints_ta_json = Column(Text, default="[]")
    hints_hi_json = Column(Text, default="[]")
    
    verifier_result_json = Column(Text, default="{}")
    approved = Column(Boolean, default=True)
    manually_edited = Column(Boolean, default=False)
    position = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("DBCourse", back_populates="questions")
    attempts = relationship("DBAttempt", back_populates="question", cascade="all, delete-orphan")

class DBAttempt(Base):
    __tablename__ = "attempts"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    confidence = Column(Float, nullable=False) # 0-100
    answer = Column(Text, default="")
    score = Column(Float, nullable=False) # 0-100
    gap = Column(Float, nullable=False) # confidence - score
    hints_used = Column(Integer, default=0)
    
    misconception_id = Column(String, nullable=True)
    misconception_name = Column(String, nullable=True)
    evidence_quote = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("DBUser", back_populates="attempts")
    course = relationship("DBCourse", back_populates="attempts")
    question = relationship("DBQuestion", back_populates="attempts")

class DBJob(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True)
    course_id = Column(String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="queued") # queued | processing | completed | failed | cancelled
    progress = Column(String, default="Initializing")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    course = relationship("DBCourse", back_populates="jobs")

class DBAuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True)
    action = Column(String, nullable=False) # create | update | publish | unpublish | cancel | restore | delete
    course_id = Column(String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(String, default="admin")
    details = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("DBCourse", back_populates="audit_logs")
