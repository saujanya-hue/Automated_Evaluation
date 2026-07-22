from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from evaluation_app.database.session import get_db
from evaluation_app.models.models import (
    User, Student, AnswerSheet, Exam, EvaluationResult, OCRTranscript, Complaint, Notification
)
from evaluation_app.schemas.schemas import (
    AnswerSheetResponse, ComplaintCreate, ComplaintResponse, NotificationResponse
)
from evaluation_app.api.dependencies import RoleChecker, get_current_user

router = APIRouter(prefix="/student", tags=["Student Portal"])
student_only = Depends(RoleChecker(["student"]))

# Helper: Get Student profile
def get_student_profile(current_user: User, db: Session) -> Student:
    stud = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stud:
        raise HTTPException(status_code=403, detail="Student profile not found")
    return stud

@router.get("/dashboard-stats", dependencies=[student_only])
def get_student_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stud = get_student_profile(current_user, db)
    # Total exams attempted (answer sheets uploaded)
    total_exams = db.query(AnswerSheet).filter(AnswerSheet.student_id == stud.id).count()
    # Published results
    published_exams = db.query(AnswerSheet).join(Exam).filter(
        AnswerSheet.student_id == stud.id, Exam.status == "completed"
    ).count()
    # Active complaints
    active_complaints = db.query(Complaint).filter(Complaint.student_id == stud.id, Complaint.status != "resolved").count()
    
    # Calculate GPA estimate based on published exam grades
    sheets = db.query(AnswerSheet).join(Exam).filter(
        AnswerSheet.student_id == stud.id, Exam.status == "completed"
    ).all()
    
    gpa_mapping = {"A+": 10.0, "A": 9.0, "B": 8.0, "C": 6.0, "F": 0.0}
    total_gpa_points = sum([gpa_mapping.get(s.grade, 0.0) for s in sheets])
    avg_gpa = total_gpa_points / len(sheets) if sheets else 0.0
    
    return {
        "exams_attempted": total_exams,
        "results_published": published_exams,
        "active_complaints": active_complaints,
        "cgpa": round(avg_gpa, 2)
    }

@router.get("/exams", dependencies=[student_only])
def list_student_exams(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stud = get_student_profile(current_user, db)
    sheets = db.query(AnswerSheet).filter(AnswerSheet.student_id == stud.id).all()
    
    res = []
    for s in sheets:
        res.append({
            "answer_sheet_id": s.id,
            "exam_id": s.exam_id,
            "exam_title": s.exam.title,
            "subject_name": s.exam.subject.name,
            "subject_code": s.exam.subject.code,
            "max_marks": s.exam.max_marks,
            "marks_obtained": s.total_marks if s.exam.status == "completed" else None,
            "grade": s.grade if s.exam.status == "completed" else None,
            "exam_status": s.exam.status,  # active, evaluating, completed
            "grading_status": s.status      # pending, evaluated, reviewed
        })
    return res

@router.get("/results/{sheet_id}", dependencies=[student_only])
def get_student_result_details(sheet_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stud = get_student_profile(current_user, db)
    sheet = db.query(AnswerSheet).filter(AnswerSheet.id == sheet_id, AnswerSheet.student_id == stud.id).first()
    if not sheet:
        raise HTTPException(status_code=404, detail="Answer sheet not found or access denied")
        
    if sheet.exam.status != "completed":
        raise HTTPException(status_code=403, detail="Results for this exam have not been published by faculty yet.")
        
    ocr = db.query(OCRTranscript).filter(OCRTranscript.answer_sheet_id == sheet_id).first()
    results = db.query(EvaluationResult).filter(EvaluationResult.answer_sheet_id == sheet_id).all()
    
    return {
        "exam_title": sheet.exam.title,
        "subject_name": sheet.exam.subject.name,
        "subject_code": sheet.exam.subject.code,
        "total_marks": sheet.total_marks,
        "max_marks": sheet.exam.max_marks,
        "grade": sheet.grade,
        "reviewer_remarks": sheet.reviewer_remarks,
        "scanned_file_url": sheet.scanned_file_url,
        "ocr_transcript": ocr.raw_text if ocr else "",
        "question_evaluations": [
            {
                "question_number": r.question_number,
                "max_marks": r.max_marks,
                "marks_obtained": r.marks_obtained,
                "feedback": r.feedback,
                "confidence_score": r.confidence_score
            } for r in results
        ]
    }

# --- COMPLAINTS ---
@router.post("/complaints", response_model=ComplaintResponse, dependencies=[student_only])
def raise_complaint(complaint: ComplaintCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stud = get_student_profile(current_user, db)
    
    # Check if complaint is for a valid, published answer sheet
    sheet = db.query(AnswerSheet).filter(AnswerSheet.id == complaint.answer_sheet_id, AnswerSheet.student_id == stud.id).first()
    if not sheet:
        raise HTTPException(status_code=404, detail="Answer sheet not found")
    if sheet.exam.status != "completed":
        raise HTTPException(status_code=400, detail="Cannot raise complaint on unpublished results")
        
    db_complaint = Complaint(
        answer_sheet_id=complaint.answer_sheet_id,
        student_id=stud.id,
        category=complaint.category,
        description=complaint.description,
        status="raised"
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    
    return {
        "id": db_complaint.id,
        "answer_sheet_id": db_complaint.answer_sheet_id,
        "student_id": db_complaint.student_id,
        "category": db_complaint.category,
        "description": db_complaint.description,
        "status": db_complaint.status,
        "resolution_remarks": db_complaint.resolution_remarks,
        "created_at": db_complaint.created_at,
        "resolved_at": db_complaint.resolved_at,
        "student_name": current_user.name,
        "exam_title": sheet.exam.title
    }

@router.get("/complaints", response_model=List[ComplaintResponse], dependencies=[student_only])
def list_my_complaints(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stud = get_student_profile(current_user, db)
    complaints = db.query(Complaint).filter(Complaint.student_id == stud.id).all()
    res = []
    for c in complaints:
        res.append({
            "id": c.id,
            "answer_sheet_id": c.answer_sheet_id,
            "student_id": c.student_id,
            "category": c.category,
            "description": c.description,
            "status": c.status,
            "resolution_remarks": c.resolution_remarks,
            "created_at": c.created_at,
            "resolved_at": c.resolved_at,
            "student_name": current_user.name,
            "exam_title": c.answer_sheet.exam.title if c.answer_sheet and c.answer_sheet.exam else "Exam"
        })
    return res

# --- NOTIFICATIONS ---
@router.get("/notifications", response_model=List[NotificationResponse], dependencies=[student_only])
def list_my_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).all()
