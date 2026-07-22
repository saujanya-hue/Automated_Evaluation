from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON, Table
from sqlalchemy.orm import relationship
from evaluation_app.database.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, faculty, student
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student_profile = relationship("Student", uselist=False, back_populates="user", cascade="all, delete-orphan")
    faculty_profile = relationship("Faculty", uselist=False, back_populates="user", cascade="all, delete-orphan")
    uploaded_files = relationship("UploadedFile", back_populates="uploader")
    notifications = relationship("Notification", back_populates="user")


class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    subjects = relationship("Subject", back_populates="department", cascade="all, delete")
    classes = relationship("Class", back_populates="department", cascade="all, delete")
    faculty_members = relationship("Faculty", back_populates="department")
    students = relationship("Student", back_populates="department")


class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    department = relationship("Department", back_populates="subjects")
    exams = relationship("Exam", back_populates="subject")
    faculty_assignments = relationship("FacultyAssignment", back_populates="subject", cascade="all, delete")


class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., CSE-2024-A, EEE-2025-B
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    batch_year = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    department = relationship("Department", back_populates="classes")
    students = relationship("Student", back_populates="student_class")
    exams = relationship("Exam", back_populates="exam_class")
    faculty_assignments = relationship("FacultyAssignment", back_populates="student_class", cascade="all, delete")


class Faculty(Base):
    __tablename__ = "faculty"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id = Column(String, unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    designation = Column(String, nullable=True)
    
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty_members")
    assignments = relationship("FacultyAssignment", back_populates="faculty", cascade="all, delete")


class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    roll_number = Column(String, unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="SET NULL"), nullable=True)
    
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    student_class = relationship("Class", back_populates="students")
    answer_sheets = relationship("AnswerSheet", back_populates="student")
    complaints = relationship("Complaint", back_populates="student")


class FacultyAssignment(Base):
    __tablename__ = "faculty_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    faculty = relationship("Faculty", back_populates="assignments")
    subject = relationship("Subject", back_populates="faculty_assignments")
    student_class = relationship("Class", back_populates="faculty_assignments")


class Exam(Base):
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    max_marks = Column(Integer, default=100)
    passing_marks = Column(Integer, default=40)
    question_paper_url = Column(String, nullable=True)  # Path to question paper file
    status = Column(String, default="draft")  # draft, active, evaluating, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    subject = relationship("Subject", back_populates="exams")
    exam_class = relationship("Class", back_populates="exams")
    answer_sheets = relationship("AnswerSheet", back_populates="exam", cascade="all, delete")


class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # zip, pdf, docx
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="uploaded")  # uploaded, processing, processed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    uploader = relationship("User", back_populates="uploaded_files")


class AnswerSheet(Base):
    __tablename__ = "answer_sheets"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    scanned_file_url = Column(String, nullable=True)
    total_marks = Column(Float, default=0.0)
    grade = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, evaluating, evaluated, reviewed
    reviewer_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    exam = relationship("Exam", back_populates="answer_sheets")
    student = relationship("Student", back_populates="answer_sheets")
    ocr_transcript = relationship("OCRTranscript", uselist=False, back_populates="answer_sheet", cascade="all, delete-orphan")
    evaluation_results = relationship("EvaluationResult", back_populates="answer_sheet", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="answer_sheet", cascade="all, delete-orphan")


class OCRTranscript(Base):
    __tablename__ = "ocr_transcripts"
    
    id = Column(Integer, primary_key=True, index=True)
    answer_sheet_id = Column(Integer, ForeignKey("answer_sheets.id", ondelete="CASCADE"), unique=True, nullable=False)
    raw_text = Column(Text, nullable=True)
    structured_transcript_json = Column(JSON, nullable=True)  # Question-wise extracted answers
    created_at = Column(DateTime, default=datetime.utcnow)
    
    answer_sheet = relationship("AnswerSheet", back_populates="ocr_transcript")


class EvaluationResult(Base):
    __tablename__ = "evaluation_results"
    
    id = Column(Integer, primary_key=True, index=True)
    answer_sheet_id = Column(Integer, ForeignKey("answer_sheets.id", ondelete="CASCADE"), nullable=False)
    question_number = Column(String, nullable=False)
    max_marks = Column(Float, default=10.0)
    marks_obtained = Column(Float, default=0.0)
    feedback = Column(Text, nullable=True)
    confidence_score = Column(Float, default=1.0)
    status = Column(String, default="ai_graded")  # ai_graded, edited
    created_at = Column(DateTime, default=datetime.utcnow)
    
    answer_sheet = relationship("AnswerSheet", back_populates="evaluation_results")


class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    answer_sheet_id = Column(Integer, ForeignKey("answer_sheets.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)  # marking_error, missing_marks, reevaluation
    description = Column(Text, nullable=False)
    status = Column(String, default="raised")  # raised, in_progress, resolved, rejected
    resolution_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    answer_sheet = relationship("AnswerSheet", back_populates="complaints")
    student = relationship("Student", back_populates="complaints")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")
