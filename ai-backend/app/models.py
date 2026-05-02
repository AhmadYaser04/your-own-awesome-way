"""SQLAlchemy ORM models — mirror the public schema in db/init.sql"""
from sqlalchemy import (
    Column, String, Text, Integer, Numeric, Boolean, ForeignKey, DateTime, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(Text, unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    full_name = Column(Text)
    email = Column(Text)
    role = Column(Text, nullable=False, default="user")  # 'user' | 'admin'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    requests = relationship("EquivalencyRequest", back_populates="user",
                            foreign_keys="EquivalencyRequest.user_id", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    full_name = Column(Text)
    email = Column(Text)
    saudi_university = Column(Text)  # legacy column name; means "previous university"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profile")


class AutCourse(Base):
    __tablename__ = "aut_courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_code = Column(Text, unique=True, nullable=False)
    course_name_ar = Column(Text, nullable=False)
    course_name_en = Column(Text)
    credits = Column(Integer, nullable=False, default=3)
    category = Column(Text, nullable=False)
    description_ar = Column(Text)
    description_en = Column(Text)
    prerequisites = Column(ARRAY(Text), default=[])
    display_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class EquivalencyRequest(Base):
    __tablename__ = "equivalency_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    student_full_name = Column(Text)
    student_id = Column(Text)
    student_college = Column(Text)
    student_major = Column(Text)

    previous_diploma_source = Column(Text)
    previous_university = Column(Text)
    previous_major_name = Column(Text)
    saudi_course_name = Column(Text)
    saudi_course_description = Column(Text)

    transfer_type = Column(Text)
    transfer_semester = Column(Text)
    academic_year = Column(Text)
    semester = Column(Text)
    cumulative_gpa = Column(Numeric)
    diploma_gpa = Column(Numeric)

    student_type = Column(Text, nullable=False, default="different_major")
    credits_cap = Column(Integer, nullable=False, default=132)

    uploaded_file_url = Column(Text)
    extraction_status = Column(Text, nullable=False, default="pending")
    extraction_raw_text = Column(Text)
    input_mode = Column(Text, nullable=False, default="text")

    ai_result = Column(JSONB, nullable=False, default=dict)
    matched_aut_code = Column(Text)
    matched_aut_name = Column(Text)
    similarity = Column(Numeric)
    verdict = Column(Text)

    status = Column(Text, nullable=False, default="pending")
    admin_notes = Column(Text)
    reviewer_name = Column(Text)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    reviewed_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="requests", foreign_keys=[user_id])
    items = relationship("EquivalencyRequestItem", back_populates="request", cascade="all, delete-orphan")
    matches = relationship("EquivalencyMatch", back_populates="request", cascade="all, delete-orphan")


class EquivalencyRequestItem(Base):
    __tablename__ = "equivalency_request_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("equivalency_requests.id", ondelete="CASCADE"), nullable=False)
    source_course_name = Column(Text, nullable=False)
    source_course_code = Column(Text)
    source_credits = Column(Numeric, nullable=False, default=3)
    source_grade = Column(Text)
    source_grade_letter = Column(Text)
    source_semester = Column(Text)
    display_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    request = relationship("EquivalencyRequest", back_populates="items")


class EquivalencyMatch(Base):
    __tablename__ = "equivalency_matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("equivalency_requests.id", ondelete="CASCADE"), nullable=False)
    aut_course_id = Column(UUID(as_uuid=True), ForeignKey("aut_courses.id", ondelete="SET NULL"))
    source_item_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=False, default=[])
    total_source_credits = Column(Numeric, nullable=False, default=0)
    aut_credits = Column(Integer, nullable=False, default=0)
    similarity = Column(Numeric)
    verdict = Column(Text, nullable=False, default="pending")
    is_manual = Column(Boolean, nullable=False, default=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    request = relationship("EquivalencyRequest", back_populates="matches")
