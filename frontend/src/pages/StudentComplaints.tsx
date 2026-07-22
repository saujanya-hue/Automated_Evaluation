import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquareWarning, Loader2, ArrowRight } from 'lucide-react';

export const StudentComplaints: React.FC = () => {
  const { showToast } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await apiService.getStudentComplaints();
        setComplaints(data);
      } catch (err) {
        showToast('Failed to load complaints tracking database', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-lg font-bold text-foreground">Complaint & Re-evaluation Tracking</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Track resolved or active tickets filed against semester evaluations.</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-secondary/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
            <tr>
              <th className="px-6 py-4">Ticket Target</th>
              <th className="px-6 py-4">Complaint Category</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Faculty Resolution Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs text-foreground font-semibold">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-xs text-muted-foreground font-semibold">
                  No complaints filed yet.
                </td>
              </tr>
            ) : (
              complaints.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/15 transition-colors">
                  <td className="px-6 py-4.5 font-bold">{c.exam_title}</td>
                  <td className="px-6 py-4.5">
                    <span className="px-2.5 py-0.5 rounded bg-indigo-950/40 text-indigo-400 font-bold border border-indigo-500/10">
                      {c.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 uppercase tracking-wider text-[10px]">
                    <span className={
                      c.status === 'resolved' 
                        ? 'text-emerald-400' 
                        : c.status === 'rejected'
                        ? 'text-rose-400'
                        : 'text-amber-400 animate-pulse'
                    }>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-muted-foreground max-w-xs truncate">{c.description}</td>
                  <td className="px-6 py-4.5 text-foreground leading-relaxed italic">
                    {c.resolution_remarks || 'Pending audit review.'}
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
export default StudentComplaints;
