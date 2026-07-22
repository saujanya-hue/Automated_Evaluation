import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const TopNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);

  // Generate breadcrumbs from route path
  const paths = location.pathname.split('/').filter(Boolean);
  
  const notifications = [
    { id: 1, title: 'AI evaluation complete', body: 'OOP midterm evaluations are complete.', time: '5m ago' },
    { id: 2, title: 'Complaint resolved', body: 'Re-evaluation score updated for John Doe.', time: '2h ago' },
    { id: 3, title: 'New Exam Published', body: 'Results for Data Structures are now active.', time: '1d ago' },
  ];

  return (
    <header className="h-20 bg-background/50 border-b border-border backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      {/* Left: Breadcrumbs & Heading */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Home</span>
          {paths.map((p, i) => (
            <React.Fragment key={p}>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span>{p.replace('-', ' ')}</span>
            </React.Fragment>
          ))}
        </div>
        <h2 className="text-xl font-extrabold text-foreground capitalize tracking-tight">
          {paths[paths.length - 1]?.replace('-', ' ') || 'Dashboard'}
        </h2>
      </div>

      {/* Right: Search, Notifications & User */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search records, students..."
            className="w-full pl-10 pr-4 py-2 bg-secondary/30 hover:bg-secondary/40 border border-white/5 focus:border-primary/50 text-xs rounded-xl focus:outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
          />
        </div>

        {/* Notifications Panel */}
        <div className="relative">
          <button 
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2.5 rounded-xl hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background animate-pulse" />
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-card border border-border shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-250">
              <div className="flex justify-between items-center pb-2.5 border-b border-border mb-3">
                <span className="text-xs font-bold text-foreground">In-App Notifications</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/25 text-indigo-300 font-bold">New</span>
              </div>
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg hover:bg-secondary/40 transition-colors flex flex-col gap-1 cursor-pointer">
                    <span className="text-xs font-bold text-foreground">{n.title}</span>
                    <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{n.body}</span>
                    <span className="text-[9px] text-muted-foreground/60 font-semibold self-end">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="flex items-center gap-3 border-l border-border pl-6">
          <div className="w-10 h-10 rounded-full bg-indigo-950 border border-primary/25 flex items-center justify-center font-bold text-indigo-300">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-sm font-bold text-foreground">{user?.name}</span>
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
