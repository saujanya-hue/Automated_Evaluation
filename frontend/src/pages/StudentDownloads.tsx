import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Download, FileText, FileDown, Loader2 } from 'lucide-react';

export const StudentDownloads: React.FC = () => {
  const { showToast } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await apiService.getStudentExams();
        // Filter only completed (published) exams
        setExams(data.filter((x: any) => x.exam_status === 'completed'));
      } catch (err) {
        showToast('Failed to load exams list', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const triggerDownload = (filename: string, text: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast(`${filename} download started!`, 'success');
  };

  const handleDownloadTranscript = async (sheetId: number, examTitle: string) => {
    try {
      const data = await apiService.getStudentResultDetails(sheetId);
      const text = `====================================================\n` +
                   `AEGIS EVALUATE - AUTOMATED SCRIPT EVALUATION REPORT\n` +
                   `====================================================\n` +
                   `Exam: ${examTitle}\n` +
                   `Course Code: ${data.subject_code}\n` +
                   `Subject: ${data.subject_name}\n` +
                   `Marks: ${data.total_marks} / ${data.max_marks}\n` +
                   `Grade: ${data.grade}\n` +
                   `Reviewer Remarks: ${data.reviewer_remarks || 'None'}\n\n` +
                   `----------------------------------------------------\n` +
                   `OCR HANDWRITING TRANSCRIPT EXTRACT:\n` +
                   `----------------------------------------------------\n` +
                   `${data.ocr_transcript}\n\n` +
                   `----------------------------------------------------\n` +
                   `QUESTION-BY-QUESTION FEEDBACK:\n` +
                   `----------------------------------------------------\n` +
                   data.question_evaluations.map((q: any) => 
                     `Question ${q.question_number} [Score: ${q.marks_obtained}/${q.max_marks}]:\n"${q.feedback}"`
                   ).join('\n\n');
                   
      triggerDownload(`${examTitle.replace(/\s+/g, '_')}_evaluation_report.txt`, text);
    } catch (err) {
      showToast('Download failed. Ensure API is running.', 'error');
    }
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-lg font-bold text-foreground">Scanned Document & Report Downloads</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Download original script scans, Azure OCR text transcripts, or compiled evaluations.</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-secondary/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
            <tr>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Exam Title</th>
              <th className="px-6 py-4">Overall Score</th>
              <th className="px-6 py-4 text-right">Available Downloads</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs text-foreground font-semibold">
            {exams.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-xs text-muted-foreground font-semibold">
                  No downloads available yet.
                </td>
              </tr>
            ) : (
              exams.map((ex) => (
                <tr key={ex.answer_sheet_id} className="hover:bg-secondary/15 transition-colors">
                  <td className="px-6 py-4.5 font-bold">
                    <span className="font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/10 mr-2">{ex.subject_code}</span>
                    {ex.subject_name}
                  </td>
                  <td className="px-6 py-4.5 text-muted-foreground">{ex.exam_title}</td>
                  <td className="px-6 py-4.5 font-bold text-primary">{ex.marks_obtained} / {ex.max_marks} (Grade: {ex.grade})</td>
                  <td className="px-6 py-4.5 text-right space-x-2">
                    <button
                      onClick={() => handleDownloadTranscript(ex.answer_sheet_id, ex.exam_title)}
                      className="px-3 py-1.5 bg-secondary hover:bg-secondary/70 border border-white/5 hover:border-white/10 text-foreground text-[10px] font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <FileDown className="w-3.5 h-3.5 text-primary" />
                      <span>Grading Report</span>
                    </button>
                    <button
                      onClick={() => triggerDownload(`${ex.exam_title.replace(/\s+/g, '_')}_scanned_script.pdf`, 'Simulated binary scanned document bytes')}
                      className="px-3 py-1.5 bg-secondary hover:bg-secondary/70 border border-white/5 hover:border-white/10 text-foreground text-[10px] font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Original Scan</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default StudentDownloads;
