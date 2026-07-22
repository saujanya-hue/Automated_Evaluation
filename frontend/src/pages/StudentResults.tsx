import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Loader2, Sparkles, MessageSquareWarning, ArrowRight, ShieldCheck, ClipboardList } from 'lucide-react';

export const StudentResults: React.FC = () => {
  const { showToast } = useAuth();
  
  const [exams, setExams] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [loadingExams, setLoadingExams] = useState(true);

  // Inspector details
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Complaint Form
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [category, setCategory] = useState('marking_error');
  const [description, setDescription] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const fetchStudentExams = async () => {
    try {
      const data = await apiService.getStudentExams();
      // Filter only completed (published) exams
      const completed = data.filter((x: any) => x.exam_status === 'completed');
      setExams(completed);
      if (completed.length > 0) {
        setSelectedSheetId(completed[0].answer_sheet_id);
      }
    } catch (err) {
      showToast('Failed to load exams results', 'error');
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    fetchStudentExams();
  }, []);

  const loadDetails = async (sheetId: number) => {
    setLoadingDetails(true);
    try {
      const data = await apiService.getStudentResultDetails(sheetId);
      setDetails(data);
    } catch (err) {
      showToast('Failed to load results metadata', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedSheetId) {
      loadDetails(selectedSheetId);
    }
  }, [selectedSheetId]);

  const handleRaiseComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheetId || !description) return;
    setSubmittingComplaint(true);
    try {
      await apiService.raiseComplaint(selectedSheetId, category, description);
      showToast('Complaint ticket registered successfully', 'success');
      setShowComplaintModal(false);
      setDescription('');
    } catch (err) {
      showToast('Failed to submit complaint', 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (loadingExams) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Exam Selector Bar */}
      <div className="flex items-center gap-3 bg-card/40 p-4 rounded-2xl border border-white/5">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Auditing Exam Paper</span>
        <select
          value={selectedSheetId || ''}
          onChange={(e) => setSelectedSheetId(parseInt(e.target.value))}
          className="px-3.5 py-2 bg-secondary/40 border border-white/5 text-xs font-bold rounded-xl text-foreground focus:outline-none"
        >
          {exams.map((ex) => (
            <option key={ex.answer_sheet_id} value={ex.answer_sheet_id}>{ex.exam_title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Stats Bar */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl flex flex-col gap-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scoring Summary</h3>
          {loadingDetails ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border/60">
                <span className="text-xs text-muted-foreground font-semibold">Overall Grade</span>
                <span className="text-2xl font-extrabold text-primary">{details?.grade || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border/60">
                <span className="text-xs text-muted-foreground font-semibold">Marks Obtained</span>
                <span className="text-sm font-bold text-foreground">{details?.total_marks} / {details?.max_marks}</span>
              </div>
              <div className="flex flex-col gap-1 pb-3">
                <span className="text-xs text-muted-foreground font-semibold">Faculty Remarks</span>
                <span className="text-[11px] text-foreground leading-relaxed italic">
                  "{details?.reviewer_remarks || 'No faculty remarks provided.'}"
                </span>
              </div>

              {/* Action Complaint button */}
              <button
                onClick={() => setShowComplaintModal(true)}
                className="w-full py-2.5 bg-secondary hover:bg-secondary/70 border border-white/5 hover:border-white/10 text-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquareWarning className="w-4 h-4 text-primary" />
                <span>Raise Complaint Ticket</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Details Viewer */}
        <div className="lg:col-span-2 space-y-6">
          {loadingDetails ? (
            <div className="glass-panel p-20 flex justify-center rounded-2xl"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl space-y-6 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-border">
                <h4 className="text-sm font-bold text-foreground">Scanned Document & OCR Transcripts Mapping</h4>
              </div>

              {/* Side-by-side: Scanned Sheet vs. OCR Transcript */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Simulated Scanned Sheet */}
                <div className="p-4 bg-indigo-950/10 border border-white/5 rounded-2xl h-72 flex flex-col justify-between overflow-hidden">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase border-b border-border pb-2">
                    <span>Scanned PDF Sheet Page 1</span>
                    <span className="text-indigo-400 font-mono">150 DPI Raw</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                    <div className="w-16 h-24 border border-white/10 bg-card rounded flex flex-col justify-between p-2 shadow-xl animate-pulse">
                      <div className="h-1 bg-border rounded w-3/4" />
                      <div className="h-1 bg-border rounded w-1/2" />
                      <div className="h-1.5 bg-primary/30 rounded w-1/3 self-end" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-bold mt-3">Simulation Scanned Script Attached</span>
                  </div>
                </div>

                {/* Structured OCR Transcript */}
                <div className="p-4 bg-secondary/30 border border-white/5 rounded-2xl h-72 flex flex-col justify-between overflow-hidden">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase border-b border-border pb-2">
                    <span>OCR Handwriting Extraction</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3 animate-spin" />
                      <span>Gemini Extract</span>
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto py-3 text-xs leading-relaxed text-muted-foreground font-mono space-y-3">
                    <p className="whitespace-pre-wrap">{details?.ocr_transcript}</p>
                  </div>
                </div>
              </div>

              {/* Question-wise details list */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Question Scoring & Feedback Audit</h4>
                <div className="space-y-3.5">
                  {details?.question_evaluations.map((q: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-secondary/15 border border-white/5 flex flex-col gap-2.5">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-foreground">Question {q.question_number}</span>
                          <span className="text-[9px] text-muted-foreground block">Max Marks: {q.max_marks}</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{q.marks_obtained} / {q.max_marks}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-0.5">"{q.feedback}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-base font-bold text-foreground">File Re-evaluation Complaint</span>
              <button onClick={() => setShowComplaintModal(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>

            <form onSubmit={handleRaiseComplaint} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase pl-0.5">Complaint Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl text-foreground focus:outline-none"
                >
                  <option value="marking_error">Marking Calculation Error</option>
                  <option value="missing_marks">Missing Marks on Question</option>
                  <option value="reevaluation">Complete Script Re-evaluation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase pl-0.5">Issue Description Details *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why you are raising a complaint. Point out specific question numbers if applicable..."
                  className="w-full p-3 bg-secondary/40 border border-white/5 focus:border-primary text-xs rounded-xl focus:outline-none text-foreground font-semibold leading-relaxed"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 bg-secondary/50 border border-white/5 text-xs font-semibold rounded-xl text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/10 flex items-center gap-1.5"
                >
                  {submittingComplaint && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>File Complaint</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentResults;
