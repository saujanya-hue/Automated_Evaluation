import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, UserMinus, Plus, Search, Loader2 } from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const { showToast } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [deptId, setDeptId] = useState('');
  const [classId, setClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStudentData = async () => {
    try {
      const studData = await apiService.getStudents();
      const deptData = await apiService.getDepartments();
      const classData = await apiService.getClasses();
      setStudents(studData);
      setDepartments(deptData);
      setClasses(classData);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load student profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !rollNumber || !deptId || !classId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createStudent({
        name,
        email,
        password,
        roll_number: rollNumber,
        department_id: parseInt(deptId),
        class_id: parseInt(classId),
      });
      showToast('Student enrolled successfully', 'success');
      setShowAddModal(false);
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setRollNumber('');
      setDeptId('');
      setClassId('');
      fetchStudentData();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to enroll student', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return;
    try {
      await apiService.deleteStudent(id);
      showToast('Student deleted', 'success');
      fetchStudentData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete student profile', 'error');
    }
  };

  // Filter
  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      s.user.name.toLowerCase().includes(search.toLowerCase()) || 
      s.roll_number.toLowerCase().includes(search.toLowerCase()) || 
      s.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === '' || s.class_id?.toString() === selectedClass;
    return matchesSearch && matchesClass;
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
              placeholder="Search student profiles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary/30 border border-white/5 text-xs rounded-xl focus:outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-secondary/30 border border-white/5 text-xs rounded-xl text-foreground focus:outline-none"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Add Student Trigger */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll Student</span>
        </button>
      </div>

      {/* Student Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="px-6 py-4.5">Student Name</th>
              <th className="px-6 py-4.5">Roll Number</th>
              <th className="px-6 py-4.5">Email</th>
              <th className="px-6 py-4.5">Class / section</th>
              <th className="px-6 py-4.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm text-foreground">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-xs text-muted-foreground font-semibold">
                  No students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/15 transition-colors">
                  <td className="px-6 py-4.5 font-bold">{s.user.name}</td>
                  <td className="px-6 py-4.5 text-xs font-mono font-bold text-indigo-400">{s.roll_number}</td>
                  <td className="px-6 py-4.5 text-xs text-muted-foreground font-semibold">{s.user.email}</td>
                  <td className="px-6 py-4.5 text-xs font-semibold">
                    {classes.find(c => c.id === s.class_id)?.name || 'Batch-A'}
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <button
                      onClick={() => handleDelete(s.id)}
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
              <span className="text-base font-bold text-foreground">Enroll New Student</span>
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
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
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
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Password *</label>
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
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Target Class/Batch *</label>
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
                  <span>Enroll Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminStudents;
