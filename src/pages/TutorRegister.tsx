// src/pages/TutorRegister.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GraduationCap, Mail, Lock, User, BookOpen, Loader2, AlertCircle, Eye, EyeOff, X } from 'lucide-react';
import { registerTutor } from '../api';
import { useAuth } from '../context/AuthContext';

export default function TutorRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', bio: '', subjects: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) { setError('Name, email, and password are required'); return; }
    setLoading(true); setError('');
    try {
      const data = await registerTutor(form);
      localStorage.setItem('noto_token', data.token);
      localStorage.setItem('noto_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('noto_auth_change'));
      navigate('/tutor', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ backgroundColor: 'var(--noto-background)' }}>
      {/* Back Button */}
      <Link to="/" className="absolute top-6 left-6 p-2 rounded-full transition-colors" 
        style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--noto-text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--noto-text-secondary)')}>
        <X size={20} />
      </Link>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <GraduationCap size={28} color="white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            Become a Tutor
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--noto-text-secondary)' }}>Create your tutor account on NOTO</p>
        </div>

        <div className="p-8 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'username', label: 'Full Name', icon: User, type: 'text', placeholder: 'Your full name' },
              { key: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'you@example.com' },
              { key: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: '••••••••' },
              { key: 'subjects', label: 'Subjects You Teach', icon: BookOpen, type: 'text', placeholder: 'e.g. Physics, Math, Chemistry' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>{f.label}</label>
                <div className="relative">
                  <f.icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
                  <input 
                    type={f.key === 'password' && showPassword ? 'text' : f.type} 
                    value={(form as any)[f.key]} 
                    onChange={e => setForm(d => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className={`w-full pl-10 ${f.key === 'password' ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl border text-sm outline-none`}
                    style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} 
                  />
                  {f.key === 'password' && (
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 focus:outline-none"
                      style={{ color: 'var(--noto-text-secondary)' }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Short Bio (optional)</label>
              <textarea rows={2} value={form.bio} onChange={e => setForm(d => ({ ...d, bio: e.target.value }))}
                placeholder="Tell students about yourself..."
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
              Create Tutor Account
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>Already have an account? </span>
            <Link to="/signin" className="text-xs font-semibold" style={{ color: '#6366f1' }}>Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
