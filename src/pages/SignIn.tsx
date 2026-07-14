import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getRedirectPath = (role?: string) => {
    if (role === 'admin') return '/admin';
    if (role === 'intern') return '/intern';
    if (role === 'tutor') return '/tutor';
    if (role === 'student') return '/my-tutor';
    return '/';
  };

  if (user) return <Navigate to={getRedirectPath(user.role)} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(identifier, password);
      navigate(getRedirectPath(loggedUser.role), { replace: true });
    } catch (err: any) {
      setError(err.message ?? `Sign in failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(circle at top right, #6366f115, transparent 400px), var(--noto-bg)',
      }}
    >
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-primary)' }}>
          <img src="/logo.png" alt="NOTO Logo" className="w-8 h-8 object-contain" />
          NOTO
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-3xl border shadow-xl relative overflow-hidden"
        style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
      >
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            Welcome back
          </h2>
          <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            Sign in to access your dashboard
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 20 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ backgroundColor: '#ef444415', color: '#ef4444' }}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>
              Email or Username
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or username"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--noto-surface-alt)',
                  borderColor: 'var(--noto-border)',
                  color: 'var(--noto-text-primary)'
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm border outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--noto-surface-alt)',
                  borderColor: 'var(--noto-border)',
                  color: 'var(--noto-text-primary)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[var(--noto-text-primary)]"
                style={{ color: 'var(--noto-text-secondary)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-6 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold transition-colors hover:underline" style={{ color: 'var(--noto-primary)' }}>
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
