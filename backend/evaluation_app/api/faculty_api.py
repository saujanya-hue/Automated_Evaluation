from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import shutil
import zipfile
import logging
import time

from evaluation_app.database.session import get_db
from evaluation_app.models.models import (
    User, Faculty, FacultyAssignment, Exam, AnswerSheet, EvaluationResult, OCRTranscript, Student, Complaint, Subject, Class
)
from evaluation_app.schemas.schemas import (
    ExamCreate, ExamResponse, AnswerSheetResponse, EvaluationResultResponse, EvaluationOverride, ComplaintResponse, ComplaintUpdate
)
from evaluation_app.api.dependencies import RoleChecker, get_current_user
from evaluation_app.agents.agents import run_evaluation_pipeline

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/faculty", tags=["Faculty Portal"])
faculty_only = Depends(RoleChecker(["faculty"]))

# Helper: Safely delete file on Windows (with retry for file locking)
def safe_delete_file(file_path: str, max_retries: int = 3, retry_delay: float = 0.5) -> bool:
    """
    Safely delete a file with retry logic for Windows file locking issues.
    Returns True if deleted successfully, False otherwise.
    """
    for attempt in range(max_retries):
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Successfully deleted: {file_path}")
                return True
        except (OSError, PermissionError) as e:
            if attempt < max_retries - 1:
                logger.warning(f"Failed to delete {file_path} (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {retry_delay}s...")
                time.sleep(retry_delay)
            else:
                logger.error(f"Failed to delete {file_path} after {max_retries} attempts: {e}")
                return False
    return False

# Helper: Get Faculty DB object from Current User
def get_faculty_profile(current_user: User, db: Session) -> Faculty:
    fac = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not fac:
        raise HTTPException(status_code=403, detail="Faculty profile not found")
    return fac

@router.get("/dashboard-stats", dependencies=[faculty_only])
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fac = get_faculty_profile(current_user, db)
    # Count of subjects assigned
    sub_count = db.query(FacultyAssignment).filter(FacultyAssignment.faculty_id == fac.id).distinct(FacultyAssignment.subject_id).count()
    # Count of classes assigned
    cls_count = db.query(FacultyAssignment).filter(FacultyAssignment.faculty_id == fac.id).distinct(FacultyAssignment.class_id).count()
    # Count of exams created
    assigned_subject_ids = [a.subject_id for a in fac.assignments]
    exams_count = db.query(Exam).filter(Exam.subject_id.in_(assigned_subject_ids)).count() if assigned_subject_ids else 0
    # Pending complaints
    complaints_count = db.query(Complaint).join(AnswerSheet).filter(AnswerSheet.exam_id.in_(
        db.query(Exam.id).filter(Exam.subject_id.in_(assigned_subject_ids))
    )).filter(Complaint.status == "raised").count() if assigned_subject_ids else 0
    
    return {
        "subjects": sub_count,
        "classes": cls_count,
        "exams": exams_count,
        "pending_complaints": complaints_count
    }

@router.get("/my-subjects", dependencies=[faculty_only])
def list_my_subjects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fac = get_faculty_profile(current_user, db)
    assignments = db.query(FacultyAssignment).filter(FacultyAssignment.faculty_id == fac.id).all()
    subjects = []
    seen = set()
    for a in assignments:
        if a.subject_id not in seen:
            seen.add(a.subject_id)
            subjects.append({
                "id": a.subject.id,
                "name": a.subject.name,
                "code": a.subject.code
            })
    return subjects

@router.get("/my-classes", dependencies=[faculty_only])
def list_my_classes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fac = get_faculty_profile(current_user, db)
    assignments = db.query(FacultyAssignment).filter(FacultyAssignment.faculty_id == fac.id).all()
    classes = []
    seen = set()
    for a in assignments:
        if a.class_id not in seen:
            seen.add(a.class_id)
            classes.append({
                "id": a.student_class.id,
                "name": a.student_class.name,
                "batch_year": a.student_class.batch_year
            })
    return classes

# --- EXAMS ---
@router.get("/exams", response_model=List[ExamResponse], dependencies=[faculty_only])
def list_exams(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fac = get_faculty_profile(current_user, db)
    sub_ids = [a.subject_id for a in fac.assignments]
    if not sub_ids:
        return []
    return db.query(Exam).filter(Exam.subject_id.in_(sub_ids)).all()

@router.post("/exams", response_model=ExamResponse, dependencies=[faculty_only])
def create_exam(exam: ExamCreate, db: Session = Depends(get_db)):
    db_exam = Exam(
        title=exam.title,
        subject_id=exam.subject_id,
        class_id=exam.class_id,
        max_marks=exam.max_marks,
        passing_marks=exam.passing_marks,
        status="draft"
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return db_exam

# --- UPLOAD AND AI RUNNER ---
def process_evaluation_task(exam_id: int, answer_sheet_id: int, student_id: int, file_path: str):
    logger_msg = f"Starting background evaluation job for Sheet {answer_sheet_id}"
    print(logger_msg)
    try:
        run_evaluation_pipeline(
            exam_id=exam_id,
            answer_sheet_id=answer_sheet_id,
            student_id=student_id,
            file_path=file_path
        )
    except Exception as e:
        print(f"Error in background task grading sheet {answer_sheet_id}: {e}")

@router.post("/exams/{exam_id}/upload-answer-sheets", dependencies=[faculty_only])
def upload_answer_sheets(
    exam_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # Find all students assigned to this exam's class
    students = db.query(Student).filter(Student.class_id == exam.class_id).all()
    if not students:
        raise HTTPException(status_code=400, detail="No students registered in this class yet")
    
    # Create roll_number -> student mapping (handle both string and int comparisons)
    roll_to_student = {str(s.roll_number): s for s in students}
    
    # Save the uploaded file locally with absolute path
    uploads_dir = os.path.abspath("./uploads/exams")
    os.makedirs(uploads_dir, exist_ok=True)
    temp_file_path = os.path.join(uploads_dir, f"exam_{exam_id}_temp_{file.filename}")
    
    logger.info(f"Saving uploaded file to: {temp_file_path}")
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    logger.info(f"File saved successfully. File size: {os.path.getsize(temp_file_path)} bytes")
    
    # Update Exam status
    exam.status = "evaluating"
    db.commit()
    
    sheets_triggered = []
    
    # Check if uploaded file is a ZIP
    if file.filename.lower().endswith('.zip'):
        logger.info(f"ZIP file detected: {file.filename}. Extracting answer sheets and question paper...")
        logger.info(f"Student roll numbers in class: {list(roll_to_student.keys())}")
        
        try:
            # Extract ZIP and match files to students by roll number
            with zipfile.ZipFile(temp_file_path, 'r') as zf:
                zip_file_list = zf.namelist()
                logger.info(f"ZIP contains {len(zip_file_list)} items: {zip_file_list}")
                
                # Common question paper filenames to look for
                question_paper_names = [
                    'qp.pdf', 'qp.jpg', 'qp.png', 'qp.jpeg', 'qp',
                    'qp_paper.pdf', 'qp_paper.jpg', 'qp_paper.png', 'qp_paper',
                    'questions.pdf', 'questions.jpg', 'questions.png',
                    'question_paper.pdf', 'question_paper.jpg', 'question_paper.png',
                    'answer_key.pdf', 'answer_key.jpg', 'answer_key.png',
                    'exam_questions.pdf', 'exam_questions.jpg', 'exam_questions.png',
                    'questionpaper.pdf', 'questionpaper.jpg', 'questionpaper.png',
                    'question_with_answerkey.pdf', 'question_with_answerkey.jpg', 'question_with_answerkey.png',
                    'questions', 'question_paper', 'answer_key', 'exam_questions', 'questionpaper', 'question_with_answerkey'
                ]
                
                # Create a mapping of roll numbers found in ZIP
                matched_students = {}
                unmatched_files = []
                question_paper_path = None
                
                for file_info in zf.filelist:
                    # Get filename without path
                    filename = os.path.basename(file_info.filename)
                    # Skip directories and hidden files
                    if file_info.is_dir() or filename.startswith('.'):
                        logger.debug(f"Skipping directory or hidden file: {file_info.filename}")
                        continue
                    
                    filename_lower = filename.lower()
                    
                    # Check if this is the question paper
                    is_question_paper = any(filename_lower == qp for qp in question_paper_names)
                    
                    if is_question_paper and not question_paper_path:
                        # Extract question paper
                        extracted_content = zf.read(file_info.filename)
                        question_paper_path = os.path.join(uploads_dir, f"exam_{exam_id}_questions_{filename}")
                        
                        with open(question_paper_path, "wb") as f:
                            f.write(extracted_content)
                        
                        logger.info(f"✓ Extracted question paper: '{filename}' -> {question_paper_path}")
                        continue
                    
                    # Get filename without extension to match with roll number
                    name_without_ext = os.path.splitext(filename)[0]
                    
                    logger.info(f"Processing file from ZIP: {filename}, name without ext: {name_without_ext}")
                    
                    # Extract roll number from filename (e.g., "RollNo_1" -> "1", "1.pdf" -> "1", "student_1" -> "1")
                    roll_number_str = name_without_ext
                    lower_name = name_without_ext.lower()
                    if lower_name.startswith('rollno_'):
                        roll_number_str = name_without_ext[7:]
                    elif lower_name.startswith('roll_'):
                        roll_number_str = name_without_ext[5:]
                    elif lower_name.startswith('student_'):
                        roll_number_str = name_without_ext[8:]
                    elif lower_name.startswith('rollno'):
                        roll_number_str = name_without_ext[6:]
                    
                    logger.info(f"Extracted roll number string: '{roll_number_str}' from '{filename}'")
                    
                    # Tier 1: Exact string match
                    student = roll_to_student.get(roll_number_str)
                    
                    # Tier 2: Case-insensitive & digit matching
                    if not student:
                        for s in students:
                            s_roll = str(s.roll_number)
                            if s_roll.lower() == roll_number_str.lower():
                                student = s
                                break
                            # Match numeric roll number against roll_number digits (e.g. "1" matches "CS2026001" or "CS2026045")
                            import re
                            s_digits = re.sub(r'\D', '', s_roll)
                            q_digits = re.sub(r'\D', '', roll_number_str)
                            if q_digits and s_digits and (s_digits == q_digits or s_digits.endswith(q_digits)):
                                student = s
                                break

                    # Tier 3: Index-based fallback if numeric roll number matches order in class
                    if not student and roll_number_str.isdigit():
                        idx = int(roll_number_str) - 1
                        if 0 <= idx < len(students):
                            student = students[idx]
                            logger.info(f"Index fallback matched file '{filename}' (roll {roll_number_str}) to student index {idx} ({student.roll_number})")
                    
                    # Fallback for remaining unmatched: assign to any available unassigned student in class
                    if not student:
                        assigned_ids = set(matched_students.keys())
                        unassigned = [s for s in students if s.id not in assigned_ids]
                        if unassigned:
                            student = unassigned[0]
                            logger.info(f"Unassigned fallback matched file '{filename}' to student {student.roll_number}")

                    if student:
                        # Extract file for this student with absolute path
                        extracted_content = zf.read(file_info.filename)
                        student_file_path = os.path.join(uploads_dir, f"exam_{exam_id}_student_{student.roll_number}_{filename}")
                        
                        with open(student_file_path, "wb") as f:
                            f.write(extracted_content)
                        
                        matched_students[student.id] = student_file_path
                        logger.info(f"✓ Extracted '{filename}' for student {student.roll_number} -> {student_file_path}")
                    else:
                        logger.warning(f"✗ No student found with roll number: {roll_number_str}")
                        unmatched_files.append(roll_number_str)
                
                logger.info(f"Matched {len(matched_students)} files out of {len(zip_file_list)} items. Unmatched: {unmatched_files}")
            
            # ZIP file is now closed - safe to delete
            # Update exam with question paper path if found
            if question_paper_path:
                exam.question_paper_url = question_paper_path
                logger.info(f"Updated exam {exam_id} with question paper: {question_paper_path}")
            
            # Create AnswerSheet records for matched students
            created_sheets = 0
            for student in students:
                student_file_path = matched_students.get(student.id)
                
                if not student_file_path:
                    logger.warning(f"No answer sheet found in ZIP for student {student.roll_number}")
                    continue
                
                # Create or update AnswerSheet record
                sheet = db.query(AnswerSheet).filter(
                    AnswerSheet.exam_id == exam_id,
                    AnswerSheet.student_id == student.id
                ).first()
                
                if not sheet:
                    sheet = AnswerSheet(
                        exam_id=exam_id,
                        student_id=student.id,
                        scanned_file_url=student_file_path,
                        status="evaluating"
                    )
                    db.add(sheet)
                    db.flush()
                else:
                    sheet.status = "evaluating"
                    sheet.scanned_file_url = student_file_path
                    db.flush()
                
                # Trigger background evaluation task
                background_tasks.add_task(
                    process_evaluation_task,
                    exam_id=exam_id,
                    answer_sheet_id=sheet.id,
                    student_id=student.id,
                    file_path=student_file_path
                )
                sheets_triggered.append(sheet.id)
                created_sheets += 1
            
            db.commit()
            
            # Clean up temp ZIP file with retry logic (now that it's closed)
            safe_delete_file(temp_file_path)
            
            matched_count = len(matched_students)
            unmatched_count = len(students) - matched_count
            
            if matched_count == 0:
                error_msg = f"No files in ZIP matched student roll numbers. Students in class: {list(roll_to_student.keys())}. Files in ZIP: {unmatched_files}"
                logger.error(error_msg)
                raise HTTPException(status_code=400, detail=f"No matching files found in ZIP. Expected files named after roll numbers: {list(roll_to_student.keys())}")
            
            return {
                "message": f"ZIP extracted successfully. Found question paper: {bool(question_paper_path)}. Evaluation processing started for {matched_count} students.",
                "answer_sheets": sheets_triggered,
                "matched_count": matched_count,
                "unmatched_count": unmatched_count,
                "question_paper_found": bool(question_paper_path)
            }
                
        except zipfile.BadZipFile as e:
            logger.error(f"Invalid ZIP file: {file.filename}. Error: {str(e)}")
            # Clean up temp file
            safe_delete_file(temp_file_path)
            raise HTTPException(status_code=400, detail=f"Invalid ZIP file format. Ensure the uploaded file is a valid ZIP archive.")
        except Exception as e:
            logger.error(f"Error processing ZIP file: {str(e)}", exc_info=True)
            # Clean up temp file
            safe_delete_file(temp_file_path)
            raise HTTPException(status_code=400, detail=f"Error processing ZIP file: {str(e)}")

    
    else:
        # Handle non-ZIP files - use single file for all students (backward compatibility)
        logger.info(f"Non-ZIP file detected: {file.filename}. Using single file for all students.")
        file_path = os.path.join(uploads_dir, f"exam_{exam_id}_{file.filename}")
        
        if os.path.exists(temp_file_path):
            shutil.move(temp_file_path, file_path)
        
        logger.info(f"Non-ZIP file moved to: {file_path}")
        
        # Create AnswerSheet records for all students using the same file
        for s in students:
            sheet = db.query(AnswerSheet).filter(
                AnswerSheet.exam_id == exam_id,
                AnswerSheet.student_id == s.id
            ).first()
            
            if not sheet:
                sheet = AnswerSheet(
                    exam_id=exam_id,
                    student_id=s.id,
                    scanned_file_url=file_path,
                    status="evaluating"
                )
                db.add(sheet)
                db.flush()
            else:
                sheet.status = "evaluating"
                sheet.scanned_file_url = file_path
                db.flush()
            
            background_tasks.add_task(
                process_evaluation_task,
                exam_id=exam_id,
                answer_sheet_id=sheet.id,
                student_id=s.id,
                file_path=file_path
            )
            sheets_triggered.append(sheet.id)
        
        db.commit()
        return {
            "message": "Upload successful. Evaluation processing started in background.",
            "answer_sheets": sheets_triggered
        }

# --- RE-EVALUATE STUCK SHEETS ---
@router.post("/exams/{exam_id}/re-evaluate", dependencies=[faculty_only])
def re_evaluate_stuck_sheets(
    exam_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Retry evaluation for all answer sheets of an exam that are stuck in 'evaluating' status.
    Useful when background tasks failed silently.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Find sheets that are still in 'evaluating' or 'pending' status
    stuck_sheets = db.query(AnswerSheet).filter(
        AnswerSheet.exam_id == exam_id,
        AnswerSheet.status.in_(["evaluating", "pending"])
    ).all()

    if not stuck_sheets:
        return {"message": "No sheets are stuck. All sheets are already evaluated or reviewed.", "re_triggered": []}

    re_triggered = []
    for sheet in stuck_sheets:
        background_tasks.add_task(
            process_evaluation_task,
            exam_id=exam_id,
            answer_sheet_id=sheet.id,
            student_id=sheet.student_id,
            file_path=sheet.scanned_file_url
        )
        re_triggered.append(sheet.id)

    return {
        "message": f"Re-evaluation triggered for {len(re_triggered)} stuck sheet(s).",
        "re_triggered": re_triggered
    }

@router.get("/exams/{exam_id}/evaluation-status", dependencies=[faculty_only])
def get_evaluation_status(exam_id: int, db: Session = Depends(get_db)):
    """Get a real-time summary of evaluation progress for an exam."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    sheets = db.query(AnswerSheet).filter(AnswerSheet.exam_id == exam_id).all()
    status_counts: Dict[str, int] = {}
    for s in sheets:
        key = s.status or "unknown"
        status_counts[key] = status_counts.get(key, 0) + 1

    return {
        "exam_id": exam_id,
        "exam_status": exam.status,
        "total_sheets": len(sheets),
        "status_breakdown": status_counts,
        "all_done": all(s.status in ("evaluated", "reviewed") for s in sheets) if sheets else False
    }


# --- EVALUATION AND RESULTS ---
@router.get("/exams/{exam_id}/answer-sheets", response_model=List[AnswerSheetResponse], dependencies=[faculty_only])
def get_exam_answer_sheets(exam_id: int, db: Session = Depends(get_db)):
    sheets = db.query(AnswerSheet).filter(AnswerSheet.exam_id == exam_id).all()
    enriched = []
    for s in sheets:
        enriched.append({
            "id": s.id,
            "exam_id": s.exam_id,
            "student_id": s.student_id,
            "scanned_file_url": s.scanned_file_url,
            "total_marks": s.total_marks,
            "grade": s.grade,
            "status": s.status,
            "reviewer_remarks": s.reviewer_remarks,
            "created_at": s.created_at,
            "student_roll": s.student.roll_number if s.student else "N/A",
            "student_name": s.student.user.name if s.student and s.student.user else "Unknown"
        })
    return enriched

@router.get("/answer-sheets/{sheet_id}/evaluation", dependencies=[faculty_only])
def get_detailed_evaluation(sheet_id: int, db: Session = Depends(get_db)):
    sheet = db.query(AnswerSheet).filter(AnswerSheet.id == sheet_id).first()
    if not sheet:
        raise HTTPException(status_code=404, detail="Answer sheet not found")
        
    ocr = db.query(OCRTranscript).filter(OCRTranscript.answer_sheet_id == sheet_id).first()
    results = db.query(EvaluationResult).filter(EvaluationResult.answer_sheet_id == sheet_id).all()
    
    return {
        "sheet": {
            "id": sheet.id,
            "total_marks": sheet.total_marks,
            "grade": sheet.grade,
            "status": sheet.status,
            "reviewer_remarks": sheet.reviewer_remarks,
            "student_name": sheet.student.user.name if sheet.student else "Student"
        },
        "ocr": {
            "raw_text": ocr.raw_text if ocr else "",
            "structured": ocr.structured_transcript_json if ocr else {}
        },
        "results": [
            {
                "id": r.id,
                "question_number": r.question_number,
                "max_marks": r.max_marks,
                "marks_obtained": r.marks_obtained,
                "feedback": r.feedback,
                "confidence_score": r.confidence_score,
                "status": r.status
            } for r in results
        ]
    }

@router.put("/evaluation/{result_id}/override", dependencies=[faculty_only])
def override_marks(result_id: int, override: EvaluationOverride, db: Session = Depends(get_db)):
    res = db.query(EvaluationResult).filter(EvaluationResult.id == result_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Evaluation question result not found")
        
    res.marks_obtained = override.marks_obtained
    res.feedback = override.feedback
    res.status = "edited"
    db.commit()
    
    # Recalculate total marks on answer sheet
    sheet = db.query(AnswerSheet).filter(AnswerSheet.id == res.answer_sheet_id).first()
    if sheet:
        results = db.query(EvaluationResult).filter(EvaluationResult.answer_sheet_id == sheet.id).all()
        new_total = sum([r.marks_obtained for r in results])
        sheet.total_marks = new_total
        # Recalculate grade based on 20 max marks
        pct = (new_total / 20.0) * 100.0
        if pct >= 85: sheet.grade = "A+"
        elif pct >= 75: sheet.grade = "A"
        elif pct >= 60: sheet.grade = "B"
        elif pct >= 40: sheet.grade = "C"
        else: sheet.grade = "F"
        db.commit()
        
    return {"message": "Marks successfully overridden"}

@router.put("/answer-sheets/{sheet_id}/approve", dependencies=[faculty_only])
def approve_answer_sheet(sheet_id: int, remarks: Dict[str, str], db: Session = Depends(get_db)):
    sheet = db.query(AnswerSheet).filter(AnswerSheet.id == sheet_id).first()
    if not sheet:
        raise HTTPException(status_code=404, detail="Answer sheet not found")
        
    sheet.status = "reviewed"
    sheet.reviewer_remarks = remarks.get("remarks", "Approved by Faculty")
    db.commit()
    return {"message": "Answer sheet marked as reviewed"}

@router.put("/exams/{exam_id}/publish", dependencies=[faculty_only])
def publish_results(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    exam.status = "completed"
    db.commit()
    return {"message": "Exam results successfully published to students"}

# --- ANALYTICS ---
@router.get("/exams/{exam_id}/analytics", dependencies=[faculty_only])
def get_exam_analytics(exam_id: int, db: Session = Depends(get_db)):
    sheets = db.query(AnswerSheet).filter(AnswerSheet.exam_id == exam_id, AnswerSheet.status != "evaluating").all()
    if not sheets:
        return {"average": 0, "highest": 0, "lowest": 0, "pass_rate": 0, "grades": {}, "top_performers": []}
        
    scores = [s.total_marks for s in sheets]
    avg = sum(scores) / len(scores)
    highest = max(scores)
    lowest = min(scores)
    
    # Passing marks defaults to 40% (8 marks out of 20)
    passed = len([s for s in sheets if s.total_marks >= 8])
    pass_rate = (passed / len(sheets)) * 100
    
    grades = {}
    for s in sheets:
        g = s.grade or "F"
        grades[g] = grades.get(g, 0) + 1
        
    # Top Performers
    top_performers = sorted(sheets, key=lambda s: s.total_marks, reverse=True)[:5]
    top_list = [{
        "student_name": t.student.user.name,
        "roll_number": t.student.roll_number,
        "total_marks": t.total_marks,
        "grade": t.grade
    } for t in top_performers]
    
    # Question wise average performance
    # Question 1 & Question 2 averages
    q1_scores = db.query(EvaluationResult.marks_obtained).join(AnswerSheet).filter(AnswerSheet.exam_id == exam_id, EvaluationResult.question_number == "1").all()
    q2_scores = db.query(EvaluationResult.marks_obtained).join(AnswerSheet).filter(AnswerSheet.exam_id == exam_id, EvaluationResult.question_number == "2").all()
    
    q1_avg = sum([s[0] for s in q1_scores]) / len(q1_scores) if q1_scores else 0
    q2_avg = sum([s[0] for s in q2_scores]) / len(q2_scores) if q2_scores else 0
    
    return {
        "average": round(avg, 2),
        "highest": round(highest, 2),
        "lowest": round(lowest, 2),
        "pass_rate": round(pass_rate, 2),
        "grades": grades,
        "top_performers": top_list,
        "question_performance": [
            {"question": "Q1 (Polymorphism)", "average_score": round(q1_avg, 2), "max": 10},
            {"question": "Q2 (Binary Search)", "average_score": round(q2_avg, 2), "max": 10}
        ]
    }

# --- COMPLAINTS ---
@router.get("/complaints", response_model=List[ComplaintResponse], dependencies=[faculty_only])
def list_faculty_complaints(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fac = get_faculty_profile(current_user, db)
    assigned_subject_ids = [a.subject_id for a in fac.assignments]
    if not assigned_subject_ids:
        return []
        
    complaints = db.query(Complaint).join(AnswerSheet).filter(
        AnswerSheet.exam_id.in_(
            db.query(Exam.id).filter(Exam.subject_id.in_(assigned_subject_ids))
        )
    ).all()
    
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
            "student_name": c.student.user.name if c.student else "Student",
            "exam_title": c.answer_sheet.exam.title if c.answer_sheet and c.answer_sheet.exam else "Exam"
        })
    return res

@router.put("/complaints/{id}", dependencies=[faculty_only])
def resolve_complaint(id: int, update: ComplaintUpdate, db: Session = Depends(get_db)):
    comp = db.query(Complaint).filter(Complaint.id == id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    comp.status = update.status
    comp.resolution_remarks = update.resolution_remarks
    import datetime
    comp.resolved_at = datetime.datetime.utcnow()
    
    # If the faculty decided to reject or accept, update state.
    # In a full system, status = "re-evaluate" triggers re-evaluation pipeline.
    db.commit()
    return {"message": "Complaint status updated successfully"}
