import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquareWarning, CheckSquare, XSquare, Loader2, Sparkles } from 'lucide-react';

export const FacultyComplaints: React.FC = () => {
  const { showToast } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolution Form States
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      const data = await apiService.getFacultyComplaints();
      setComplaints(data);
    } catch (err) {
      showToast('Failed to load complaints directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (status: 'resolved' | 'rejected') => {
    if (!selectedComplaintId) return;
    if (!remarks) {
      showToast('Please provide resolution remarks', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.resolveComplaint(selectedComplaintId, status, remarks);
      showToast(`Complaint marked as ${status}`, 'success');
      setSelectedComplaintId(null);
      setRemarks('');
      fetchComplaints();
    } catch (err) {
      showToast('Failed to update complaint status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-lg font-bold text-foreground">Student Evaluation Complaint Desk</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Audit student re-evaluation requests, raised errors, or description anomalies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-secondary/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Exam Target</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground font-semibold">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-xs text-muted-foreground font-semibold">
                    No complaints registered.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/15">
                    <td className="px-6 py-4.5 font-bold">{c.student_name}</td>
                    <td className="px-6 py-4.5 text-muted-foreground">{c.exam_title}</td>
                    <td className="px-6 py-4.5">
                      <span className="px-2.5 py-0.5 rounded bg-indigo-950/40 text-indigo-400 font-bold border border-indigo-500/10">
                        {c.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'resolved' 
                          ? 'text-emerald-400' 
                          : c.status === 'rejected'
                          ? 'text-rose-400'
                          : 'text-amber-400 animate-pulse'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      {c.status === 'raised' && (
                        <button
                          onClick={() => setSelectedComplaintId(c.id)}
                          className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg shadow hover:bg-primary/95 transition-all"
                        >
                          Review Ticket
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Audit Inspector Drawer */}
        <div className="lg:col-span-1">
          {!selectedComplaintId ? (
            <div className="glass-panel p-16 text-center rounded-2xl text-xs text-muted-foreground border border-white/5 font-semibold">
              Select a raised complaint ticket on the left list to review descriptions and issue remarks.
            </div>
          ) : (
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">Student Case Details</span>
                <span className="text-sm font-bold text-foreground">
                  {complaints.find(c => c.id === selectedComplaintId)?.student_name}
                </span>
                <span className="text-xs text-muted-foreground block font-semibold leading-relaxed">
                  Description: "{complaints.find(c => c.id === selectedComplaintId)?.description}"
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase pl-0.5">Resolution Decision Remarks *</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Explain why the mark is adjusted or why this ticket is rejected..."
                  className="w-full p-3 bg-secondary/40 border border-white/5 focus:border-primary text-xs rounded-xl focus:outline-none text-foreground font-semibold leading-relaxed"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleResolve('rejected')}
                  disabled={submitting}
                  className="py-2.5 bg-rose-950/20 border border-rose-500/20 hover:bg-rose-950/30 text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XSquare className="w-4 h-4" />
                  <span>Reject Ticket</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleResolve('resolved')}
                  disabled={submitting}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Resolve & Override</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaintId(null)}
                className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground pt-1"
              >
                Cancel review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default FacultyComplaints;
