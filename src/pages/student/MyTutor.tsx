// src/pages/student/MyTutor.tsx - Student hub: announcements + overview
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bell, BookOpen, Radio, CreditCard, GraduationCap, Loader2, ExternalLink } from 'lucide-react';
import { fetchMyAnnouncements, fetchMyTutors, fetchMyClasses, pingStudentOnline } from '../../api';

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

const PLATFORM_COLORS: Record<string, string> = { zoom: '#2D8CFF', google_meet: '#00897B', teams: '#6264A7', google_classroom: '#4285F4' };
const PLATFORM_ICONS: Record<string, string> = { zoom: '🎥', google_meet: '📹', teams: '💼', google_classroom: '🎓' };

export default function MyTutor() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pingStudentOnline().catch(() => {});
    Promise.all([fetchMyAnnouncements(), fetchMyTutors(), fetchMyClasses()])
      .then(([a, t, c]) => { setAnnouncements(a); setTutors(t); setClasses(c.slice(0, 3)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={16} style={{ color: '#6366f1' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6366f1' }}>My Learning</span>
        </div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>My Tutor</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--noto-text-secondary)' }}>Your courses, live classes, and updates from your tutors.</p>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'My Courses', path: '/my-tutor/courses', icon: BookOpen, color: '#6366f1' },
          { label: 'Live Classes', path: '/my-tutor/classes', icon: Radio, color: '#8b5cf6' },
          { label: 'Payments', path: '/my-tutor/payment', icon: CreditCard, color: '#10b981' },
          { label: 'Announcements', path: '/my-tutor/announcements', icon: Bell, color: '#f59e0b' },
        ].map(item => (
          <Link key={item.path} to={item.path}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.color + '15' }}>
              <item.icon size={18} style={{ color: item.color }} />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--noto-text-primary)' }}>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* My Tutors */}
      {tutors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--noto-text-secondary)' }}>My Tutors</h2>
          <div className="flex flex-wrap gap-3">
            {tutors.map(t => (
              <div key={t.tutor_id} className="flex items-center gap-3 px-4 py-3 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {t.tutor_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{t.tutor_name}</p>
                  <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>{t.subjects || 'General'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Classes */}
      {classes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>Upcoming Classes</h2>
            <Link to="/my-tutor/classes" className="text-xs font-semibold" style={{ color: '#6366f1' }}>View all →</Link>
          </div>
          <div className="space-y-2">
            {classes.map(cls => (
              <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                <span className="text-xl">{PLATFORM_ICONS[cls.platform] || '📡'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--noto-text-primary)' }}>{cls.title}</p>
                  <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                    {new Date(cls.scheduled_at).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })} • {cls.tutor_name}
                  </p>
                </div>
                <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shrink-0"
                  style={{ backgroundColor: PLATFORM_COLORS[cls.platform] || '#6366f1' }}>
                  Join <ExternalLink size={10} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Announcements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>Latest Updates</h2>
          <Link to="/my-tutor/announcements" className="text-xs font-semibold" style={{ color: '#6366f1' }}>View all →</Link>
        </div>
        {announcements.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--noto-text-secondary)' }}>No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.slice(0, 5).map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex gap-3 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                  <Bell size={13} color="white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{a.title}</p>
                    {a.course_title && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#6366f115', color: '#6366f1' }}>{a.course_title}</span>}
                  </div>
                  {a.body && <p className="text-xs mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>{a.body}</p>}
                  <p className="text-xs mt-1" style={{ color: 'var(--noto-text-secondary)' }}>{a.tutor_name} • {timeAgo(a.created_at)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
