import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Award, ClipboardList, MessageSquareWarning, ArrowRight, Loader2, Play } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { showToast } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentDashboard = async () => {
      try {
        const statsData = await apiService.getStudentDashboardStats();
        const examsData = await apiService.getStudentExams();
        setStats(statsData);
        setExams(examsData);
      } catch (err) {
        showToast('Failed to load student dashboard info', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentDashboard();
  }, []);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all">
          <div className="p-3.5 rounded-xl bg-violet-500/20 text-purple-400"><ClipboardList className="w-5.5 h-5.5" /></div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attempted Exams</p>
            <p className="text-2xl font-extrabold text-foreground">{stats?.exams_attempted ?? 0}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all">
          <div className="p-3.5 rounded-xl bg-emerald-500/20 text-emerald-400"><Award className="w-5.5 h-5.5" /></div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CGPA Points</p>
            <p className="text-2xl font-extrabold text-foreground">{stats?.cgpa ?? '0.00'} / 10</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all">
          <div className="p-3.5 rounded-xl bg-rose-500/20 text-rose-400"><MessageSquareWarning className="w-5.5 h-5.5" /></div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-semibold">Active Complaints</p>
            <p className="text-2xl font-extrabold text-foreground">{stats?.active_complaints ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Published Results List */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5">
        <div>
          <h3 className="text-base font-bold text-foreground">Published Semester Grades</h3>
          <p className="text-xs text-muted-foreground">List of course evaluations completed by faculty.</p>
        </div>

        <div className="divide-y divide-border">
          {exams.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No exam results recorded yet.</p>
          ) : (
            exams.map((ex) => (
              <div key={ex.answer_sheet_id} className="py-4 flex items-center justify-between group">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{ex.exam_title}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                    <span className="font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/10">{ex.subject_code}</span>
                    <span>• {ex.subject_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  {ex.exam_status === 'completed' ? (
                    <>
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-extrabold text-foreground">{ex.marks_obtained} / {ex.max_marks}</span>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Grade: {ex.grade}</span>
                      </div>
                      <button
                        onClick={() => navigate('/student/results')}
                        className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/70 border border-white/5 hover:border-white/10 text-foreground font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-primary" />
                        <span>Inspect Script</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-500/10 animate-pulse uppercase tracking-wider">
                      Evaluating...
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default StudentDashboard;
