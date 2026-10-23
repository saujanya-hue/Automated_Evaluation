import os
import sys
import json
import fitz  # PyMuPDF
from PIL import Image
import numpy as np

os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# Force UTF-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, "backend"))

from evaluation_app.agents.agents import _get_paddle_ocr, _run_ocr_on_np_img
from evaluation_app.database.session import SessionLocal
from evaluation_app.models.models import OCRTranscript, AnswerSheet, Student

print("==================================================")
print("🔍 PADDLE OCR PARSING RESULTS FOR 3 ANSWER SCRIPTS")
print("==================================================")

# List of 3 answer scripts to parse
answer_script_files = [
    ("Answer Script 1 (RollNo 1)", "uploads/exams/exam_1_student_1_RollNo_1.pdf"),
    ("Answer Script 2 (RollNo 2)", "uploads/exams/exam_1_student_2_RollNo_2.pdf"),
    ("Answer Script 3 (RollNo 3)", "uploads/exams/exam_1_student_2_RollNo_3.pdf"),
]

# Initialize PaddleOCR engine
p_ocr = _get_paddle_ocr()

for title, file_path in answer_script_files:
    abs_path = os.path.abspath(file_path)
    print(f"\n--------------------------------------------------")
    print(f"📄 {title}")
    print(f"📍 File Path: {abs_path}")
    print(f"--------------------------------------------------")

    if not os.path.exists(abs_path):
        print(f"❌ File not found at {abs_path}")
        continue

    doc = fitz.open(abs_path)
    print(f"Total Pages: {len(doc)}")

    full_extracted_lines = []

    for page_index, page in enumerate(doc):
        pix = page.get_pixmap(dpi=150)
        pil_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        np_img = np.array(pil_img)

        print(f"\n  --- Page {page_index + 1} ---")

        if p_ocr:
            try:
                try:
                    res = p_ocr.ocr(np_img)
                except Exception:
                    res = p_ocr.predict(np_img)
                lines = []
                if res:
                    # Handle paddleocr result types
                    if isinstance(res, list) and len(res) > 0:
                        first_res = res[0]
                        if isinstance(first_res, dict):
                            # PaddleX / PaddleOCR 3.x dict format
                            rec_texts = first_res.get("rec_text", first_res.get("rec_texts", []))
                            rec_scores = first_res.get("rec_score", first_res.get("rec_scores", []))
                            for idx, text in enumerate(rec_texts):
                                score = rec_scores[idx] if idx < len(rec_scores) else 1.0
                                print(f"    Line {idx + 1:02d} | Confidence: {float(score)*100:.1f}% | Text: '{text}'")
                                lines.append(str(text))
                        elif isinstance(first_res, list):
                            for item_idx, item in enumerate(first_res):
                                if item and isinstance(item, (list, tuple)) and len(item) > 1:
                                    box, text_info = item[0], item[1]
                                    text = text_info[0] if isinstance(text_info, (list, tuple)) else str(text_info)
                                    confidence = text_info[1] if (isinstance(text_info, (list, tuple)) and len(text_info) > 1) else 1.0
                                    print(f"    Line {item_idx + 1:02d} | Confidence: {float(confidence)*100:.1f}% | Text: '{text}'")
                                    lines.append(str(text))
                    elif isinstance(res, dict):
                        rec_texts = res.get("rec_text", res.get("rec_texts", []))
                        rec_scores = res.get("rec_score", res.get("rec_scores", []))
                        for idx, text in enumerate(rec_texts):
                            score = rec_scores[idx] if idx < len(rec_scores) else 1.0
                            print(f"    Line {idx + 1:02d} | Confidence: {float(score)*100:.1f}% | Text: '{text}'")
                            lines.append(str(text))

                if not lines:
                    print("    (No text detected by PaddleOCR on this page)")
                
                full_extracted_lines.extend(lines)
            except Exception as e:
                print(f"    ⚠️ PaddleOCR Error: {e}")
                text_out = _run_ocr_on_np_img(np_img)
                print(f"    Fallback Extracted Text: {text_out}")
        else:
            text_out = _run_ocr_on_np_img(np_img)
            print(f"    Extracted Text: {text_out}")

    print(f"\n  📌 Combined Extracted Transcript for {title}:")
    print("  " + "\n  ".join(full_extracted_lines) if full_extracted_lines else "  (Empty)")

print("\n==================================================")
print("✅ OCR PARSING COMPLETE")
print("==================================================")
