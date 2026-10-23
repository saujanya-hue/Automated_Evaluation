import os
import sys

# Set environment variables BEFORE importing paddle / paddleocr
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import fitz  # PyMuPDF
from PIL import Image
import numpy as np
from paddleocr import PaddleOCR

# Force UTF-8 encoding for terminal output
sys.stdout.reconfigure(encoding='utf-8')

def extract_ciat1_texts():
    print("=" * 70, flush=True)
    print("🚀 EXTRACTING TEXT FROM CIAT 1 PDFs USING PADDLE OCR (EXCLUSIVE)", flush=True)
    print("=" * 70, flush=True)

    print("Initializing PaddleOCR engine...", flush=True)
    try:
        p_ocr = PaddleOCR(use_angle_cls=False, lang='en', enable_mkldnn=False)
        print("✓ PaddleOCR initialized successfully.\n", flush=True)
    except Exception as e:
        print(f"❌ Failed to initialize PaddleOCR engine: {e}", flush=True)
        return

    ciat1_files = [
        ("CIAT 1 Question Paper & Answer Key", "uploads/exams/exam_1_questions_question_with_answerkey.pdf"),
        ("CIAT 1 Answer Script - Student Roll No 1", "uploads/exams/exam_1_student_1_RollNo_1.pdf"),
        ("CIAT 1 Answer Script - Student Roll No 2", "uploads/exams/exam_1_student_2_RollNo_2.pdf"),
        ("CIAT 1 Answer Script - Student Roll No 3", "uploads/exams/exam_1_student_2_RollNo_3.pdf"),
        ("CIAT 1 Answer Script - Student CS2026045", "uploads/exams/exam_1_student_CS2026045_RollNo_CS2026045.pdf"),
    ]

    for title, rel_path in ciat1_files:
        abs_path = os.path.abspath(rel_path)
        print("\n" + "=" * 70, flush=True)
        print(f"📄 {title}", flush=True)
        print(f"📍 File Path: {abs_path}", flush=True)
        print("=" * 70, flush=True)

        if not os.path.exists(abs_path):
            print(f"⚠️ File not found at {abs_path}", flush=True)
            continue

        try:
            doc = fitz.open(abs_path)
        except Exception as e:
            print(f"❌ Error opening PDF file: {e}", flush=True)
            continue

        print(f"Total Pages: {len(doc)}", flush=True)

        for page_index, page in enumerate(doc):
            print(f"\n--- Page {page_index + 1} ---", flush=True)

            # Check direct PyMuPDF text layer
            pdf_layer_text = page.get_text().strip()
            if pdf_layer_text and len(pdf_layer_text) > 10 and "%PDF" not in pdf_layer_text:
                print(f"📌 PyMuPDF Direct Text Layer ({len(pdf_layer_text)} chars):", flush=True)
                print(pdf_layer_text, flush=True)

            # Render page image and run PaddleOCR
            print("🔄 Running PaddleOCR on rendered page image...", flush=True)
            pix = page.get_pixmap(dpi=150)
            pil_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            np_img = np.array(pil_img)

            lines = []
            try:
                res = list(p_ocr.predict(np_img))
                for item in res:
                    if isinstance(item, dict):
                        rec_texts = item.get("rec_texts", item.get("rec_text", []))
                        rec_scores = item.get("rec_scores", item.get("rec_score", []))
                        for idx, txt in enumerate(rec_texts):
                            sc = rec_scores[idx] if idx < len(rec_scores) else 1.0
                            lines.append(f"  Line {idx+1:02d} [{float(sc)*100:.1f}%] : {txt}")
            except Exception as ex:
                print(f"⚠️ PaddleOCR predict warning: {ex}", flush=True)

            if lines:
                print(f"📌 PaddleOCR Extracted Text ({len(lines)} lines):", flush=True)
                print("\n".join(lines), flush=True)
            else:
                print("  (No text detected by PaddleOCR on this page)", flush=True)

    print("\n" + "=" * 70, flush=True)
    print("✅ CIAT 1 TEXT EXTRACTION COMPLETE", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    extract_ciat1_texts()
