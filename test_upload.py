#!/usr/bin/env python
import requests
import json
import time

# 1. Login
print("🔐 Logging in...")
login_resp = requests.post('http://localhost:8002/api/auth/login', json={
    'email': 'faculty@university.edu',
    'password': 'faculty123'
})

if login_resp.status_code != 200:
    print('❌ Login failed:', login_resp.text)
    exit(1)

token = login_resp.json()['access_token']
print('✅ Logged in')

# 2. Get exams
print("📋 Fetching exams...")
headers = {'Authorization': f'Bearer {token}'}
exams_resp = requests.get('http://localhost:8002/api/faculty/exams', headers=headers)

if exams_resp.status_code != 200:
    print('❌ Get exams failed:', exams_resp.text)
    exit(1)

exams = exams_resp.json()
if not exams:
    print('❌ No exams found')
    exit(1)

# Find first draft exam
exam_id = None
for exam in exams:
    if exam.get('status') == 'draft':
        exam_id = exam['id']
        print(f"✅ Found draft exam: {exam['title']} (ID: {exam_id})")
        break

if not exam_id:
    exam_id = exams[0]['id']
    print(f"⚠️  No draft exams. Using exam: {exams[0]['title']} (ID: {exam_id})")

# 3. Upload ZIP
print("📤 Uploading ZIP file...")
with open('uploads/exams/test_exam.zip', 'rb') as f:
    files = {'file': f}
    upload_resp = requests.post(f'http://localhost:8002/api/faculty/exams/{exam_id}/upload-answer-sheets', headers=headers, files=files)

if upload_resp.status_code == 200:
    result = upload_resp.json()
    print('✅ Upload successful!')
    print(f'  - Matched: {result.get("matched_count", 0)} files')
    print(f'  - Unmatched: {result.get("unmatched_count", 0)} files')
    print(f'  - Question paper found: {result.get("question_paper_found", False)}')
    print(f'  - Message: {result.get("message", "")}')
    
    # 4. Check evaluation status after delay
    print("\n⏳ Waiting 5s for evaluation to start...")
    time.sleep(5)
    
    print("📊 Checking evaluation progress...")
    exams_resp = requests.get('http://localhost:8002/api/faculty/exams', headers=headers)
    exams = exams_resp.json()
    for exam in exams:
        if exam['id'] == exam_id:
            print(f"  - Exam status: {exam['status']}")
            break
else:
    print(f'❌ Upload failed ({upload_resp.status_code})')
    print(f'Response: {upload_resp.text}')
