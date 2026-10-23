import sys
import os
import requests
import json
import time

# Ensure UTF-8 output encoding for Windows terminal
sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend directory is in python search path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, "backend"))

BASE_URL = "http://127.0.0.1:8002"

print("==================================================")
print("🚀 TESTING ANSWER SCRIPT EVALUATION WITH ZIP FILE")
print("==================================================")

# 1. Login as Faculty
print("\n🔐 1. Authenticating as Faculty...")
login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
    "email": "faculty@university.edu",
    "password": "faculty123"
})

if login_resp.status_code != 200:
    print(f"❌ Login failed: {login_resp.status_code} - {login_resp.text}")
    sys.exit(1)

token = login_resp.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}
print("✅ Authenticated successfully as Faculty.")

# 2. Get or create Exam for Class ID 1
print("\n📋 2. Fetching Faculty Exams...")
exams_resp = requests.get(f"{BASE_URL}/api/faculty/exams", headers=headers)
if exams_resp.status_code != 200:
    print(f"❌ Failed to get exams: {exams_resp.text}")
    sys.exit(1)

exams = exams_resp.json()
target_exam = None
for ex in exams:
    if ex.get("class_id") == 1:
        target_exam = ex
        break

if not target_exam and exams:
    target_exam = exams[0]

if not target_exam:
    print("Creating new draft exam...")
    create_resp = requests.post(f"{BASE_URL}/api/faculty/exams", headers=headers, json={
        "title": "ZIP Answer Script Evaluation Test",
        "subject_id": 1,
        "class_id": 1,
        "max_marks": 100,
        "passing_marks": 40
    })
    target_exam = create_resp.json()

exam_id = target_exam["id"]
print(f"✅ Selected Exam: '{target_exam['title']}' (ID: {exam_id}, Class ID: {target_exam.get('class_id')})")

# 3. Test Uploading ZIP File 1: test_exam.zip
zip_path_1 = os.path.abspath("uploads/exams/test_exam.zip")
print(f"\n📤 3. Uploading ZIP file: {zip_path_1}...")

if not os.path.exists(zip_path_1):
    print(f"❌ Zip file not found at {zip_path_1}")
    sys.exit(1)

with open(zip_path_1, "rb") as f:
    upload_resp_1 = requests.post(
        f"{BASE_URL}/api/faculty/exams/{exam_id}/upload-answer-sheets",
        headers=headers,
        files={"file": f}
    )

print(f"Upload Response Status: {upload_resp_1.status_code}")
print(f"Upload Output: {json.dumps(upload_resp_1.json(), indent=2)}")

# 4. Test Uploading ZIP File 2: exam_2_answers_scripts.zip
zip_path_2 = os.path.abspath("backend/uploads/exams/exam_2_answers_scripts.zip")
if os.path.exists(zip_path_2):
    print(f"\n📤 4. Uploading secondary ZIP file: {zip_path_2}...")
    with open(zip_path_2, "rb") as f:
        upload_resp_2 = requests.post(
            f"{BASE_URL}/api/faculty/exams/{exam_id}/upload-answer-sheets",
            headers=headers,
            files={"file": f}
        )
    print(f"Upload Output 2: {json.dumps(upload_resp_2.json(), indent=2)}")

# 5. Wait for Background Evaluation Tasks to Complete
print("\n⏳ 5. Waiting for AI Evaluation agent pipeline to complete (10s)...")
time.sleep(10)

# 6. Fetch Evaluation Results from DB
from evaluation_app.database.session import SessionLocal
from evaluation_app.models.models import AnswerSheet, EvaluationResult, OCRTranscript, Student, User

db = SessionLocal()
sheets = db.query(AnswerSheet).filter(AnswerSheet.exam_id == exam_id).all()

print(f"\n==================================================")
print(f"📊 EVALUATION RESULTS FOR EXAM #{exam_id} ({len(sheets)} Answer Sheets)")
print(f"==================================================")

for sheet in sheets:
    student = db.query(Student).filter(Student.id == sheet.student_id).first()
    student_name = student.user.name if (student and student.user) else "Unknown"
    roll_no = student.roll_number if student else "N/A"
    
    ocr = db.query(OCRTranscript).filter(OCRTranscript.answer_sheet_id == sheet.id).first()
    eval_res = db.query(EvaluationResult).filter(EvaluationResult.answer_sheet_id == sheet.id).first()
    
    print(f"\n──────────────────────────────────────────────────")
    print(f"📄 Answer Sheet #{sheet.id}")
    print(f"   👤 Student Name  : {student_name}")
    print(f"   🆔 Roll Number   : {roll_no}")
    print(f"   📁 File Path     : {sheet.scanned_file_url}")
    print(f"   📌 Status        : {sheet.status}")
    
    if ocr:
        preview = (ocr.raw_text[:200] + '...') if (ocr.raw_text and len(ocr.raw_text) > 200) else (ocr.raw_text or "")
        print(f"\n   📝 OCR Extracted Text Preview:")
        print(f"      {repr(preview)}")
        if ocr.structured_transcript_json:
            print(f"      Structured Transcript JSON: {json.dumps(ocr.structured_transcript_json)[:150]}...")
    
    eval_results = db.query(EvaluationResult).filter(EvaluationResult.answer_sheet_id == sheet.id).all()
    if eval_results:
        print(f"\n   🎯 Evaluation Summary:")
        print(f"      Total Marks Score : {sheet.total_marks} / 100")
        print(f"      Grade             : {sheet.grade}")
        print(f"      Question Breakdown:")
        for res in eval_results:
            print(f"        • Question {res.question_number}: {res.marks_obtained}/{res.max_marks} marks (Confidence: {res.confidence_score * 100:.0f}%)")
            print(f"          Feedback: {res.feedback}")
    else:
        print(f"\n   🎯 Summary:")
        print(f"      Total Marks Score : {sheet.total_marks}")
        print(f"      Grade             : {sheet.grade}")

print("\n==================================================")
print("✅ EVALUATION TEST COMPLETE!")
print("==================================================")
