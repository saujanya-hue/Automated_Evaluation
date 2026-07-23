# ZIP Upload Format Guide

## Overview
When uploading answer sheets for evaluation, create a ZIP file containing:
1. **Student answer sheets** - Named by their roll number (1, 2, 3, etc.)
2. **Question paper** - The exam questions/answer key for reference during evaluation

## ZIP File Requirements

### File Structure
```
exam_answers.zip
├── questions.pdf              (or answer_key.pdf, exam_questions.pdf)
├── 1.pdf
├── 2.jpg
├── 3.png
├── 4.pdf
└── ...
```

### Naming Convention

#### Answer Sheet Files
- **File names must match student roll numbers** (without the file extension)
- Simple numeric roll numbers: 1, 2, 3, 4, 5, etc.
- Supported formats: `.pdf`, `.jpg`, `.jpeg`, `.png`
- Examples:
  - `1.pdf` → Student with roll number 1
  - `2.jpg` → Student with roll number 2
  - `3.png` → Student with roll number 3

#### Question Paper
The system looks for the question paper with these common filenames:
- `questions.pdf`, `questions.jpg`, `questions.png`
- `question_paper.pdf`, `question_paper.jpg`, `question_paper.png`
- `answer_key.pdf`, `answer_key.jpg`, `answer_key.png`
- `exam_questions.pdf`, `exam_questions.jpg`, `exam_questions.png`
- `questionpaper.pdf`, `questionpaper.jpg`, `questionpaper.png`

**Recommended**: Use `questions.pdf` for clarity

### Important Notes
1. **Roll number matching is exact** - Filename (without extension) must exactly match the student's roll number
2. **Question paper is optional** - If not provided, the system will use OCR alone
3. **Files without matching students will be skipped** - The system logs warnings for unmatched files
4. **At least one file must match** - If no student files match, the upload will fail
5. **Directory structure inside ZIP is ignored** - Only the filename is used for matching
6. **Hidden files and directories are skipped** - Files starting with `.` are ignored

## Upload Process

1. **Navigate to Faculty Portal** → Upload Sheets
2. **Select Exam** - Choose the exam for which you want to upload answer sheets
3. **Select ZIP File** - Choose your prepared ZIP file
4. **Submit** - The system will:
   - Extract files from the ZIP
   - Match files to students by roll number
   - Extract and store the question paper
   - Create answer sheet records
   - Start background evaluation process with question paper reference

## How Marks are Updated

1. **Evaluation Pipeline** processes each student's answer sheet against:
   - The question paper for reference
   - AI-powered grading using the questions as context

2. **Marks are calculated** based on:
   - Answers provided by the student
   - Question requirements from the question paper
   - AI evaluation confidence

3. **Dashboard displays**:
   - Total marks obtained for each student
   - Grade/Pass/Fail status
   - Individual question-wise marks
   - Feedback from evaluation

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid ZIP file format" | ZIP file is corrupted | Try recreating the ZIP file |
| "No matching files found in ZIP" | No files matched student roll numbers | Rename files to match roll numbers exactly (1, 2, 3, etc.) |
| "File does not exist" | File path is invalid | Ensure absolute paths are used in settings |
| "ZIP file contains no recognizable PDF/image files" | ZIP only has unsupported formats | Include .pdf, .jpg, .png files |

## Troubleshooting

### Files Not Being Recognized
- Check that filenames exactly match student roll numbers (1, 2, 3, not 001, 002, 003)
- Verify file extensions are in lowercase (`.pdf` not `.PDF`)
- Ensure there are no extra spaces in filenames
- Remove any special characters from filenames

### Some Students Missing
- Files for those students aren't in the ZIP
- Roll numbers don't match student records
- Check server logs for "No student found with roll number..." warnings

### Question Paper Not Found
- Check the filename matches one of the expected names (see above)
- Evaluation will proceed without it, but may be less accurate
- Re-upload with corrected question paper filename

### Upload Fails After "Extraction"
- One or more files failed to extract
- ZIP may be partially corrupted
- Try uploading individual files instead

## Logging
The system logs detailed information about ZIP processing to help diagnose issues:
- Matched files and student roll numbers
- Question paper extraction status
- Unmatched files with the roll number attempted
- File extraction status
- Path resolution details

Check the server logs for detailed troubleshooting information.

## Example Workflow

1. **Scan all answer sheets** from exam
2. **Export as images/PDFs** - One file per student
3. **Name files** by student roll number:
   ```
   1.pdf
   2.jpg
   3.pdf
   4.jpg
   ...
   ```
4. **Prepare question paper** (rename to `questions.pdf`)
5. **Create ZIP** containing all files:
   ```
   exam_batch.zip
   ├── questions.pdf
   ├── 1.pdf
   ├── 2.jpg
   ├── 3.pdf
   ├── 4.jpg
   └── ...
   ```
6. **Upload via Faculty Portal** → "Upload Sheets"
7. **Monitor Progress** via "View Progress" button
8. **Check Marks** on Student Dashboard after evaluation completes

## Best Practices

- ✅ Use consistent numeric roll numbers (1, 2, 3, not mixed formats)
- ✅ Include high-quality scans for better OCR accuracy
- ✅ Always include the question paper for better grading accuracy
- ✅ Use a descriptive question paper filename (questions.pdf is recommended)
- ✅ Verify roll numbers match your student records before uploading
- ✅ Test with a small batch first (5-10 students)
- ✅ Check logs for any warnings about unmatched files
- ❌ Don't include subdirectories (flatten the ZIP)
- ❌ Don't use special characters in filenames
- ❌ Don't rename files after upload (they're matched by filename)
- ❌ Don't mix different file formats unnecessarily

