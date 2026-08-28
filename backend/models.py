from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from database import Base


# ==========================================
# USER MODEL
# ==========================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ==========================================
# RESUME HISTORY
# ==========================================

class ResumeHistory(Base):

    __tablename__ = "resume_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False
    )

    ats_score = Column(
        Integer,
        default=0
    )

    skills = Column(
        Text,
        default=""
    )

    analysis = Column(
        Text,
        default=""
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ==========================================
# INTERVIEW HISTORY
# ==========================================

class InterviewHistory(Base):

    __tablename__ = "interview_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False
    )

    score = Column(
        Integer,
        default=0
    )

    feedback = Column(
        Text,
        default=""
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ==========================================
# CODING HISTORY
# ==========================================

class CodingHistory(Base):

    __tablename__ = "coding_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False
    )

    language = Column(
        String(30),
        default=""
    )

    question = Column(
        Text,
        default=""
    )

    score = Column(
        Integer,
        default=0
    )

    feedback = Column(
        Text,
        default=""
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )