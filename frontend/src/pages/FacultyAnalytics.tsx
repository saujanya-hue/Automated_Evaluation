import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Loader2, TrendingUp, Award, Users, AlertCircle } from 'lucide-react';

export const FacultyAnalytics: React.FC = () => {
  const { showToast } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await apiService.getFacultyExams();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0].id);
        }
      } catch (err) {
        showToast('Failed to load exams', 'error');
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  const fetchAnalytics = async (examId: number) => {
    setLoadingAnalytics(true);
    try {
      const data = await apiService.getExamAnalytics(examId);
      setAnalytics(data);
    } catch (err) {
      showToast('Failed to load analytics details', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchAnalytics(selectedExamId);
    }
  }, [selectedExamId]);

  if (loadingExams) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Formatting Pie Chart Data
  const pieData = analytics?.grades 
    ? Object.keys(analytics.grades).map(k => ({ name: k, value: analytics.grades[k] }))
    : [];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Selector bar */}
      <div className="flex items-center gap-3 bg-card/40 p-4 rounded-2xl border border-white/5">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Exam Analytics</span>
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

      {loadingAnalytics ? (
        <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !analytics || pieData.length === 0 ? (
        <div className="glass-panel p-20 text-center rounded-2xl flex flex-col justify-center items-center gap-2 text-muted-foreground font-semibold">
          <AlertCircle className="w-8 h-8 text-primary" />
          <span className="text-xs">No analytics data available. Verify answer sheets are evaluated for this exam.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Counters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Class Average</span>
              <span className="text-2xl font-extrabold text-primary">{analytics.average} / 20</span>
              <div className="absolute right-4 bottom-4 text-primary/10"><TrendingUp className="w-12 h-12" /></div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Highest Score</span>
              <span className="text-2xl font-extrabold text-foreground">{analytics.highest} / 20</span>
              <div className="absolute right-4 bottom-4 text-indigo-500/10"><Award className="w-12 h-12" /></div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Lowest Score</span>
              <span className="text-2xl font-extrabold text-foreground">{analytics.lowest} / 20</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Passing Rate</span>
              <span className="text-2xl font-extrabold text-emerald-400">{analytics.pass_rate}%</span>
              <div className="absolute right-4 bottom-4 text-emerald-500/10"><Users className="w-12 h-12" /></div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Question Performance */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Question-Wise Performance</h4>
                <p className="text-xs text-muted-foreground">Class average points obtained per question.</p>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.question_performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#233555" />
                    <XAxis dataKey="question" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 10]} />
                    <Tooltip contentStyle={{ backgroundColor: '#131e35', borderColor: '#233555', borderRadius: '10px' }} />
                    <Bar dataKey="average_score" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                      {analytics.question_performance.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Grades Distribution */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Grades Distribution</h4>
                <p className="text-xs text-muted-foreground">Pie breakdown showing grade ratios.</p>
              </div>

              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#131e35', borderColor: '#233555', borderRadius: '10px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Performers Table */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">Top Performing Students</h4>
              <p className="text-xs text-muted-foreground">List of students achieving top scores in this exam.</p>
            </div>

            <div className="overflow-hidden border border-white/5 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-secondary/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Roll Number</th>
                    <th className="px-6 py-3.5 text-right">Marks</th>
                    <th className="px-6 py-3.5 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs text-foreground font-semibold">
                  {analytics.top_performers.map((t: any, i: number) => (
                    <tr key={i} className="hover:bg-secondary/15">
                      <td className="px-6 py-3.5 font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">#{i+1}</span>
                        <span>{t.student_name}</span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-indigo-400">{t.roll_number}</td>
                      <td className="px-6 py-3.5 text-right text-foreground font-extrabold">{t.total_marks}</td>
                      <td className="px-6 py-3.5 text-right font-extrabold text-primary">{t.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FacultyAnalytics;
