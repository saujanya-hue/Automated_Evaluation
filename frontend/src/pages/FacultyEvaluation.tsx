import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Play, CheckCircle2, ChevronRight, Loader2, Sparkles, FileText, 
  ArrowRight, ShieldCheck, Edit3, Save, CheckSquare
} from 'lucide-react';

export const FacultyEvaluation: React.FC = () => {
  const { showToast } = useAuth();
  
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [answerSheets, setAnswerSheets] = useState<any[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  
  // Pipeline Animation States
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineRunning, setPipelineRunning] = useState(false);

  // Inspector States
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [detailedEval, setDetailedEval] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Override Fields
  const [overrideQId, setOverrideQId] = useState<number | null>(null);
  const [overrideMarks, setOverrideMarks] = useState<number>(0);
  const [overrideFeedback, setOverrideFeedback] = useState('');
  const [overriding, setOverriding] = useState(false);
  
  // Remarks
  const [reviewerRemarks, setReviewerRemarks] = useState('');
  const [approving, setApproving] = useState(false);

  const fetchExams = async () => {
    try {
      const data = await apiService.getFacultyExams();
      setExams(data);
      if (data.length > 0) {
        setSelectedExamId(data[0].id);
      }
    } catch (err) {
      showToast('Failed to load exams', 'error');
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchSheets = async (examId: number) => {
    setLoadingSheets(true);
    try {
      const data = await apiService.getExamAnswerSheets(examId);
      setAnswerSheets(data);
      
      // Check if any sheet is still evaluating
      const isEvaluating = data.some((s: any) => s.status === 'evaluating');
      if (isEvaluating) {
        setPipelineRunning(true);
        // Advance pipeline step visually based on how many sheets are done
        const doneCount = data.filter((s: any) => s.status !== 'evaluating').length;
        const newStep = Math.min(doneCount + 1, 5);
        setPipelineStep(prev => Math.max(prev, newStep));
      } else {
        if (pipelineRunning) {
          // Just finished evaluating — show all steps complete
          setPipelineStep(6);
          showToast('AI pipeline completed grading successfully', 'success');
        }
        setPipelineRunning(false);
      }
    } catch (err) {
      showToast('Failed to load answer sheets', 'error');
    } finally {
      setLoadingSheets(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchSheets(selectedExamId);
      setSelectedSheetId(null);
      setDetailedEval(null);
    }
  }, [selectedExamId]);

  // Real polling: while any sheet is evaluating, re-fetch every 4 seconds
  useEffect(() => {
    if (!pipelineRunning || !selectedExamId) return;
    const interval = setInterval(() => {
      fetchSheets(selectedExamId);
    }, 4000);
    return () => clearInterval(interval);
  }, [pipelineRunning, selectedExamId]);

  const loadDetailedEvaluation = async (sheetId: number) => {
    setLoadingDetail(true);
    try {
      const data = await apiService.getDetailedEvaluation(sheetId);
      setDetailedEval(data);
      setReviewerRemarks(data.sheet.reviewer_remarks || '');
    } catch (err) {
      showToast('Failed to load sheet details', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedSheetId) {
      loadDetailedEvaluation(selectedSheetId);
    }
  }, [selectedSheetId]);

  const handleOverrideSave = async (resultId: number) => {
    setOverriding(true);
    try {
      await apiService.overrideMarks(resultId, overrideMarks, overrideFeedback);
      showToast('Question score overridden successfully', 'success');
      setOverrideQId(null);
      if (selectedSheetId) {
        loadDetailedEvaluation(selectedSheetId);
        // Refresh grid list to show recalculated totals
        if (selectedExamId) fetchSheets(selectedExamId);
      }
    } catch (err) {
      showToast('Override failed', 'error');
    } finally {
      setOverriding(false);
    }
  };

  const handleApproveSheet = async () => {
    if (!selectedSheetId) return;
    setApproving(true);
    try {
      await apiService.approveAnswerSheet(selectedSheetId, reviewerRemarks);
      showToast('Answer sheet approved and marked as reviewed', 'success');
      if (selectedExamId) fetchSheets(selectedExamId);
      setSelectedSheetId(null);
      setDetailedEval(null);
    } catch (err) {
      showToast('Approval failed', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handlePublishAll = async () => {
    if (!selectedExamId) return;
    if (!window.confirm('Are you sure you want to publish these scores? Students will receive immediate access.')) return;
    try {
      await apiService.publishResults(selectedExamId);
      showToast('Exam results successfully published!', 'success');
      fetchExams();
    } catch (err) {
      showToast('Failed to publish results', 'error');
    }
  };

  const steps = [
    { label: 'Question Paper Parsing', desc: 'Analyzing structured questions & points bounds' },
    { label: 'Document Layout Extraction', desc: 'GPT OSS 120B Cloud document understanding segments' },
    { label: 'OCR Handwriting Transcription', desc: 'Extracting student text character strings' },
    { label: 'Question Mapping', desc: 'Aligning segmented answers to paper questions' },
    { label: 'AI Evaluation & Scoring', desc: 'GPT OSS 120B Cloud executing examiner criteria' },
    { label: 'Compilation & Final Reports', desc: 'Assembling scoring tables and matrices' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Exam Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card/40 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Exam</span>
          <select
            value={selectedExamId || ''}
            onChange={(e) => setSelectedExamId(parseInt(e.target.value))}
            className="px-3.5 py-2 bg-secondary/40 border border-white/5 text-xs font-bold rounded-xl text-foreground focus:outline-none"
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        {selectedExamId && (
          <button
            onClick={handlePublishAll}
            disabled={answerSheets.length === 0 || pipelineRunning || exams.find(e => e.id === selectedExamId)?.status === 'completed'}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/10 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Publish Results</span>
          </button>
        )}
      </div>

      {/* Pipeline Status Timeline Banner */}
      {pipelineRunning && (
        <div className="glass-panel p-6 rounded-2xl border border-primary/20 space-y-4">
          <div className="flex items-center gap-3.5">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <h4 className="text-sm font-bold text-foreground">AI Evaluator Pipeline Active</h4>
              <p className="text-xs text-muted-foreground">Running LangGraph nodes sequentially. Page extraction details shown below.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
            {steps.map((s, i) => (
              <div 
                key={i} 
                className={`p-3.5 rounded-xl border flex flex-col gap-1 transition-all ${
                  pipelineStep > i 
                    ? 'bg-primary/10 border-primary/40 text-primary-foreground' 
                    : pipelineStep === i
                    ? 'bg-secondary/40 border-primary animate-pulse text-foreground'
                    : 'bg-secondary/15 border-white/5 opacity-40 text-muted-foreground'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Step {i+1}</span>
                  {pipelineStep > i && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                </div>
                <span className="text-xs font-bold mt-1.5 leading-snug">{s.label}</span>
                <span className="text-[9px] text-muted-foreground line-clamp-1 leading-snug">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Left List, Right Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left: Answer Sheets Grid */}
        <div className="xl:col-span-1 glass-panel rounded-2xl overflow-hidden shadow-xl flex flex-col gap-4 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Class Student Papers</h3>
          
          {loadingSheets ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {answerSheets.length === 0 ? (
                <p className="text-xs text-muted-foreground py-10 text-center">No uploads found.</p>
              ) : (
                answerSheets.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => { if (s.status !== 'evaluating') setSelectedSheetId(s.id); }}
                    className={`p-4 rounded-xl border cursor-pointer flex flex-col gap-1.5 transition-all ${
                      selectedSheetId === s.id
                        ? 'bg-primary/20 border-primary'
                        : s.status === 'evaluating'
                        ? 'opacity-50 cursor-not-allowed bg-secondary/10 border-white/5'
                        : 'bg-secondary/30 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">{s.student_name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        s.status === 'reviewed' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                          : s.status === 'evaluated'
                          ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20'
                          : 'bg-secondary/40 text-muted-foreground'
                      }`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                      <span>Roll: <span className="font-mono text-foreground font-bold">{s.student_roll}</span></span>
                      {s.status !== 'evaluating' && (
                        <span>Grade: <span className="text-primary font-bold">{s.grade || 'N/A'} ({s.total_marks}/20)</span></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: Detailed Inspector Pane */}
        <div className="xl:col-span-2 space-y-6">
          {!selectedSheetId ? (
            <div className="glass-panel p-20 text-center rounded-2xl border border-white/5 text-xs text-muted-foreground font-semibold">
              Select a student paper from the left panel to inspect detailed OCR transcription and AI grading.
            </div>
          ) : loadingDetail ? (
            <div className="glass-panel p-20 text-center rounded-2xl flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl space-y-6 border border-white/5 animate-in fade-in duration-200">
              {/* Header Details */}
              <div className="flex justify-between items-start pb-4.5 border-b border-border">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="w-5.5 h-5.5 text-primary" />
                    <span>Grading Audit - {detailedEval?.sheet.student_name}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Scanned Document & Question mapping results.</p>
                </div>
                
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-primary">{detailedEval?.sheet.total_marks} / 20</span>
                  <span className="text-xs font-bold text-muted-foreground block">Grade: {detailedEval?.sheet.grade}</span>
                </div>
              </div>

              {/* Side-by-side: Scanned Sheet vs. OCR Transcript */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Simulated Scanned Sheet */}
                <div className="p-4 bg-indigo-950/10 border border-white/5 rounded-2xl h-80 flex flex-col justify-between overflow-hidden">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase border-b border-border pb-2">
                    <span>Scanned PDF Sheet Page 1</span>
                    <span className="text-indigo-400 font-mono">150 DPI Raw</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                    <div className="w-20 h-28 border border-white/10 bg-card rounded flex flex-col justify-between p-2 shadow-xl animate-pulse">
                      <div className="h-1 bg-border rounded w-3/4" />
                      <div className="h-1 bg-border rounded w-1/2" />
                      <div className="h-1 bg-border rounded w-5/6" />
                      <div className="h-1.5 bg-primary/30 rounded w-1/3 self-end" />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-bold mt-4">Simulation Viewer - Scanned Script Attached</span>
                  </div>
                </div>

                {/* Structured OCR Transcript */}
                <div className="p-4 bg-secondary/30 border border-white/5 rounded-2xl h-80 flex flex-col justify-between overflow-hidden">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase border-b border-border pb-2">
                    <span>Structured OCR Transcript</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3 animate-spin" />
                      <span>Ollama Extract</span>
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto py-3 text-xs leading-relaxed text-muted-foreground font-mono space-y-3">
                    <p className="whitespace-pre-wrap">{detailedEval?.ocr.raw_text}</p>
                  </div>
                </div>
              </div>

              {/* Question Evaluations Accordion */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Question-by-Question Marks & Feedback</h4>

                <div className="space-y-3.5">
                  {detailedEval?.results.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl bg-secondary/15 border border-white/5 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-foreground">Question {r.question_number}</span>
                          <span className="text-[10px] text-muted-foreground block">Max Marks: {r.max_marks} | AI Grading Confidence: {Math.round(r.confidence_score * 100)}%</span>
                        </div>

                        {overrideQId !== r.id ? (
                          <div className="flex items-center gap-3.5">
                            <span className="text-sm font-extrabold text-foreground">{r.marks_obtained} / {r.max_marks}</span>
                            <button
                              onClick={() => {
                                setOverrideQId(r.id);
                                setOverrideMarks(r.marks_obtained);
                                setOverrideFeedback(r.feedback || '');
                              }}
                              className="p-1.5 text-primary hover:bg-secondary/40 rounded border border-transparent hover:border-white/5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.5"
                              value={overrideMarks}
                              onChange={(e) => setOverrideMarks(parseFloat(e.target.value))}
                              className="w-16 px-2 py-1 bg-card border border-primary text-xs font-bold rounded text-foreground focus:outline-none"
                            />
                            <button
                              onClick={() => handleOverrideSave(r.id)}
                              disabled={overriding}
                              className="p-1.5 bg-primary text-white rounded hover:bg-primary/90"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {overrideQId !== r.id ? (
                        <p className="text-xs text-muted-foreground leading-relaxed pl-1">{r.feedback}</p>
                      ) : (
                        <textarea
                          value={overrideFeedback}
                          onChange={(e) => setOverrideFeedback(e.target.value)}
                          className="w-full p-2 bg-card border border-white/5 focus:border-primary text-xs rounded-lg focus:outline-none text-foreground font-semibold leading-relaxed"
                          rows={3}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval controls */}
              <div className="border-t border-border pt-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Reviewer Remarks / Feedback</label>
                  <textarea
                    value={reviewerRemarks}
                    onChange={(e) => setReviewerRemarks(e.target.value)}
                    placeholder="Provide comments on handwriting readability, overall performance..."
                    className="w-full p-3 bg-secondary/30 border border-white/5 focus:border-primary text-xs rounded-xl focus:outline-none text-foreground font-semibold"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3.5">
                  <button
                    onClick={() => { setSelectedSheetId(null); setDetailedEval(null); }}
                    className="px-4 py-2.5 bg-secondary/50 border border-white/5 text-xs font-bold rounded-xl text-foreground"
                  >
                    Close Sheet
                  </button>
                  <button
                    onClick={handleApproveSheet}
                    disabled={approving}
                    className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                  >
                    {approving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Approve & Sign Off</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default FacultyEvaluation;
