import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, Plus, FileUp, Loader2, Play, Eye } from 'lucide-react';

export const FacultyExams: React.FC = () => {
  const { showToast } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Exam Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [maxMarks, setMaxMarks] = useState('20');
  const [passingMarks, setPassingMarks] = useState('8');
  const [submitting, setSubmitting] = useState(false);

  // Upload File States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadExamId, setUploadExamId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchExamsAndParams = async () => {
    try {
      const examData = await apiService.getFacultyExams();
      const subData = await apiService.getFacultySubjects();
      const classData = await apiService.getFacultyClasses();
      setExams(examData);
      setSubjects(subData);
      setClasses(classData);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load exams list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsAndParams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !classId) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createExam({
        title,
        subject_id: parseInt(subjectId),
        class_id: parseInt(classId),
        max_marks: parseInt(maxMarks),
        passing_marks: parseInt(passingMarks),
      });
      showToast('Exam registered successfully', 'success');
      setShowCreateModal(false);
      setTitle('');
      setSubjectId('');
      setClassId('');
      fetchExamsAndParams();
    } catch (err: any) {
      showToast('Failed to create exam record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadExamId || !selectedFile) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    setUploading(true);
    try {
      await apiService.uploadAnswerSheets(uploadExamId, selectedFile);
      showToast('Files uploaded. AI evaluation pipeline triggered in background.', 'success');
      setShowUploadModal(false);
      setSelectedFile(null);
      fetchExamsAndParams();
      // Redirect to evaluation progress timeline
      navigate('/faculty/progress');
    } catch (err: any) {
      console.error(err);
      showToast('Upload failed. Ensure files match ZIP formats.', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-foreground">Exam Management Control</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Define exam profiles, upload scanned ZIP answer keys, or audit grades.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Exam Configuration</span>
        </button>
      </div>

      {/* Grid of Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.length === 0 ? (
          <div className="lg:col-span-3 glass-panel p-10 text-center text-xs text-muted-foreground font-semibold">
            No exams registered yet. Create one to begin.
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-5 relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-500/10">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                    exam.status === 'completed' 
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                      : exam.status === 'evaluating'
                      ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
                      : 'bg-secondary/40 text-muted-foreground border border-border'
                  }`}>
                    {exam.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">{exam.title}</h4>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Course: {subjects.find(s => s.id === exam.subject_id)?.name || 'OOP'}
                  </p>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Class: {classes.find(c => c.id === exam.class_id)?.name || 'Batch-2026'}
                  </p>
                </div>

                <div className="flex gap-4 text-xs font-semibold text-muted-foreground border-t border-border/60 pt-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground/60 uppercase block">Max Marks</span>
                    <span className="text-foreground font-bold">{exam.max_marks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground/60 uppercase block">Pass Marks</span>
                    <span className="text-foreground font-bold">{exam.passing_marks}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 border-t border-border pt-4">
                {exam.status === 'draft' ? (
                  <button
                    onClick={() => { setUploadExamId(exam.id); setShowUploadModal(true); }}
                    className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-primary/10"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Upload Sheets</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/faculty/progress`)}
                    className="w-full py-2 bg-secondary hover:bg-secondary/70 text-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    <span>View Progress</span>
                  </button>
                )}
                
                <button
                  disabled={exam.status === 'draft'}
                  onClick={() => navigate(`/faculty/results?exam=${exam.id}`)}
                  className="w-full py-2 bg-secondary/50 border border-white/5 hover:border-white/10 text-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audit Scores</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-base font-bold text-foreground">Create Exam Blueprint</span>
              <button onClick={() => setShowCreateModal(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Exam Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. OOP Midterm Examination"
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Subject Course *</label>
                  <select
                    required
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none text-foreground"
                  >
                    <option value="">Select Course</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Target Class *</label>
                  <select
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none text-foreground"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Max Marks *</label>
                  <input
                    type="number"
                    required
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Passing Marks *</label>
                  <input
                    type="number"
                    required
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-secondary/50 border border-white/5 text-xs font-semibold rounded-xl text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/10"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Exam Blueprint</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-base font-bold text-foreground">Upload Student Scripts</span>
              <button onClick={() => setShowUploadModal(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer relative">
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileUp className="w-10 h-10 text-primary animate-bounce mb-2" />
                <span className="text-xs font-bold text-foreground">
                  {selectedFile ? selectedFile.name : 'Select or drag ZIP package'}
                </span>
                <span className="text-[10px] text-muted-foreground">PDF, ZIP and docx files allowed.</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-secondary/50 border border-white/5 text-xs font-semibold rounded-xl text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/10 flex items-center gap-1.5"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Evaluate Sheets</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FacultyExams;
