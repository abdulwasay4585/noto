// src/pages/tutor/TutorCourses.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Plus, Pencil, Trash2, Loader2, Video, Users, X, AlertCircle } from 'lucide-react';
import { fetchTutorCourses, createTutorCourse, updateTutorCourse, deleteTutorCourse } from '../../api';

function timeAgo(iso: string) {
  if (!iso) return 'Just now';
  const d = new Date(iso), now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export default function TutorCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', price: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => fetchTutorCourses().then(setCourses).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditCourse(null); setForm({ title: '', description: '', price: '' }); setError(''); setModalOpen(true); };
  const openEdit = (c: any) => { setEditCourse(c); setForm({ title: c.title, description: c.description, price: String(c.price) }); setError(''); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      if (editCourse) await updateTutorCourse(editCourse.id, { ...form, price: parseFloat(form.price) || 0 });
      else await createTutorCourse({ ...form, price: parseFloat(form.price) || 0 });
      await load();
      setModalOpen(false);
    } catch (err: any) { setError(err.message || 'Failed to save course'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this course and all its content?')) return;
    await deleteTutorCourse(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Courses</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Organise your teaching content into courses.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <Plus size={15} /> New Course
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          No courses yet. Create your first course!
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl border flex flex-col gap-3" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <BookOpen size={18} color="white" />
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--noto-surface-alt)]" style={{ color: 'var(--noto-text-secondary)' }}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg transition-colors hover:bg-[#ef444415]" style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{c.title}</h3>
                  <span className="text-[10px] shrink-0 font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}>
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--noto-text-secondary)' }}>{c.description || 'No description'}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--noto-border)' }}>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--noto-text-secondary)' }}><Video size={11} /> {c.video_count} videos</span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--noto-text-secondary)' }}><Users size={11} /> {c.student_count} students</span>
                </div>
                <span className="text-xs font-bold" style={{ color: '#10b981' }}>PKR {c.price}</span>
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
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                {editCourse ? 'Edit Course' : 'New Course'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--noto-text-secondary)' }}><X size={18} /></button>
            </div>
            {error && <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}><AlertCircle size={14} /> {error}</div>}
            <div className="space-y-3 mb-5">
              {[
                { key: 'title', label: 'Course Title', placeholder: 'e.g. A-Level Physics', type: 'text' },
                { key: 'price', label: 'Price (PKR)', placeholder: '0', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(d => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(d => ({ ...d, description: e.target.value }))}
                  placeholder="What will students learn?"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
                {editCourse ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
