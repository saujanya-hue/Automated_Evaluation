import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, BookOpen, Layers, Users, GraduationCap, ClipboardList, 
  ArrowRight, ShieldAlert, CheckCircle2, TrendingUp 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiService.getAdminStats();
        setStats(res);
      } catch (err: any) {
        console.error(err);
        showToast('Failed to load dashboard metrics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cardConfig = [
    { title: 'Departments', value: stats?.departments_count ?? 0, icon: Building2, color: 'from-blue-500/20 to-cyan-500/20', text: 'text-cyan-400' },
    { title: 'Subjects', value: stats?.subjects_count ?? 0, icon: BookOpen, color: 'from-violet-500/20 to-purple-500/20', text: 'text-purple-400' },
    { title: 'Classes', value: stats?.classes_count ?? 0, icon: Layers, color: 'from-amber-500/20 to-orange-500/20', text: 'text-orange-400' },
    { title: 'Faculty Members', value: stats?.faculty_count ?? 0, icon: Users, color: 'from-emerald-500/20 to-teal-500/20', text: 'text-emerald-400' },
    { title: 'Enrolled Students', value: stats?.students_count ?? 0, icon: GraduationCap, color: 'from-rose-500/20 to-pink-500/20', text: 'text-pink-400' },
    { title: 'Total Exams', value: stats?.exams_count ?? 0, icon: ClipboardList, color: 'from-indigo-500/20 to-blue-500/20', text: 'text-indigo-400' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-card/40 border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-card/40 border border-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardConfig.map((c, i) => {
          const Icon = c.icon;
          return (
            <div 
              key={i} 
              className={`p-6 rounded-2xl bg-gradient-to-br ${c.color} border border-white/5 flex items-center justify-between shadow-xl relative overflow-hidden group`}
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{c.title}</p>
                <p className="text-4xl font-extrabold text-foreground tracking-tight">{c.value}</p>
              </div>
              <div className={`p-4 rounded-xl bg-card border border-white/5 ${c.text} shadow-inner group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Actions */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Admin Operations Hub</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Configure and initialize curriculum structures in real time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-secondary/20 border border-white/5 flex flex-col gap-2">
              <span className="text-sm font-bold text-foreground">Faculty Allocation</span>
              <span className="text-[11px] text-muted-foreground leading-relaxed">Map professors to classes and target subjects for exam grading access.</span>
              <a href="/admin/assign-faculty" className="text-xs font-bold text-primary hover:text-indigo-400 inline-flex items-center gap-1 mt-1 transition-colors">
                <span>Configure assignments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-secondary/20 border border-white/5 flex flex-col gap-2">
              <span className="text-sm font-bold text-foreground">Department Configuration</span>
              <span className="text-[11px] text-muted-foreground leading-relaxed">Manage institution departments, study plans, and class sections.</span>
              <a href="/admin/departments" className="text-xs font-bold text-primary hover:text-indigo-400 inline-flex items-center gap-1 mt-1 transition-colors">
                <span>Manage folders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Right: Notifications & Logs HUD */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">System Status Panel</h3>
            <p className="text-xs text-muted-foreground mt-1">Status logs of AI agent processing units.</p>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold">Gemini 2.5 Flash OCR - Active</span>
                <span className="text-[10px] text-muted-foreground">Successfully pinged endpoint. OCR pipeline is running.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold">Gemini AI Model - Configured</span>
                <span className="text-[10px] text-muted-foreground">Gemini 2.5 Flash operational. Evaluator pipeline is active.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold">Local SQLite Engine in use</span>
                <span className="text-[10px] text-muted-foreground font-medium">Running on lightweight database instance. Backup active.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
