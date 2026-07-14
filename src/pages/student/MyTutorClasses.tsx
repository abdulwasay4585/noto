// src/pages/student/MyTutorClasses.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Radio, ExternalLink, Calendar, Clock, Loader2 } from 'lucide-react';
import { fetchMyClasses, pingStudentOnline } from '../../api';

const PLATFORM_COLORS: Record<string, string> = { zoom: '#2D8CFF', google_meet: '#00897B', teams: '#6264A7', google_classroom: '#4285F4' };
const PLATFORM_ICONS: Record<string, string> = { zoom: '🎥', google_meet: '📹', teams: '💼', google_classroom: '🎓' };
const PLATFORM_LABELS: Record<string, string> = { zoom: 'Zoom', google_meet: 'Google Meet', teams: 'MS Teams', google_classroom: 'Google Classroom' };

function formatDT(iso: string) {
  return new Date(iso).toLocaleString('en-PK', { dateStyle: 'full', timeStyle: 'short' });
}

function getCountdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Starting now!';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `in ${m} minutes`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h} hours`;
  return `in ${Math.floor(h / 24)} days`;
}

export default function MyTutorClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pingStudentOnline().catch(() => {});
    fetchMyClasses().then(setClasses).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Live Classes</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Upcoming live classes from your tutors. Click "Join" to enter.</p>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div>
        : classes.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--noto-text-secondary)' }}>
            <Radio size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No upcoming classes scheduled.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((cls, i) => {
              const color = PLATFORM_COLORS[cls.platform] || '#6366f1';
              const icon = PLATFORM_ICONS[cls.platform] || '📡';
              const label = PLATFORM_LABELS[cls.platform] || cls.platform;
              const isNow = new Date(cls.scheduled_at).getTime() - Date.now() < 15 * 60 * 1000;
              return (
                <motion.div key={cls.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl border overflow-hidden relative"
                  style={{ backgroundColor: 'var(--noto-surface)', borderColor: isNow ? color : 'var(--noto-border)' }}>
                  {isNow && (
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: color }} />
                  )}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: color + '15' }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{cls.title}</h3>
                        {isNow && (
                          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: color + '20', color }}>
                            🔴 Live Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs mb-2" style={{ color: 'var(--noto-text-secondary)' }}>
                        by <strong style={{ color: 'var(--noto-text-primary)' }}>{cls.tutor_name}</strong>
                        {cls.course_title && <> · {cls.course_title}</>}
                      </p>
                      {cls.description && <p className="text-xs mb-3" style={{ color: 'var(--noto-text-secondary)' }}>{cls.description}</p>}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                          <Calendar size={11} /> {formatDT(cls.scheduled_at)}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                          <Clock size={11} /> {cls.duration_minutes} min
                        </span>
                        <span className="text-xs font-semibold" style={{ color }}>⏰ {getCountdown(cls.scheduled_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: color + '15', color }}>{label}</span>
                    <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                      style={{ backgroundColor: color }}>
                      Join Class <ExternalLink size={13} />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
}
