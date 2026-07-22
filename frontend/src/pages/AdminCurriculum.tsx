import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Plus, Loader2, Link, Layers, BookOpen, Building2 } from 'lucide-react';

export const AdminCurriculum: React.FC = () => {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'depts' | 'classes' | 'subjects' | 'assigns'>('depts');
  const [loading, setLoading] = useState(true);

  // Data states
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);

  // Input states
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [className, setClassName] = useState('');
  const [classDeptId, setClassDeptId] = useState('');
  const [classBatch, setClassBatch] = useState('2026');
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subDeptId, setSubDeptId] = useState('');
  
  const [assFaculty, setAssFaculty] = useState('');
  const [assSubject, setAssSubject] = useState('');
  const [assClass, setAssClass] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const depts = await apiService.getDepartments();
      const clss = await apiService.getClasses();
      const subs = await apiService.getSubjects();
      const assns = await apiService.getAssignments();
      const facs = await apiService.getFaculty();
      
      setDepartments(depts);
      setClasses(clss);
      setSubjects(subs);
      setAssignments(assns);
      setFaculty(facs);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load curriculum databases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    setSubmitting(true);
    try {
      await apiService.createDepartment({ name: deptName, code: deptCode });
      showToast('Department created successfully', 'success');
      setDeptName('');
      setDeptCode('');
      loadData();
    } catch (err: any) {
      showToast('Failed to create department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !classDeptId || !classBatch) return;
    setSubmitting(true);
    try {
      await apiService.createClass({
        name: className,
        department_id: parseInt(classDeptId),
        batch_year: parseInt(classBatch)
      });
      showToast('Class created successfully', 'success');
      setClassName('');
      loadData();
    } catch (err: any) {
      showToast('Failed to create class', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subCode || !subDeptId) return;
    setSubmitting(true);
    try {
      await apiService.createSubject({
        name: subName,
        code: subCode,
        department_id: parseInt(subDeptId)
      });
      showToast('Subject catalog added', 'success');
      setSubName('');
      setSubCode('');
      loadData();
    } catch (err: any) {
      showToast('Failed to create subject', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assFaculty || !assSubject || !assClass) return;
    setSubmitting(true);
    try {
      await apiService.createAssignment({
        faculty_id: parseInt(assFaculty),
        subject_id: parseInt(assSubject),
        class_id: parseInt(assClass)
      });
      showToast('Faculty assignment registered', 'success');
      loadData();
    } catch (err: any) {
      showToast('Failed to link faculty assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type: 'dept' | 'class' | 'sub' | 'assign', id: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      if (type === 'dept') await apiService.deleteDepartment(id);
      else if (type === 'class') await apiService.deleteClass(id);
      else if (type === 'sub') await apiService.deleteSubject(id);
      else await apiService.deleteAssignment(id);
      showToast(`${type.toUpperCase()} removed successfully.`, 'success');
      loadData();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Tabs Header */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('depts')}
          className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'depts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'classes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Classes
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'subjects' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Subjects
        </button>
        <button
          onClick={() => setActiveTab('assigns')}
          className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'assigns' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Faculty Assignment
        </button>
      </div>

      {/* TABS CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Input Form Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5">
          {activeTab === 'depts' && (
            <>
              <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4.5 h-4.5 text-primary" />
                <span>Create Department</span>
              </h3>
              <form onSubmit={handleCreateDept} className="space-y-3">
                <input
                  type="text"
                  placeholder="Department Name (e.g. Mechanical)"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                />
                <input
                  type="text"
                  placeholder="Dept Code (e.g. ME)"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                />
                <button type="submit" disabled={submitting} className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/10">
                  Save Department
                </button>
              </form>
            </>
          )}

          {activeTab === 'classes' && (
            <>
              <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Layers className="w-4.5 h-4.5 text-primary" />
                <span>Add Class Section</span>
              </h3>
              <form onSubmit={handleCreateClass} className="space-y-3">
                <input
                  type="text"
                  placeholder="Class Name (e.g. CSE-2026-A)"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                />
                <select
                  value={classDeptId}
                  onChange={(e) => setClassDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl text-foreground focus:outline-none"
                >
                  <option value="">Select Dept</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Batch Year (e.g. 2026)"
                  value={classBatch}
                  onChange={(e) => setClassBatch(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none text-foreground"
                />
                <button type="submit" disabled={submitting} className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/10">
                  Save Class
                </button>
              </form>
            </>
          )}

          {activeTab === 'subjects' && (
            <>
              <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5 text-primary" />
                <span>Add Subject Course</span>
              </h3>
              <form onSubmit={handleCreateSubject} className="space-y-3">
                <input
                  type="text"
                  placeholder="Subject Name (e.g. Compiler Design)"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                />
                <input
                  type="text"
                  placeholder="Course Code (e.g. CS401)"
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
                />
                <select
                  value={subDeptId}
                  onChange={(e) => setSubDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl text-foreground focus:outline-none"
                >
                  <option value="">Select Dept</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button type="submit" disabled={submitting} className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/10">
                  Save Subject
                </button>
              </form>
            </>
          )}

          {activeTab === 'assigns' && (
            <>
              <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Link className="w-4.5 h-4.5 text-primary" />
                <span>Assign Faculty to Class</span>
              </h3>
              <form onSubmit={handleAssignFaculty} className="space-y-3">
                <select
                  value={assFaculty}
                  onChange={(e) => setAssFaculty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl text-foreground focus:outline-none"
                >
                  <option value="">Select Faculty</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>{f.user.name}</option>
                  ))}
                </select>
                <select
                  value={assSubject}
                  onChange={(e) => setAssSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl text-foreground focus:outline-none"
                >
                  <option value="">Select Course</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
                <select
                  value={assClass}
                  onChange={(e) => setAssClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-secondary/40 border border-white/5 text-xs rounded-xl text-foreground focus:outline-none"
                >
                  <option value="">Select Target Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button type="submit" disabled={submitting} className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/10">
                  Register Link
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right: Data Listing Grid */}
        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden shadow-2xl">
          {activeTab === 'depts' && (
            <table className="w-full text-left">
              <thead className="bg-secondary/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-secondary/15">
                    <td className="px-6 py-3 font-bold">{d.name}</td>
                    <td className="px-6 py-3 font-mono text-indigo-400 font-semibold">{d.code}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleDelete('dept', d.id)} className="p-1.5 text-rose-400 hover:bg-rose-955 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'classes' && (
            <table className="w-full text-left">
              <thead className="bg-secondary/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-4">Section Name</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/15">
                    <td className="px-6 py-3 font-bold">{c.name}</td>
                    <td className="px-6 py-3 font-semibold">{c.batch_year}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleDelete('class', c.id)} className="p-1.5 text-rose-400 hover:bg-rose-955 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'subjects' && (
            <table className="w-full text-left">
              <thead className="bg-secondary/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-4">Course Name</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/15">
                    <td className="px-6 py-3 font-bold">{s.name}</td>
                    <td className="px-6 py-3 font-mono text-indigo-400 font-semibold">{s.code}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleDelete('sub', s.id)} className="p-1.5 text-rose-400 hover:bg-rose-955 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'assigns' && (
            <table className="w-full text-left">
              <thead className="bg-secondary/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-4">Faculty Member</th>
                  <th className="px-6 py-4">Assigned Course</th>
                  <th className="px-6 py-4">Target Class</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-secondary/15">
                    <td className="px-6 py-3 font-bold">{a.faculty?.name}</td>
                    <td className="px-6 py-3 text-indigo-300 font-semibold">{a.subject?.name} ({a.subject?.code})</td>
                    <td className="px-6 py-3 font-bold text-muted-foreground">{a.student_class?.name}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleDelete('assign', a.id)} className="p-1.5 text-rose-400 hover:bg-rose-955 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminCurriculum;
