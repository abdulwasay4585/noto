import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock, User, AlertCircle, Mail, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!formData.termsAccepted) {
      setError("You must accept the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
        email: formData.email,
        password: formData.password,
        terms_accepted: formData.termsAccepted
      });
      navigate(getRedirectPath(loggedUser.role), { replace: true });
    } catch (err: any) {
      setError(err.message ?? `Sign up failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'radial-gradient(circle at top right, #6366f115, transparent 400px), var(--noto-bg)',
      }}
    >
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-primary)' }}>
          <img src="/logo.png" alt="NOTOO Logo" className="w-8 h-8 object-contain" />
          NOTOO
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl p-8 rounded-3xl border shadow-xl relative overflow-hidden my-8"
        style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
      >
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            Create an account
          </h2>
          <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            Join NOTOO and start learning today
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>
                First Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
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
                Last Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--noto-surface-alt)',
                    borderColor: 'var(--noto-border)',
                    color: 'var(--noto-text-primary)'
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
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
              Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
              <input
                type="tel"
                name="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--noto-surface-alt)',
                  borderColor: 'var(--noto-border)',
                  color: 'var(--noto-text-primary)'
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
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

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm border outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--noto-surface-alt)',
                    borderColor: 'var(--noto-border)',
                    color: 'var(--noto-text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[var(--noto-text-primary)]"
                  style={{ color: 'var(--noto-text-secondary)' }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="peer appearance-none w-5 h-5 border-2 rounded-md transition-all cursor-pointer"
                  style={{ borderColor: 'var(--noto-primary)' }}
                />
                <div className="absolute inset-0 rounded-md scale-0 peer-checked:scale-100 transition-transform pointer-events-none flex items-center justify-center" style={{ backgroundColor: 'var(--noto-primary)' }}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="text-sm select-none" style={{ color: 'var(--noto-text-secondary)' }}>
                I accept the <a href="/terms" className="font-semibold hover:underline" style={{ color: 'var(--noto-primary)' }} target="_blank">terms and conditions</a> and <a href="/privacy" className="font-semibold hover:underline" style={{ color: 'var(--noto-primary)' }} target="_blank">privacy policy</a>.
              </span>
            </label>
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
                Creating account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/signin" className="font-semibold transition-colors hover:underline" style={{ color: 'var(--noto-primary)' }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
