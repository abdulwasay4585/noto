import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('noto_token', data.token);
      localStorage.setItem('noto_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('noto_auth_change'));
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md p-8 rounded-2xl border shadow-2xl relative overflow-hidden"
              style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                style={{ color: 'var(--noto-text-secondary)' }}
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-md rotate-45 border flex items-center justify-center"
                    style={{ backgroundColor: 'var(--noto-accent)', borderColor: 'var(--noto-border)' }}>
                    <div className="w-3 h-3 rounded-sm bg-black dark:bg-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                  {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-sm mt-2" style={{ color: 'var(--noto-text-secondary)' }}>
                  {isLogin ? 'Enter your details to access your dashboard' : 'Join NOTO to save study materials and progress'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-lg text-sm border flex items-center justify-center"
                  style={{ backgroundColor: 'var(--noto-danger)', color: '#fff', borderColor: 'rgba(0,0,0,0.1)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--noto-text-primary)' }}>Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                      style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
                      placeholder="you@school.edu"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--noto-text-primary)' }}>Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                      style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 mt-2 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--noto-primary)', color: '#ffffff' }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>
              </form>

              <div className="mt-6 text-center text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-semibold hover:underline"
                  style={{ color: 'var(--noto-primary)' }}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
