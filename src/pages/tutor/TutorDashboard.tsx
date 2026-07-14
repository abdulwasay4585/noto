// src/pages/tutor/TutorDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, BookOpen, Video, Radio, CheckCircle, XCircle, GraduationCap, TrendingUp } from 'lucide-react';
import { fetchTutorDashboard } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function TutorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutorDashboard().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Students', value: stats.students, icon: Users, color: '#6366f1', bg: '#6366f110' },
    { label: 'Courses', value: stats.courses, icon: BookOpen, color: '#10b981', bg: '#10b98110' },
    { label: 'Videos', value: stats.videos, icon: Video, color: '#f59e0b', bg: '#f59e0b10' },
    { label: 'Upcoming Classes', value: stats.upcoming_classes, icon: Radio, color: '#8b5cf6', bg: '#8b5cf610' },
    { label: 'Paid Fees', value: stats.paid, icon: CheckCircle, color: '#10b981', bg: '#10b98110' },
    { label: 'Unpaid Fees', value: stats.unpaid, icon: XCircle, color: '#ef4444', bg: '#ef444410' },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={18} style={{ color: '#6366f1' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6366f1' }}>Tutor Panel</span>
        </div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          Welcome back, {user?.username} 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>Here's what's happening with your students today.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--noto-surface)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-5 rounded-2xl border"
              style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                  <card.icon size={18} style={{ color: card.color }} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', color: card.color }}>
                {card.value}
              </div>
              <div className="text-xs font-medium" style={{ color: 'var(--noto-text-secondary)' }}>{card.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 p-6 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: '#6366f1' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>Quick Links</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Student', path: '/tutor/students', icon: Users, color: '#6366f1' },
            { label: 'New Course', path: '/tutor/courses', icon: BookOpen, color: '#10b981' },
            { label: 'Schedule Class', path: '/tutor/classes', icon: Radio, color: '#8b5cf6' },
            { label: 'Announcement', path: '/tutor/announcements', icon: GraduationCap, color: '#f59e0b' },
          ].map(link => (
            <a key={link.path} href={link.path}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-150 hover:scale-105"
              style={{ borderColor: 'var(--noto-border)', backgroundColor: 'var(--noto-surface-alt)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: link.color + '15' }}>
                <link.icon size={18} style={{ color: link.color }} />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--noto-text-primary)' }}>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
