import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { KeyRound, Mail, GraduationCap, Loader2, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, showToast } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await apiService.login(email, password);
      login(data.access_token, data.role, data.name, email);
      
      // Role-based redirect
      if (data.role === 'admin') navigate('/admin/dashboard');
      else if (data.role === 'faculty') navigate('/faculty/dashboard');
      else navigate('/student/dashboard');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await apiService.seedDatabase();
      showToast(res.message || 'Demo data loaded successfully!', 'success');
      // Auto fill admin credentials
      setEmail('admin@university.edu');
      setPassword('admin123');
    } catch (err: any) {
      console.error(err);
      showToast('Database seeding failed. Ensure backend is running.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const fillCredentials = (role: 'admin' | 'faculty' | 'student') => {
    if (role === 'admin') {
      setEmail('admin@university.edu');
      setPassword('admin123');
    } else if (role === 'faculty') {
      setEmail('faculty@university.edu');
      setPassword('faculty123');
    } else {
      setEmail('student@university.edu');
      setPassword('student123');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background text-foreground font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md p-4">
        <div className="glass-panel rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
          {/* Brand Header */}
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center shadow-xl shadow-primary/25 mb-2">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
              Aegis Evaluate
            </h1>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              University Automated Script Grading Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full pl-11 pr-4 py-3 bg-secondary/40 border border-white/5 focus:border-primary/50 text-sm rounded-xl focus:outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-secondary/40 border border-white/5 focus:border-primary/50 text-sm rounded-xl focus:outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-xs font-semibold px-1">
              <label className="flex items-center gap-2 cursor-pointer hover:text-foreground text-muted-foreground transition-all">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/10 bg-secondary/40 text-primary focus:ring-primary/45 w-4 h-4 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-primary hover:text-indigo-400 transition-colors">Forgot password?</a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 text-white rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="border-t border-border pt-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Demo Credentials</span>
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-1 rounded-md transition-all active:scale-[0.98]"
              >
                {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>{seeding ? 'Seeding...' : 'Setup Demo'}</span>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="py-2 bg-secondary/30 hover:bg-secondary/50 border border-white/5 hover:border-white/10 text-[11px] rounded-lg text-muted-foreground hover:text-foreground font-semibold transition-all text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('faculty')}
                className="py-2 bg-secondary/30 hover:bg-secondary/50 border border-white/5 hover:border-white/10 text-[11px] rounded-lg text-muted-foreground hover:text-foreground font-semibold transition-all text-center"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('student')}
                className="py-2 bg-secondary/30 hover:bg-secondary/50 border border-white/5 hover:border-white/10 text-[11px] rounded-lg text-muted-foreground hover:text-foreground font-semibold transition-all text-center"
              >
                Student
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
