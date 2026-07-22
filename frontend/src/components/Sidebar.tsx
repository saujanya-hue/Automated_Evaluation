import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, Building2, 
  Layers, UserPlus, ClipboardList, Settings, LogOut, Sun, Moon,
  FileUp, BarChart3, MessageSquareWarning, Award, Download
} from 'lucide-react';

interface SidebarProps {
  role: 'admin' | 'faculty' | 'student';
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const { logout, toggleDarkMode, darkMode, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/faculty', label: 'Faculty Management', icon: Users },
          { to: '/admin/students', label: 'Student Management', icon: GraduationCap },
          { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
          { to: '/admin/departments', label: 'Departments', icon: Building2 },
          { to: '/admin/classes', label: 'Classes', icon: Layers },
          { to: '/admin/assign-faculty', label: 'Assign Faculty', icon: UserPlus },
          { to: '/admin/exams', label: 'Exams Overview', icon: ClipboardList },
          { to: '/admin/settings', label: 'Settings', icon: Settings },
        ];
      case 'faculty':
        return [
          { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/faculty/subjects', label: 'My Subjects & Classes', icon: BookOpen },
          { to: '/faculty/create-exam', label: 'Create Exam', icon: ClipboardList },
          { to: '/faculty/upload', label: 'Upload Sheets', icon: FileUp },
          { to: '/faculty/progress', label: 'AI Timeline', icon: Layers },
          { to: '/faculty/results', label: 'Results Matrix', icon: Award },
          { to: '/faculty/analytics', label: 'Exam Analytics', icon: BarChart3 },
          { to: '/faculty/complaints', label: 'Complaints', icon: MessageSquareWarning },
        ];
      case 'student':
        return [
          { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/student/exams', label: 'My Exams', icon: ClipboardList },
          { to: '/student/results', label: 'Results & OCR', icon: Award },
          { to: '/student/downloads', label: 'Downloads', icon: Download },
          { to: '/student/complaints', label: 'Complaint Desk', icon: MessageSquareWarning },
        ];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-72 bg-card/60 border-r border-border backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-xl font-bold text-white">🎓</span>
          </div>
          <div>
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-foreground via-indigo-200 to-indigo-400 leading-tight">
              Aegis Evaluate
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest font-bold uppercase">AI PORTAL</p>
          </div>
        </div>

        {/* User Card */}
        <div className="mx-4 my-6 p-4 rounded-2xl bg-secondary/30 border border-white/5 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground font-semibold">Logged in as</p>
          <p className="text-sm font-bold truncate text-foreground">{user?.name}</p>
          <div className="mt-2 inline-flex self-start px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/20 text-indigo-300 border border-primary/30">
            {role}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1.5 overflow-y-auto max-h-[50vh]">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all group ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                  }`
                }
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-950/40 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
