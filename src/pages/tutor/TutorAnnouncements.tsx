// src/pages/tutor/TutorAnnouncements.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Plus, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import { fetchTutorAnnouncements, createTutorAnnouncement, deleteTutorAnnouncement, fetchTutorCourses } from '../../api';

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

export default function TutorAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', course_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => Promise.all([fetchTutorAnnouncements(), fetchTutorCourses()])
    .then(([a, c]) => { setAnnouncements(a); setCourses(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      await createTutorAnnouncement({ ...form, course_id: form.course_id || null });
      await load();
      setModalOpen(false);
      setForm({ title: '', body: '', course_id: '' });
    } catch { setError('Failed to post announcement'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this announcement?')) return;
    await deleteTutorAnnouncement(id);
    setAnnouncements(a => a.filter(x => x.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Announcements</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Push notifications and updates to your enrolled students.</p>
        </div>
        <button onClick={() => { setError(''); setForm({ title: '', body: '', course_id: '' }); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
          <Plus size={15} /> New Post
        </button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#f59e0b' }} /></div>
        : announcements.length === 0 ? (
          <div className="text-center py-20 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            No announcements yet. Post your first update!
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="p-5 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                      <Bell size={15} color="white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{a.title}</h3>
                        {a.course_title && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#6366f115', color: '#6366f1' }}>{a.course_title}</span>
                        )}
                      </div>
                      {a.body && <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>{a.body}</p>}
                      <p className="text-xs mt-2" style={{ color: 'var(--noto-text-secondary)' }}>{timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg shrink-0 hover:bg-[#ef444415]" style={{ color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Post Announcement</h2>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--noto-text-secondary)' }}><X size={18} /></button>
            </div>
            {error && <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}><AlertCircle size={14} /> {error}</div>}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Title</label>
                <input value={form.title} onChange={e => setForm(d => ({ ...d, title: e.target.value }))} placeholder="e.g. New video uploaded!"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Message (optional)</label>
                <textarea rows={3} value={form.body} onChange={e => setForm(d => ({ ...d, body: e.target.value }))}
                  placeholder="Add more details..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
              </div>
              {courses.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Target Course (optional)</label>
                  <select value={form.course_id} onChange={e => setForm(d => ({ ...d, course_id: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}>
                    <option value="">All students</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />} Post
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
