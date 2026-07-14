// src/pages/admin/ResourceManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Pencil, Trash2, X, Tag, Search, ExternalLink,
  ImageOff, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { parseDriveUrl } from '../../lib/gdrive';
import {
  fetchResources, fetchCategories, fetchSubjects,
  addResource, updateResource, deleteResource, tagResource,
} from '../../api';

// ─── Form field ───────────────────────────────────────────────────────────────

function Field({
  label, children, hint,
}: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px]" style={{ color: 'var(--noto-text-secondary)' }}>{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, ...rest }: any) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none transition-colors"
      style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
      onFocus={e => (e.currentTarget.style.borderColor = 'var(--noto-primary)')}
      onBlur={e => (e.currentTarget.style.borderColor = 'var(--noto-border)')}
      {...rest}
    />
  );
}

function Select({ value, onChange, children, ...rest }: any) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none"
      style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
      {...rest}
    >
      {children}
    </select>
  );
}

// ─── Default form ─────────────────────────────────────────────────────────────

type ResourceType = 'notes' | 'book' | 'video';

interface ResourceForm {
  title: string;
  description: string;
  type: ResourceType;
  google_drive_url: string;
  thumbnail: string;
  category_id: string;
  subject_id: string;
  difficulty_level: string;
}

const DEFAULT_FORM: ResourceForm = {
  title: '', description: '', type: 'notes',
  google_drive_url: '', thumbnail: '',
  category_id: '', subject_id: '',
  difficulty_level: '',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResourceManager() {
  const { can } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ResourceForm>({ ...DEFAULT_FORM });
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, subs, res] = await Promise.all([
        fetchCategories(), fetchSubjects(), fetchResources({ limit: 200 }),
      ]);
      setCategories(cats);
      setSubjects(subs);
      setResources(res.data ?? res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ ...DEFAULT_FORM });
    setThumbnailPreview(null);
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setFormData({
      title: r.title, description: r.description ?? '',
      type: r.type, google_drive_url: r.google_drive_url,
      thumbnail: r.thumbnail ?? '', category_id: r.category_id,
      subject_id: r.subject_id, difficulty_level: r.difficulty_level ?? '',
    });
    setThumbnailPreview(r.thumbnail || null);
    setError('');
    setIsModalOpen(true);
  };

  const handleDriveUrlChange = (rawUrl: string) => {
    setFormData(f => ({ ...f, google_drive_url: rawUrl }));
    const parsed = parseDriveUrl(rawUrl);
    if (parsed) {
      setFormData(f => ({
        ...f,
        google_drive_url: parsed.viewUrl,
        thumbnail: parsed.thumbnailUrl,
      }));
      setThumbnailPreview(parsed.thumbnailUrl);
    } else {
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) await updateResource(editingId, formData as unknown as Record<string, unknown>);
      else await addResource(formData as unknown as Record<string, unknown>);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this resource?')) return;
    try {
      await deleteResource(id);
      loadData();
    } catch (err: any) {
      alert('Delete failed: ' + (err.message ?? 'Unknown error'));
    }
  };

  const handleTag = async (id: number) => {
    try {
      await tagResource(id);
      alert('Resource tagged successfully');
    } catch {
      alert('Tagging failed');
    }
  };

  const filtered = resources.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            Resources
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>
            {resources.length} total resources
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--noto-text-secondary)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search resources…"
              className="pl-8 pr-3 py-2 rounded-[var(--noto-radius-md)] border text-sm outline-none"
              style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)', width: '220px' }}
            />
          </div>
          {can('resources', 'write') && (
            <button
              onClick={openAdd}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={15} /> Add Resource
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--noto-primary-dark)' }}>
                  {['Thumbnail', 'Title', 'Type', 'Subject', 'Category', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white first:pl-4 last:pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ backgroundColor: i % 2 === 0 ? 'var(--noto-surface)' : 'var(--noto-surface-alt)' }}
                    className="hover:bg-primary/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-14 h-10 rounded overflow-hidden" style={{ border: '1px solid var(--noto-border)' }}>
                        <img
                          src={r.thumbnail || `https://picsum.photos/seed/${r.id}/120/80`}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={e => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/${r.id}/120/80`; }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold line-clamp-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)', maxWidth: '240px' }}>
                        {r.title}
                      </p>
                      <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--noto-text-secondary)', maxWidth: '240px' }}>
                        {r.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--noto-primary) 12%, transparent)', color: 'var(--noto-primary)' }}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>{r.subject_name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>{r.category_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {r.google_drive_url && (
                          <a href={r.google_drive_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'var(--noto-text-secondary)' }}
                            title="Open in Drive"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        {can('resources', 'write') && (
                          <button
                            onClick={() => handleTag(r.id)}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'var(--noto-text-secondary)' }}
                            title="Auto-tag"
                          >
                            <Tag size={14} />
                          </button>
                        )}
                        {can('resources', 'edit') && (
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'var(--noto-primary)' }}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {can('resources', 'delete') && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'var(--noto-danger)' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12" style={{ color: 'var(--noto-text-secondary)' }}>
                      No resources found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[var(--noto-radius-xl)] shadow-2xl"
              style={{ backgroundColor: 'var(--noto-surface)', border: '1px solid var(--noto-border)' }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--noto-border)' }}>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                  {editingId ? 'Edit Resource' : 'Add Resource'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--noto-text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <Field label="Title">
                  <Input value={formData.title} onChange={(v: string) => setFormData(f => ({ ...f, title: v }))} required placeholder="e.g. O Level Maths Notes 2024" />
                </Field>

                <Field label="Description">
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="Brief description…"
                    className="w-full px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none resize-none"
                    style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Type">
                    <Select value={formData.type} onChange={(v: string) => setFormData(f => ({ ...f, type: v as 'notes' | 'book' | 'video' }))}>
                      <option value="notes">Notes</option>
                      <option value="book">Book</option>
                      <option value="video">Video</option>
                    </Select>
                  </Field>
                  <Field label="Category">
                    <Select value={formData.category_id} onChange={(v: string) => setFormData(f => ({ ...f, category_id: v }))} required>
                      <option value="">Select…</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </Field>
                  <Field label="Subject">
                    <Select value={formData.subject_id} onChange={(v: string) => setFormData(f => ({ ...f, subject_id: v }))} required>
                      <option value="">Select…</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  </Field>
                </div>

                <Field
                  label="Google Drive URL"
                  hint="Paste any Drive sharing URL — thumbnail will auto-fill. File must be 'Anyone with link can view'."
                >
                  <Input
                    value={formData.google_drive_url}
                    onChange={handleDriveUrlChange}
                    required
                    placeholder="https://drive.google.com/file/d/…"
                  />
                </Field>

                {/* Thumbnail preview */}
                {thumbnailPreview ? (
                  <div className="rounded-[var(--noto-radius-md)] overflow-hidden border" style={{ borderColor: 'var(--noto-border)' }}>
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-36 object-cover"
                      referrerPolicy="no-referrer"
                      onError={e => {
                        (e.currentTarget.parentElement as HTMLElement).innerHTML =
                          `<div class="flex flex-col items-center justify-center h-36 gap-2" style="color:var(--noto-text-secondary)">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                             <span style="font-size:12px">Thumbnail unavailable — check Drive sharing settings</span>
                           </div>`;
                      }}
                    />
                    <p className="px-3 py-1.5 text-[11px]" style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}>
                      ✓ Thumbnail URL auto-filled
                    </p>
                  </div>
                ) : formData.google_drive_url ? (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-[var(--noto-radius-md)] text-xs"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--noto-warning) 10%, transparent)', color: 'var(--noto-warning)' }}
                  >
                    <AlertCircle size={13} />
                    Could not parse Drive URL — thumbnail will not auto-fill
                  </div>
                ) : null}

                <Field label="Difficulty">
                  <Select value={formData.difficulty_level} onChange={(v: string) => setFormData(f => ({ ...f, difficulty_level: v }))}>
                    <option value="">Not specified</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </Field>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--noto-radius-md)] text-sm"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--noto-danger) 10%, transparent)', color: 'var(--noto-danger)' }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary text-sm gap-2">
                    {submitting ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : null}
                    {editingId ? 'Save Changes' : 'Add Resource'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
