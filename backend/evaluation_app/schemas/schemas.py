from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # admin, faculty, student

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Profile Schemas
class FacultyCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    employee_id: str
    department_id: int
    designation: Optional[str] = None

class FacultyResponse(BaseModel):
    id: int
    user: UserResponse
    employee_id: str
    department_id: Optional[int]
    designation: Optional[str]

    class Config:
        from_attributes = True

class StudentCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    roll_number: str
    department_id: int
    class_id: int

class StudentResponse(BaseModel):
    id: int
    user: UserResponse
    roll_number: str
    department_id: Optional[int]
    class_id: Optional[int]

    class Config:
        from_attributes = True

# Department Schemas
class DepartmentCreate(BaseModel):
    name: str
    code: str

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True

# Subject Schemas
class SubjectCreate(BaseModel):
    name: str
    code: str
    department_id: int

class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    department_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Class Schemas
class ClassCreate(BaseModel):
    name: str
    department_id: int
    batch_year: int

class ClassResponse(BaseModel):
    id: int
    name: str
    department_id: int
    batch_year: int
    created_at: datetime

    class Config:
        from_attributes = True

# Assignment Schemas
class FacultyAssignmentCreate(BaseModel):
    faculty_id: int
    subject_id: int
    class_id: int

class FacultyAssignmentResponse(BaseModel):
    id: int
    faculty_id: int
    subject_id: int
    class_id: int
    created_at: datetime
    faculty: Optional[Any] = None
    subject: Optional[Any] = None
    student_class: Optional[Any] = None

    class Config:
        from_attributes = True

# Exam Schemas
class ExamCreate(BaseModel):
    title: str
    subject_id: int
    class_id: int
    max_marks: int
    passing_marks: int

class ExamResponse(BaseModel):
    id: int
    title: str
    subject_id: int
    class_id: int
    max_marks: int
    passing_marks: int
    status: str
    question_paper_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Answer Sheet and Evaluation Schemas
class EvaluationResultCreate(BaseModel):
    question_number: str
    max_marks: float
    marks_obtained: float
    feedback: str
    confidence_score: float

class EvaluationResultResponse(BaseModel):
    id: int
    answer_sheet_id: int
    question_number: str
    max_marks: float
    marks_obtained: float
    feedback: Optional[str]
    confidence_score: float
    status: str

    class Config:
        from_attributes = True

class EvaluationOverride(BaseModel):
    marks_obtained: float
    feedback: str

class AnswerSheetResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int
    scanned_file_url: Optional[str]
    total_marks: float
    grade: Optional[str]
    status: str
    reviewer_remarks: Optional[str]
    created_at: datetime
    student_roll: Optional[str] = None
    student_name: Optional[str] = None

    class Config:
        from_attributes = True

class OCRTranscriptResponse(BaseModel):
    id: int
    answer_sheet_id: int
    raw_text: Optional[str]
    structured_transcript_json: Optional[Any]

    class Config:
        from_attributes = True

# Complaint Schemas
class ComplaintCreate(BaseModel):
    answer_sheet_id: int
    category: str
    description: str

class ComplaintUpdate(BaseModel):
    status: str  # in_progress, resolved, rejected
    resolution_remarks: str

class ComplaintResponse(BaseModel):
    id: int
    answer_sheet_id: int
    student_id: int
    category: str
    description: str
    status: str
    resolution_remarks: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
    student_name: Optional[str] = None
    exam_title: Optional[str] = None

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
