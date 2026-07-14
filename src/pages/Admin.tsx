import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck, Plus, Pencil, Trash2, X, Upload, Lock, Eye, EyeOff,
  CheckCircle, XCircle, Tag, FileStack,
} from 'lucide-react';
import {
  fetchResources, fetchCategories, fetchSubjects,
  addResource, updateResource, deleteResource, tagResource,
  fetchPastPapers, addPastPaper,
} from '../api';

// ─── Shared Input Field ────────────────────────────────────────────────────
function Field({ label, value, onChange, required = false, type = "text" }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none"
        style={{
          backgroundColor: 'var(--noto-surface-alt)',
          borderColor: 'var(--noto-border)',
          color: 'var(--noto-text-primary)'
        }}
      />
    </div>
  );
}

// ─── Main Admin Component ──────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('resources');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('noto_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setIsAdmin(user.role === 'admin');
        } catch (e) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAuth();
    window.addEventListener('noto_auth_change', checkAuth);
    return () => window.removeEventListener('noto_auth_change', checkAuth);
  }, []);
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const defaultForm = {
    title: '', description: '', type: 'notes',
    google_drive_url: '', thumbnail: '',
    category_id: '', subject_id: '',
  };
  const [formData, setFormData] = useState(defaultForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, subs, res] = await Promise.all([
        fetchCategories(), fetchSubjects(), fetchResources({ limit: 100 }),
      ]);
      setCategories(cats);
      setSubjects(subs);
      setResources(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await updateResource(editingId, formData);
      else await addResource(formData);
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(defaultForm);
      loadData();
    } catch {
      alert('Action failed. Is the backend running?');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Permanently delete this resource?')) {
      await deleteResource(id);
      loadData();
    }
  };

  const openEdit = (res: any) => {
    setEditingId(res.id);
    setFormData({
      title: res.title, description: res.description ?? '',
      type: res.type, google_drive_url: res.google_drive_url,
      thumbnail: res.thumbnail ?? '', category_id: res.category_id,
      subject_id: res.subject_id,
    });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  // Status badge color
  const statusColor = {
    approved: 'var(--noto-success)',
    pending:  'var(--noto-warning)',
    rejected: 'var(--noto-danger)',
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          Access Denied
        </h2>
        <p style={{ color: 'var(--noto-text-secondary)' }}>You must be signed in as an administrator.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-screen"
      style={{ backgroundColor: 'var(--noto-background)' }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 border-r"
        style={{
          backgroundColor: 'var(--noto-primary-dark)',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={18} />
            <span className="text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Admin
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { key: 'resources', label: 'Resources', icon: Upload },
            { key: 'papers', label: 'Past Papers', icon: FileStack },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="w-full text-left px-3 py-2 rounded-[var(--noto-radius-sm)] text-sm transition-colors duration-150 flex items-center gap-2"
              style={{
                backgroundColor: activeTab === key ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === key ? '#ffffff' : 'rgba(255,255,255,0.65)',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => {
              localStorage.removeItem('noto-admin');
              window.location.reload();
            }}
            className="w-full text-left px-3 py-2 rounded-[var(--noto-radius-sm)] text-xs font-medium transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content: Resources ─────────────────────────────────────── */}
      {activeTab === 'resources' && (
      <div className="flex-1 p-8 overflow-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: 'var(--noto-danger)' }}
            >
              Restricted Area
            </p>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
            >
              Command Center
            </h1>
          </div>
          <button
            onClick={openAdd}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-[var(--noto-radius-md)] text-sm"
          >
            <Plus size={16} /> Add Resource
          </button>
        </div>

        {/* Table */}
        <div
          className="rounded-[var(--noto-radius-lg)] border overflow-hidden shadow-sm"
          style={{ borderColor: 'var(--noto-border)' }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: 'var(--noto-primary-dark)',
              color: '#ffffff',
            }}
          >
            <div className="col-span-5">Resource</div>
            <div className="col-span-3">Category / Subject</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {loading ? (
            <div
              className="px-5 py-10 text-center text-sm"
              style={{ color: 'var(--noto-text-secondary)', backgroundColor: 'var(--noto-surface)' }}
            >
              Loading resources…
            </div>
          ) : resources.length === 0 ? (
            <div
              className="px-5 py-10 text-center text-sm"
              style={{ color: 'var(--noto-text-secondary)', backgroundColor: 'var(--noto-surface)' }}
            >
              No resources yet. Add the first one.
            </div>
          ) : (
            resources.map((res, i) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-4 px-5 py-4 text-sm items-center border-t"
                style={{
                  backgroundColor: i % 2 === 0 ? 'var(--noto-surface)' : 'var(--noto-surface-alt)',
                  borderColor: 'var(--noto-border)',
                }}
              >
                <div className="col-span-5 font-medium truncate" style={{ color: 'var(--noto-text-primary)' }}>
                  {res.title}
                  {res.submission_status && res.submission_status !== 'approved' && (
                    <span
                      className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase"
                      style={{
                        backgroundColor: (statusColor as any)[res.submission_status] + '20',
                        color: (statusColor as any)[res.submission_status],
                      }}
                    >
                      {res.submission_status}
                    </span>
                  )}
                </div>
                <div className="col-span-3 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                  <span style={{ color: 'var(--noto-primary)', fontWeight: 500 }}>{res.category_name}</span>
                  {' / '}{res.subject_name}
                </div>
                <div className="col-span-2 text-xs uppercase tracking-wider" style={{ color: 'var(--noto-text-secondary)' }}>
                  {res.type}
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  <button
                    onClick={() => { tagResource(res.id).catch(() => {}); }}
                    className="p-1.5 rounded transition-colors duration-100"
                    style={{ color: 'var(--noto-text-secondary)' }}
                    title="Tag with AI"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-success)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
                  >
                    <Tag size={14} />
                  </button>
                  <button
                    onClick={() => openEdit(res)}
                    className="p-1.5 rounded transition-colors duration-100"
                    style={{ color: 'var(--noto-text-secondary)' }}
                    title="Edit"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="p-1.5 rounded transition-colors duration-100"
                    style={{ color: 'var(--noto-text-secondary)' }}
                    title="Delete"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-danger)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      )}

      {/* ── Past Papers Tab ──────────────────────────────────────────────── */}
      {activeTab === 'papers' && (
        <PastPapersAdmin subjects={subjects} />
      )}


      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl rounded-[var(--noto-radius-xl)] border shadow-xl overflow-hidden"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'var(--noto-border)' }}
            >
              <h2
                className="font-semibold text-base"
                style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
              >
                {editingId ? 'Edit Resource' : 'Add New Resource'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ color: 'var(--noto-text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Field label="Title" value={formData.title}
                onChange={v => setFormData({ ...formData, title: v })} required />
              <Field label="Google Drive URL" value={formData.google_drive_url}
                onChange={v => setFormData({ ...formData, google_drive_url: v })} required />
              <Field label="Description" value={formData.description}
                onChange={v => setFormData({ ...formData, description: v })} />
              <Field label="Thumbnail URL" value={formData.thumbnail}
                onChange={v => setFormData({ ...formData, thumbnail: v })} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--noto-text-secondary)' }}>
                    Type
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--noto-surface-alt)',
                      borderColor: 'var(--noto-border)',
                      color: 'var(--noto-text-primary)',
                    }}
                  >
                    <option value="notes">Notes</option>
                    <option value="book">Book</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--noto-text-secondary)' }}>
                    Category
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--noto-surface-alt)',
                      borderColor: 'var(--noto-border)',
                      color: 'var(--noto-text-primary)',
                    }}
                  >
                    <option value="">Select…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--noto-text-secondary)' }}>
                  Subject
                </label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--noto-surface-alt)',
                    borderColor: 'var(--noto-border)',
                    color: 'var(--noto-text-primary)',
                  }}
                >
                  <option value="">Select…</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 rounded-[var(--noto-radius-md)] font-semibold text-sm flex items-center justify-center gap-2 mt-2"
              >
                <Upload size={15} />
                {editingId ? 'Save Changes' : 'Add Resource'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
} // end AdminDashboard

// ─── Past Papers Admin Component ─────────────────────────────────────────────
function PastPapersAdmin({ subjects }: { subjects: any[] }) {
  const [papers, setPapers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({
    subject_id: '', year: new Date().getFullYear(), session: 'May/June',
    paper_number: 1, question_paper_url: '', mark_scheme_url: ''
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchPastPapers().then(r => setPapers(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addPastPaper(form);
      const r = await fetchPastPapers();
      setPapers(r.data || []);
      setForm({ subject_id: '', year: new Date().getFullYear(), session: 'May/June', paper_number: 1, question_paper_url: '', mark_scheme_url: '' });
    } catch {}
    setSaving(false);
  };

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--noto-primary)' }}>Archive</p>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Past Papers</h1>
        </div>
      </div>

      {/* Add Paper Form */}
      <form onSubmit={handleAdd} className="rounded-[var(--noto-radius-lg)] border p-6 mb-8 grid grid-cols-2 gap-4" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
        <h3 className="col-span-2 text-sm font-semibold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Add New Paper</h3>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>Subject</label>
          <select required value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none" style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}>
            <option value="">Select…</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>Year</label>
          <input type="number" required value={form.year} onChange={e => setForm({ ...form, year: +e.target.value })} className="px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none" style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>Session</label>
          <select value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} className="px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none" style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}>
            <option>May/June</option><option>Oct/Nov</option><option>Feb/Mar</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>Paper No.</label>
          <input type="number" value={form.paper_number} onChange={e => setForm({ ...form, paper_number: +e.target.value })} className="px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none" style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} min={1} max={9} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>Question Paper URL</label>
          <input type="url" required value={form.question_paper_url} onChange={e => setForm({ ...form, question_paper_url: e.target.value })} placeholder="https://..." className="px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none" style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>Mark Scheme URL</label>
          <input type="url" value={form.mark_scheme_url} onChange={e => setForm({ ...form, mark_scheme_url: e.target.value })} placeholder="https://..." className="px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none" style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
        </div>
        <button type="submit" disabled={saving} className="col-span-2 btn-primary py-2.5 rounded-[var(--noto-radius-md)] text-sm font-semibold flex items-center justify-center gap-2">
          <Upload size={14} /> {saving ? 'Saving…' : 'Add Paper'}
        </button>
      </form>

      {/* Papers list */}
      <div className="rounded-[var(--noto-radius-lg)] border overflow-hidden" style={{ borderColor: 'var(--noto-border)' }}>
        <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ backgroundColor: 'var(--noto-primary-dark)', color: '#ffffff' }}>
          <div className="col-span-4">Subject</div>
          <div className="col-span-2">Year</div>
          <div className="col-span-3">Session</div>
          <div className="col-span-3">Links</div>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--noto-text-secondary)', backgroundColor: 'var(--noto-surface)' }}>Loading…</div>
        ) : papers.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--noto-text-secondary)', backgroundColor: 'var(--noto-surface)' }}>No papers yet. Add the first one above.</div>
        ) : papers.map((p, i) => (
          <div key={p.id} className="grid grid-cols-12 gap-4 px-5 py-3 text-sm items-center border-t" style={{ backgroundColor: i % 2 === 0 ? 'var(--noto-surface)' : 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)' }}>
            <div className="col-span-4 font-medium" style={{ color: 'var(--noto-text-primary)' }}>{p.subject_name}</div>
            <div className="col-span-2" style={{ color: 'var(--noto-text-secondary)' }}>{p.year}</div>
            <div className="col-span-3" style={{ color: 'var(--noto-text-secondary)' }}>{p.session} P{p.paper_number}</div>
            <div className="col-span-3 flex gap-3 text-xs">
              {p.question_paper_url && <a href={p.question_paper_url} target="_blank" rel="noreferrer" style={{ color: 'var(--noto-primary)' }}>QP</a>}
              {p.mark_scheme_url && <a href={p.mark_scheme_url} target="_blank" rel="noreferrer" style={{ color: 'var(--noto-success)' }}>MS</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
