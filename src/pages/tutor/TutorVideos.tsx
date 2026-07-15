// src/pages/tutor/TutorVideos.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Video, Plus, Trash2, Loader2, X, AlertCircle, Youtube, BookOpen, ExternalLink } from 'lucide-react';
import { fetchTutorCourses, fetchCourseVideos, addCourseVideo, deleteTutorVideo } from '../../api';

function getYoutubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function timeAgo(iso: string) {
  const d = new Date(iso), now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export default function TutorVideos() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vLoading, setVLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', youtube_url: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchTutorCourses().then(c => { setCourses(c); if (c.length) setSelectedCourse(c[0]); }).finally(() => setLoading(false)); }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setVLoading(true);
    fetchCourseVideos(selectedCourse.id).then(setVideos).finally(() => setVLoading(false));
  }, [selectedCourse]);

  const handleAdd = async () => {
    if (!form.title || !form.youtube_url) { setError('Title and YouTube URL required'); return; }
    if (!getYoutubeId(form.youtube_url)) { setError('Invalid YouTube URL'); return; }
    setSaving(true); setError('');
    try {
      await addCourseVideo(selectedCourse.id, form);
      const updated = await fetchCourseVideos(selectedCourse.id);
      setVideos(updated);
      setModalOpen(false);
      setForm({ title: '', youtube_url: '', description: '' });
    } catch { setError('Failed to add video'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this video?')) return;
    await deleteTutorVideo(id);
    setVideos(v => v.filter(v => v.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Videos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Manage YouTube video lessons per course.</p>
        </div>
        {selectedCourse && (
          <button onClick={() => { setError(''); setForm({ title: '', youtube_url: '', description: '' }); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}>
            <Plus size={15} /> Add Video
          </button>
        )}
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div> : (
        <>
          {courses.length === 0 ? (
            <div className="text-center py-16 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
              No courses created yet. Go to Courses to create one first.
            </div>
          ) : !selectedCourse ? (
            // MASTER VIEW: Course Cards
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {courses.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedCourse(c)}
                  className="p-6 rounded-3xl border cursor-pointer group transition-all"
                  style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--noto-border)'}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <Youtube size={24} color="white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{c.title}</h3>
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--noto-text-secondary)' }}>
                    {c.description || 'No description provided.'}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            // DETAIL VIEW: Videos for selected course
            <div className="space-y-6">
              <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: 'var(--noto-text-secondary)' }}>
                ← Back to Courses
              </button>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                {selectedCourse.title} Videos
              </h2>
              {vLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div> : videos.length === 0 ? (
                <div className="text-center py-16 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
                  <Youtube size={40} className="mx-auto mb-3 opacity-30" /> No videos for this course yet.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((v, i) => {
                    const ytId = getYoutubeId(v.youtube_url);
                    return (
                      <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                        {ytId ? (
                          <div className="relative aspect-video bg-black group">
                            <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={v.title}
                              className="w-full h-full object-cover opacity-80" />
                            <a href={v.youtube_url} target="_blank" rel="noreferrer"
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </a>
                          </div>
                        ) : (
                          <div className="aspect-video bg-black/20 flex items-center justify-center">
                            <Video size={30} className="opacity-30" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold truncate" style={{ color: 'var(--noto-text-primary)' }}>{v.title}</h4>
                            <span className="text-[10px] shrink-0 font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}>
                              {timeAgo(v.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <a href={v.youtube_url} target="_blank" rel="noreferrer" className="text-xs hover:underline flex items-center gap-1" style={{ color: '#ef4444' }}>
                              Watch on YouTube <ExternalLink size={12} />
                            </a>
                            <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-md hover:bg-white/10 transition-colors" style={{ color: '#ef4444' }} title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Add YouTube Video</h2>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--noto-text-secondary)' }}><X size={18} /></button>
            </div>
            {error && <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}><AlertCircle size={14} /> {error}</div>}
            {form.youtube_url && getYoutubeId(form.youtube_url) && (
              <div className="mb-4 rounded-xl overflow-hidden aspect-video">
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYoutubeId(form.youtube_url)}`}
                  allowFullScreen className="border-0" title="Preview" />
              </div>
            )}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Video Title</label>
                <input value={form.title} onChange={e => setForm(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Chapter 1: Forces"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>YouTube URL</label>
                <input value={form.youtube_url} onChange={e => setForm(d => ({ ...d, youtube_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Description (optional)</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(d => ({ ...d, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Youtube size={14} />} Add Video
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
