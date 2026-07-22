import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, Layers, ClipboardList, MessageSquareWarning, 
  ArrowRight, ShieldCheck, PlayCircle 
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { showToast } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsData = await apiService.getFacultyDashboardStats();
        const subsData = await apiService.getFacultySubjects();
        setStats(statsData);
        setSubjects(subsData);
      } catch (err: any) {
        console.error(err);
        showToast('Failed to load faculty portal dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-card/40 border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-card/40 border border-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Counters bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all">
          <div className="p-3 rounded-xl bg-violet-500/20 text-purple-400"><BookOpen className="w-5.5 h-5.5" /></div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">My Courses</p>
            <p className="text-2xl font-extrabold text-foreground">{stats?.subjects ?? 0}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400"><Layers className="w-5.5 h-5.5" /></div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Classes</p>
            <p className="text-2xl font-extrabold text-foreground">{stats?.classes ?? 0}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all">
          <div className="p-3 rounded-xl bg-amber-500/20 text-orange-400"><ClipboardList className="w-5.5 h-5.5" /></div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Exams</p>
            <p className="text-2xl font-extrabold text-foreground">{stats?.exams ?? 0}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400"><MessageSquareWarning className="w-5.5 h-5.5" /></div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Open Complaints</p>
            <p className="text-2xl font-extrabold text-foreground">{stats?.pending_complaints ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned courses */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col gap-5">
          <div>
            <h3 className="text-base font-bold text-foreground">My Allocated Subjects</h3>
            <p className="text-xs text-muted-foreground">List of courses you currently manage for answer script evaluations.</p>
          </div>

          <div className="divide-y divide-border">
            {subjects.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No subject allocations found.</p>
            ) : (
              subjects.map((s) => (
                <div key={s.id} className="py-4.5 flex items-center justify-between group">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{s.name}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-indigo-400 font-bold bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/10">{s.code}</span>
                      <span>• Full-time course</span>
                    </div>
                  </div>
                  <a href="/faculty/create-exam" className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                    <span>Manage Exams</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Evaluation Pipeline HUD */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Evaluation Operations</h3>
            <p className="text-xs text-muted-foreground">Quick utility guide to start evaluations.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/20 border border-white/5 flex gap-3.5 items-start">
              <PlayCircle className="w-5.5 h-5.5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground">Initiate AI Assessment</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Upload a scanned script batch ZIP to evaluate students instantly using LangGraph agents.</p>
                <a href="/faculty/upload" className="text-[11px] font-bold text-primary hover:text-indigo-400 inline-flex items-center gap-1 mt-1">
                  <span>Go to Upload panel</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/20 border border-white/5 flex gap-3.5 items-start">
              <ShieldCheck className="w-5.5 h-5.5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground">Quality Control Panel</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Professors retain absolute authority. Review, override scores, edit comments, and sign off.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FacultyDashboard;
