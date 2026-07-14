// src/pages/student/MyTutorAnnouncements.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Loader2 } from 'lucide-react';
import { fetchMyAnnouncements, pingStudentOnline } from '../../api';

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function MyTutorAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pingStudentOnline().catch(() => {});
    fetchMyAnnouncements().then(setAnnouncements).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Announcements</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Updates and notifications from your tutors.</p>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div>
        : announcements.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--noto-text-secondary)' }}>
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex gap-4 p-5 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                  <Bell size={16} color="white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{a.title}</h3>
                    <span className="text-xs shrink-0" style={{ color: 'var(--noto-text-secondary)' }}>{timeAgo(a.created_at)}</span>
                  </div>
                  {a.body && <p className="text-sm mb-2" style={{ color: 'var(--noto-text-secondary)' }}>{a.body}</p>}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--noto-text-secondary)' }}>from <strong style={{ color: 'var(--noto-text-primary)' }}>{a.tutor_name}</strong></span>
                    {a.course_title && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#6366f115', color: '#6366f1' }}>{a.course_title}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}
