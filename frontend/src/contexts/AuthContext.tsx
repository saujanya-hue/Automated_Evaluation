import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  token: string;
  role: 'admin' | 'faculty' | 'student';
  name: string;
  email: string;
}

interface AuthContextType {
  user: UserSession | null;
  login: (token: string, role: 'admin' | 'faculty' | 'student', name: string, email: string) => void;
  logout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Load session & theme preference
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role') as any;
    const savedName = localStorage.getItem('name');
    const savedEmail = localStorage.getItem('email');
    const savedTheme = localStorage.getItem('theme') !== 'light'; // default dark

    if (savedToken && savedRole && savedName && savedEmail) {
      setUser({
        token: savedToken,
        role: savedRole,
        name: savedName,
        email: savedEmail
      });
    }

    setDarkMode(savedTheme);
    if (savedTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const login = (token: string, role: 'admin' | 'faculty' | 'student', name: string, email: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
    localStorage.setItem('email', email);
    
    setUser({ token, role, name, email });
    showToast(`Logged in successfully as ${name}`, 'success');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, darkMode, toggleDarkMode, showToast, toast }}>
      {children}
      {/* Toast Notification HUD */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 text-sm font-semibold transition-all ${
            toast.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' 
              : toast.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/30 text-rose-300'
              : 'bg-indigo-950/80 border-indigo-500/30 text-indigo-300'
          }`}>
            <span>
              {toast.type === 'success' ? '✨' : toast.type === 'error' ? '🚨' : 'ℹ️'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
