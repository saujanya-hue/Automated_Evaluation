from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from evaluation_app.database.session import get_db
from evaluation_app.models.models import (
    User, Department, Subject, Class, Faculty, Student, FacultyAssignment, Exam
)
from evaluation_app.schemas.schemas import (
    DepartmentCreate, DepartmentResponse,
    SubjectCreate, SubjectResponse,
    ClassCreate, ClassResponse,
    FacultyCreate, FacultyResponse,
    StudentCreate, StudentResponse,
    FacultyAssignmentCreate, FacultyAssignmentResponse
)
from evaluation_app.api.dependencies import RoleChecker
from evaluation_app.core.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin Portal"])
admin_only = Depends(RoleChecker(["admin"]))

# --- STATISTICS ---
@router.get("/stats", dependencies=[admin_only])
def get_admin_stats(db: Session = Depends(get_db)):
    return {
        "departments_count": db.query(Department).count(),
        "subjects_count": db.query(Subject).count(),
        "classes_count": db.query(Class).count(),
        "faculty_count": db.query(Faculty).count(),
        "students_count": db.query(Student).count(),
        "exams_count": db.query(Exam).count()
    }

# --- DEPARTMENTS CRUD ---
@router.get("/departments", response_model=List[DepartmentResponse], dependencies=[admin_only])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.post("/departments", response_model=DepartmentResponse, dependencies=[admin_only])
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.code == dept.code).first()
    if db_dept:
        raise HTTPException(status_code=400, detail="Department code already exists")
    new_dept = Department(name=dept.name, code=dept.code)
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@router.delete("/departments/{id}", dependencies=[admin_only])
def delete_department(id: int, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.id == id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(db_dept)
    db.commit()
    return {"message": "Department deleted successfully"}

# --- SUBJECTS CRUD ---
@router.get("/subjects", response_model=List[SubjectResponse], dependencies=[admin_only])
def list_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()

@router.post("/subjects", response_model=SubjectResponse, dependencies=[admin_only])
def create_subject(sub: SubjectCreate, db: Session = Depends(get_db)):
    db_sub = db.query(Subject).filter(Subject.code == sub.code).first()
    if db_sub:
        raise HTTPException(status_code=400, detail="Subject code already exists")
    new_sub = Subject(name=sub.name, code=sub.code, department_id=sub.department_id)
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.delete("/subjects/{id}", dependencies=[admin_only])
def delete_subject(id: int, db: Session = Depends(get_db)):
    db_sub = db.query(Subject).filter(Subject.id == id).first()
    if not db_sub:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(db_sub)
    db.commit()
    return {"message": "Subject deleted successfully"}

# --- CLASSES CRUD ---
@router.get("/classes", response_model=List[ClassResponse], dependencies=[admin_only])
def list_classes(db: Session = Depends(get_db)):
    return db.query(Class).all()

@router.post("/classes", response_model=ClassResponse, dependencies=[admin_only])
def create_class(cls: ClassCreate, db: Session = Depends(get_db)):
    new_class = Class(name=cls.name, department_id=cls.department_id, batch_year=cls.batch_year)
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class

@router.delete("/classes/{id}", dependencies=[admin_only])
def delete_class(id: int, db: Session = Depends(get_db)):
    db_class = db.query(Class).filter(Class.id == id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(db_class)
    db.commit()
    return {"message": "Class deleted successfully"}

# --- FACULTY CRUD ---
@router.get("/faculty", response_model=List[FacultyResponse], dependencies=[admin_only])
def list_faculty(db: Session = Depends(get_db)):
    return db.query(Faculty).all()

@router.post("/faculty", response_model=FacultyResponse, dependencies=[admin_only])
def create_faculty(fac: FacultyCreate, db: Session = Depends(get_db)):
    # 1. Create User
    existing_user = db.query(User).filter(User.email == fac.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    db_user = User(
        email=fac.email,
        hashed_password=get_password_hash(fac.password),
        name=fac.name,
        role="faculty"
    )
    db.add(db_user)
    db.flush()  # Get user.id
    
    # 2. Create Faculty
    existing_fac = db.query(Faculty).filter(Faculty.employee_id == fac.employee_id).first()
    if existing_fac:
        db.rollback()
        raise HTTPException(status_code=400, detail="Employee ID already exists")
        
    db_fac = Faculty(
        user_id=db_user.id,
        employee_id=fac.employee_id,
        department_id=fac.department_id,
        designation=fac.designation
    )
    db.add(db_fac)
    db.commit()
    db.refresh(db_fac)
    return db_fac

@router.delete("/faculty/{id}", dependencies=[admin_only])
def delete_faculty(id: int, db: Session = Depends(get_db)):
    db_fac = db.query(Faculty).filter(Faculty.id == id).first()
    if not db_fac:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    
    # Delete associated User (cascades)
    db_user = db.query(User).filter(User.id == db_fac.user_id).first()
    if db_user:
        db.delete(db_user)
    db.delete(db_fac)
    db.commit()
    return {"message": "Faculty member deleted successfully"}

# --- STUDENTS CRUD ---
@router.get("/students", response_model=List[StudentResponse], dependencies=[admin_only])
def list_students(db: Session = Depends(get_db)):
    return db.query(Student).all()

@router.post("/students", response_model=StudentResponse, dependencies=[admin_only])
def create_student(stud: StudentCreate, db: Session = Depends(get_db)):
    # 1. Create User
    existing_user = db.query(User).filter(User.email == stud.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    db_user = User(
        email=stud.email,
        hashed_password=get_password_hash(stud.password),
        name=stud.name,
        role="student"
    )
    db.add(db_user)
    db.flush()
    
    # 2. Create Student
    existing_stud = db.query(Student).filter(Student.roll_number == stud.roll_number).first()
    if existing_stud:
        db.rollback()
        raise HTTPException(status_code=400, detail="Roll number already exists")
        
    db_stud = Student(
        user_id=db_user.id,
        roll_number=stud.roll_number,
        department_id=stud.department_id,
        class_id=stud.class_id
    )
    db.add(db_stud)
    db.commit()
    db.refresh(db_stud)
    return db_stud

@router.delete("/students/{id}", dependencies=[admin_only])
def delete_student(id: int, db: Session = Depends(get_db)):
    db_stud = db.query(Student).filter(Student.id == id).first()
    if not db_stud:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db_user = db.query(User).filter(User.id == db_stud.user_id).first()
    if db_user:
        db.delete(db_user)
    db.delete(db_stud)
    db.commit()
    return {"message": "Student deleted successfully"}

# --- FACULTY ASSIGNMENTS CRUD ---
@router.get("/faculty-assignments", response_model=List[FacultyAssignmentResponse], dependencies=[admin_only])
def list_faculty_assignments(db: Session = Depends(get_db)):
    assignments = db.query(FacultyAssignment).all()
    # Enrich response with custom formatting
    response = []
    for a in assignments:
        response.append({
            "id": a.id,
            "faculty_id": a.faculty_id,
            "subject_id": a.subject_id,
            "class_id": a.class_id,
            "created_at": a.created_at,
            "faculty": {
                "name": a.faculty.user.name if a.faculty else "Unknown",
                "employee_id": a.faculty.employee_id if a.faculty else "N/A"
            },
            "subject": {
                "name": a.subject.name if a.subject else "Unknown",
                "code": a.subject.code if a.subject else "N/A"
            },
            "student_class": {
                "name": a.student_class.name if a.student_class else "Unknown"
            }
        })
    return response

@router.post("/faculty-assignments", response_model=FacultyAssignmentResponse, dependencies=[admin_only])
def create_faculty_assignment(assign: FacultyAssignmentCreate, db: Session = Depends(get_db)):
    new_assign = FacultyAssignment(
        faculty_id=assign.faculty_id,
        subject_id=assign.subject_id,
        class_id=assign.class_id
    )
    db.add(new_assign)
    db.commit()
    db.refresh(new_assign)
    return new_assign

@router.delete("/faculty-assignments/{id}", dependencies=[admin_only])
def delete_faculty_assignment(id: int, db: Session = Depends(get_db)):
    db_assign = db.query(FacultyAssignment).filter(FacultyAssignment.id == id).first()
    if not db_assign:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(db_assign)
    db.commit()
    return {"message": "Faculty assignment deleted successfully"}
