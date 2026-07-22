import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserCheck, UserMinus, Plus, Search, Loader2 } from 'lucide-react';

export const AdminFaculty: React.FC = () => {
  const { showToast } = useAuth();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [deptId, setDeptId] = useState('');
  const [designation, setDesignation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFacultyAndDepts = async () => {
    try {
      const facData = await apiService.getFaculty();
      const deptData = await apiService.getDepartments();
      setFaculty(facData);
      setDepartments(deptData);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load faculty directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyAndDepts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !employeeId || !deptId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createFaculty({
        name,
        email,
        password,
        employee_id: employeeId,
        department_id: parseInt(deptId),
        designation,
      });
      showToast('Faculty member added successfully', 'success');
      setShowAddModal(false);
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setEmployeeId('');
      setDeptId('');
      setDesignation('');
      fetchFacultyAndDepts();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to add faculty member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this faculty member?')) return;
    try {
      await apiService.deleteFaculty(id);
      showToast('Faculty member removed', 'success');
      fetchFacultyAndDepts();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete faculty member', 'error');
    }
  };

  // Filter logic
  const filteredFaculty = faculty.filter((f) => {
    const matchesSearch = 
      f.user.name.toLowerCase().includes(search.toLowerCase()) || 
      f.employee_id.toLowerCase().includes(search.toLowerCase()) || 
      f.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === '' || f.department_id?.toString() === selectedDept;
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search faculty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary/30 border border-white/5 text-xs rounded-xl focus:outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-secondary/30 border border-white/5 text-xs rounded-xl text-foreground focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id.toString()}>{d.code}</option>
            ))}
          </select>
        </div>

        {/* Add Faculty Trigger */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty</span>
        </button>
      </div>

      {/* Faculty Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="px-6 py-4.5">Faculty Name</th>
              <th className="px-6 py-4.5">Employee ID</th>
              <th className="px-6 py-4.5">Email</th>
              <th className="px-6 py-4.5">Designation</th>
              <th className="px-6 py-4.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm text-foreground">
            {filteredFaculty.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-xs text-muted-foreground font-semibold">
                  No faculty members found.
                </td>
              </tr>
            ) : (
              filteredFaculty.map((f) => (
                <tr key={f.id} className="hover:bg-secondary/15 transition-colors">
                  <td className="px-6 py-4.5 font-bold">{f.user.name}</td>
                  <td className="px-6 py-4.5 text-xs font-mono font-bold text-indigo-400">{f.employee_id}</td>
                  <td className="px-6 py-4.5 text-xs text-muted-foreground font-semibold">{f.user.email}</td>
                  <td className="px-6 py-4.5 text-xs font-semibold">{f.designation || 'Lecturer'}</td>
                  <td className="px-6 py-4.5 text-right">
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="p-2 text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-950/40 rounded-xl transition-all inline-flex cursor-pointer"
                    >
                      <UserMinus className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-250">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-base font-bold text-foreground">Add Faculty Profile</span>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Login Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Department *</label>
                  <select
                    required
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none text-foreground"
                  >
                    <option value="">Select Dept</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Assistant Professor"
                    className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-secondary/50 border border-white/5 text-xs font-semibold rounded-xl hover:bg-secondary/70 transition-all text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-lg shadow-primary/10 transition-all"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Faculty</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminFaculty;
