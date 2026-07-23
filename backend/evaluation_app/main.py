import os
from dotenv import load_dotenv

# Load .env explicitly so env vars are available even when uvicorn reloads workers
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_BASE_DIR, ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from evaluation_app.database.session import engine, Base, SessionLocal
from evaluation_app.api import auth, admin_api, faculty_api, student_api
from evaluation_app.models.models import (
    User, Department, Subject, Class, Faculty, Student, FacultyAssignment, Exam, AnswerSheet, OCRTranscript, EvaluationResult, Complaint
)
from evaluation_app.core.security import get_password_hash

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Answer Script Evaluation API",
    description="Backend service matching university evaluation workflows with LangGraph agents and Ollama (gpt-oss:120b-cloud).",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    db: Session = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("Database is empty. Auto-seeding default demo data...")
            seed_database()
    except Exception as e:
        print(f"Auto-seeding during startup failed: {e}")
    finally:
        db.close()

# CORS configuration for React integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix="/api")
app.include_router(admin_api.router, prefix="/api")
app.include_router(faculty_api.router, prefix="/api")
app.include_router(student_api.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Automated Answer Script Evaluation Platform",
        "engine": "Ollama (gpt-oss:120b-cloud)",
        "version": "1.0.0"
    }

# --- SEED DATA LOADER ---
@app.post("/api/seed")
def seed_database():
    db: Session = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).count() > 0:
            return {"message": "Database already seeded or populated."}

        # 1. Create Default Users
        admin_pw = get_password_hash("admin123")
        fac_pw = get_password_hash("faculty123")
        stud_pw = get_password_hash("student123")

        admin_user = User(email="admin@university.edu", hashed_password=admin_pw, name="Dr. Sarah Jenkins", role="admin")
        faculty_user = User(email="faculty@university.edu", hashed_password=fac_pw, name="Prof. Alan Turing", role="faculty")
        student_user = User(email="student@university.edu", hashed_password=stud_pw, name="John Doe", role="student")
        student_user_2 = User(email="student2@university.edu", hashed_password=stud_pw, name="Alice Smith", role="student")
        student_user_3 = User(email="student3@university.edu", hashed_password=stud_pw, name="Bob Jones", role="student")
        
        db.add_all([admin_user, faculty_user, student_user, student_user_2, student_user_3])
        db.flush()

        # 2. Create Departments
        cse_dept = Department(name="Computer Science & Engineering", code="CSE")
        ece_dept = Department(name="Electronics & Communication Engineering", code="ECE")
        db.add_all([cse_dept, ece_dept])
        db.flush()

        # 3. Create Classes
        cse_class = Class(name="CSE-Batch-2026", department_id=cse_dept.id, batch_year=2026)
        ece_class = Class(name="ECE-Batch-2026", department_id=ece_dept.id, batch_year=2026)
        db.add_all([cse_class, ece_class])
        db.flush()

        # 4. Create Subjects
        oop_sub = Subject(name="Object Oriented Programming", code="CS302", department_id=cse_dept.id)
        dsa_sub = Subject(name="Data Structures & Algorithms", code="CS301", department_id=cse_dept.id)
        db.add_all([oop_sub, dsa_sub])
        db.flush()

        # 5. Create Profiles (Faculty, Students for roll numbers 1, 2, 3, CS2026045)
        fac_profile = Faculty(user_id=faculty_user.id, employee_id="EMP1024", department_id=cse_dept.id, designation="Associate Professor")
        stud_profile = Student(user_id=student_user.id, roll_number="CS2026045", department_id=cse_dept.id, class_id=cse_class.id)
        stud_profile_2 = Student(user_id=student_user_2.id, roll_number="1", department_id=cse_dept.id, class_id=cse_class.id)
        stud_profile_3 = Student(user_id=student_user_3.id, roll_number="2", department_id=cse_dept.id, class_id=cse_class.id)
        
        db.add_all([fac_profile, stud_profile, stud_profile_2, stud_profile_3])
        db.flush()

        # 6. Assign Faculty to Course
        assignment = FacultyAssignment(faculty_id=fac_profile.id, subject_id=oop_sub.id, class_id=cse_class.id)
        db.add(assignment)
        db.flush()

        # 7. Create an Exam
        exam = Exam(
            title="OOP Midterm Examination",
            subject_id=oop_sub.id,
            class_id=cse_class.id,
            max_marks=20,
            passing_marks=8,
            status="completed"  # Start with completed so student can inspect right away
        )
        db.add(exam)
        db.flush()

        # 8. Add Student Answer Sheet with OCR & AI evaluation records pre-built
        sheet = AnswerSheet(
            exam_id=exam.id,
            student_id=stud_profile.id,
            scanned_file_url="./uploads/exams/exam_1_sample.pdf",
            total_marks=12.5,
            grade="B",
            status="reviewed",
            reviewer_remarks="AI grading matches student script. Corrected O(n log n) misunderstanding."
        )
        db.add(sheet)
        db.flush()

        # 9. OCR Transcript
        ocr = OCRTranscript(
            answer_sheet_id=sheet.id,
            raw_text=(
                "Q1: Explain polymorphism in Object Oriented Programming with a simple code snippet.\n"
                "Student Answer: Polymorphism means many forms. It is when a child class inherits from a parent class but changes how a method works (method overriding). "
                "For example: animal.makeSound() does different things for dog and cat. It helps make code reusable. Code:\n"
                "class Animal { void sound() { print('sound'); } }\n"
                "class Dog extends Animal { void sound() { print('bark'); } }\n\n"
                "Q2: What is the time complexity of binary search? Explain with justification.\n"
                "Student Answer: The time complexity is O(n log n) because we sort the list first, and then we search. In search, we split the list, which takes O(log n), but since sorting is O(n log n), overall search time is O(n log n)."
            ),
            structured_transcript_json={
                "exam_id": exam.id,
                "student_id": stud_profile.id,
                "transcript_sections": [
                    {
                        "question_number": "1",
                        "question_prompt": "Explain polymorphism in Object Oriented Programming with a simple code snippet.",
                        "student_answer": (
                            "Polymorphism means many forms. It is when a child class inherits from a parent class but changes how a method works (method overriding). "
                            "For example: animal.makeSound() does different things for dog and cat. It helps make code reusable. Code:\n"
                            "class Animal { void sound() { print('sound'); } }\n"
                            "class Dog extends Animal { void sound() { print('bark'); } }"
                        )
                    },
                    {
                        "question_number": "2",
                        "question_prompt": "What is the time complexity of binary search? Explain with justification.",
                        "student_answer": (
                            "The time complexity is O(n log n) because we sort the list first, and then we search. In search, we split the list, which takes O(log n), but since sorting is O(n log n), overall search time is O(n log n)."
                        )
                    }
                ]
            }
        )
        db.add(ocr)

        # 10. Question wise results
        q1_res = EvaluationResult(
            answer_sheet_id=sheet.id,
            question_number="1",
            max_marks=10,
            marks_obtained=8.5,
            feedback="Excellent explanation of method overriding. The concept of inheritance mapping is clear. Code snippet is valid.",
            confidence_score=0.96,
            status="ai_graded"
        )
        q2_res = EvaluationResult(
            answer_sheet_id=sheet.id,
            question_number="2",
            max_marks=10,
            marks_obtained=4.0,
            feedback="Incorrect. Binary search is O(log n). Pre-sorting does not change the complexity bounds of the search query itself.",
            confidence_score=0.90,
            status="ai_graded"
        )
        db.add_all([q1_res, q2_res])
        db.flush()

        # 11. Add a sample complaint
        complaint = Complaint(
            answer_sheet_id=sheet.id,
            student_id=stud_profile.id,
            category="marking_error",
            description="I believe my answer to Q2 is partially correct as sorting is needed before binary search, so points should be given for sorting rationale.",
            status="raised"
        )
        db.add(complaint)
        
        db.commit()
        return {"message": "Database seeded successfully. You can log in with: admin@university.edu (PW: admin123), faculty@university.edu (PW: faculty123), student@university.edu (PW: student123)."}
    except Exception as e:
        db.rollback()
        return {"error": f"Seeding failed: {str(e)}"}
    finally:
        db.close()
