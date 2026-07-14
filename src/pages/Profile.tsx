import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin': return { label: 'Administrator', color: '#ef4444' };
      case 'tutor': return { label: 'Tutor / Instructor', color: '#8b5cf6' };
      case 'intern': return { label: 'Intern', color: '#f59e0b' };
      default: return { label: 'Student', color: '#10b981' };
    }
  };

  const badge = getRoleBadge(user.role);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
      >
        <div className="h-32 w-full relative" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {/* Header background */}
        </div>
        
        <div className="px-8 pb-8">
          <div className="flex justify-between items-end -mt-12 mb-6 relative z-10">
            <div 
              className="w-24 h-24 rounded-full border-4 flex items-center justify-center text-4xl font-bold uppercase shadow-lg"
              style={{ 
                backgroundColor: 'var(--noto-surface-alt)', 
                borderColor: 'var(--noto-surface)',
                color: 'var(--noto-primary)'
              }}
            >
              {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
            </div>
            <span 
              className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: badge.color }}
            >
              {badge.label}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : (user.username || user.email)}
              </h1>
              <p className="text-sm font-medium" style={{ color: 'var(--noto-text-secondary)' }}>
                Manage your personal information and account details.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ borderColor: 'var(--noto-border)', backgroundColor: 'var(--noto-surface-alt)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6366f115', color: '#6366f1' }}>
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Full Name</p>
                  <p className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>
                    {user.first_name ? `${user.first_name} ${user.last_name}` : 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ borderColor: 'var(--noto-border)', backgroundColor: 'var(--noto-surface-alt)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#8b5cf615', color: '#8b5cf6' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Email Address</p>
                  <p className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ borderColor: 'var(--noto-border)', backgroundColor: 'var(--noto-surface-alt)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Phone Number</p>
                  <p className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{user.phone_number || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ borderColor: 'var(--noto-border)', backgroundColor: 'var(--noto-surface-alt)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Account Role</p>
                  <p className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{badge.label}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
