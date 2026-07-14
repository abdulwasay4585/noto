// src/pages/tutor/TutorClasses.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Radio, Plus, Trash2, Loader2, X, AlertCircle, ExternalLink, Clock, Calendar } from 'lucide-react';
import { fetchTutorClasses, createTutorClass, deleteTutorClass, fetchTutorCourses } from '../../api';

const PLATFORMS = [
  { id: 'zoom', label: 'Zoom', color: '#2D8CFF', icon: '🎥' },
  { id: 'google_meet', label: 'Google Meet', color: '#00897B', icon: '📹' },
  { id: 'teams', label: 'MS Teams', color: '#6264A7', icon: '💼' },
  { id: 'google_classroom', label: 'Google Classroom', color: '#4285F4', icon: '🎓' },
];

function formatDT(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
}

function isUpcoming(iso: string) { return new Date(iso) > new Date(); }

export default function TutorClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', platform: 'zoom', meeting_link: '', scheduled_at: '', duration_minutes: '60', course_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => Promise.all([fetchTutorClasses(), fetchTutorCourses()]).then(([cl, co]) => { setClasses(cl); setCourses(co); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.meeting_link || !form.scheduled_at) { setError('Title, meeting link, and date/time required'); return; }
    setSaving(true); setError('');
    try {
      await createTutorClass({ ...form, duration_minutes: Number(form.duration_minutes) || 60, course_id: form.course_id || null });
      await load();
      setModalOpen(false);
      setForm({ title: '', description: '', platform: 'zoom', meeting_link: '', scheduled_at: '', duration_minutes: '60', course_id: '' });
    } catch { setError('Failed to schedule class'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Cancel this class?')) return;
    await deleteTutorClass(id);
    setClasses(c => c.filter(x => x.id !== id));
  };

  const upcoming = classes.filter(c => isUpcoming(c.scheduled_at));
  const past = classes.filter(c => !isUpcoming(c.scheduled_at));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Live Classes</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Schedule live classes via Zoom, Meet, Teams, or Classroom.</p>
        </div>
        <button onClick={() => { setError(''); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
          <Plus size={15} /> Schedule Class
        </button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div> : (
        <>
          {upcoming.length > 0 && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--noto-text-secondary)' }}>Upcoming</h2>
              <div className="space-y-3 mb-8">
                {upcoming.map((cls, i) => {
                  const platform = PLATFORMS.find(p => p.id === cls.platform) || PLATFORMS[0];
                  return (
                    <motion.div key={cls.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: platform.color + '20' }}>
                        {platform.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{cls.title}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--noto-text-secondary)' }}><Calendar size={11} /> {formatDT(cls.scheduled_at)}</span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--noto-text-secondary)' }}><Clock size={11} /> {cls.duration_minutes} min</span>
                          {cls.course_title && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#6366f115', color: '#6366f1' }}>{cls.course_title}</span>}
                        </div>
                      </div>
                      <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shrink-0"
                        style={{ backgroundColor: platform.color }}>
                        Join <ExternalLink size={11} />
                      </a>
                      <button onClick={() => handleDelete(cls.id)} className="p-1.5 rounded-lg shrink-0" style={{ color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--noto-text-secondary)' }}>Past Classes</h2>
              <div className="space-y-2">
                {past.map(cls => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl opacity-60" style={{ backgroundColor: 'var(--noto-surface)', border: `1px solid var(--noto-border)` }}>
                    <span className="text-sm">{PLATFORMS.find(p => p.id === cls.platform)?.icon}</span>
                    <span className="text-sm flex-1" style={{ color: 'var(--noto-text-primary)' }}>{cls.title}</span>
                    <span className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>{formatDT(cls.scheduled_at)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {classes.length === 0 && (
            <div className="text-center py-20 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
              <Radio size={40} className="mx-auto mb-3 opacity-30" /> No classes scheduled yet.
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 rounded-2xl border overflow-y-auto max-h-[90vh]" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Schedule Live Class</h2>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--noto-text-secondary)' }}><X size={18} /></button>
            </div>
            {error && <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}><AlertCircle size={14} /> {error}</div>}

            {/* Platform Selection */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--noto-text-secondary)' }}>Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setForm(f => ({ ...f, platform: p.id }))}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                    style={{
                      backgroundColor: form.platform === p.id ? p.color + '20' : 'var(--noto-surface-alt)',
                      borderColor: form.platform === p.id ? p.color : 'var(--noto-border)',
                      color: form.platform === p.id ? p.color : 'var(--noto-text-secondary)',
                    }}>
                    <span>{p.icon}</span> {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {[
                { key: 'title', label: 'Class Title', placeholder: 'e.g. Topic 3: Waves', type: 'text' },
                { key: 'meeting_link', label: 'Meeting Link', placeholder: 'https://zoom.us/j/...', type: 'url' },
                { key: 'scheduled_at', label: 'Date & Time', placeholder: '', type: 'datetime-local' },
                { key: 'duration_minutes', label: 'Duration (minutes)', placeholder: '60', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(d => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
                </div>
              ))}
              {courses.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Course (optional)</label>
                  <select value={form.course_id} onChange={e => setForm(d => ({ ...d, course_id: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}>
                    <option value="">All students</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Description (optional)</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(d => ({ ...d, description: e.target.value }))}
                  placeholder="What will you cover?"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />} Schedule
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
