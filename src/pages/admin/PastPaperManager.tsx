// src/pages/admin/PastPaperManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Upload, ExternalLink, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { fetchPastPapers, addPastPaper } from '../../api';
import { parseDriveUrl } from '../../lib/gdrive';

export default function PastPaperManager() {
  const { can } = useAuth();
  const [papers, setPapers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    subject_id: '',
    year: new Date().getFullYear(),
    session: 'May/June',
    paper_number: 1,
    question_paper_url: '',
    mark_scheme_url: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, papersRes] = await Promise.all([
        fetch('/api/subjects').then(r => r.json()),
        fetchPastPapers(),
      ]);
      setSubjects(subRes);
      setPapers(papersRes.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-normalize Drive URLs
  const handleUrlChange = (field: 'question_paper_url' | 'mark_scheme_url', raw: string) => {
    const parsed = parseDriveUrl(raw);
    setForm(f => ({ ...f, [field]: parsed ? parsed.viewUrl : raw }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addPastPaper(form);
      await loadData();
      setForm({
        subject_id: '', year: new Date().getFullYear(),
        session: 'May/June', paper_number: 1,
        question_paper_url: '', mark_scheme_url: '',
      });
      toast.success('Paper added successfully!');
      setShowForm(false);
    } catch (err) {
      toast.error('Failed to add paper');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none";
  const inputStyle = {
    backgroundColor: 'var(--noto-surface-alt)',
    borderColor: 'var(--noto-border)',
    color: 'var(--noto-text-primary)',
  };
  const labelClass = "text-xs font-semibold uppercase tracking-widest mb-1.5 block";

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            Past Papers
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>
            {papers.length} papers in the archive
          </p>
        </div>
        {can('past_papers', 'write') && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Add Paper
          </button>
        )}
      </div>

      {/* Add Paper Form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="card grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <h3 className="sm:col-span-2 text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            New Past Paper
          </h3>

          <div>
            <label className={labelClass} style={{ color: 'var(--noto-text-secondary)' }}>Subject</label>
            <select required value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className={inputClass} style={inputStyle}>
              <option value="">Select…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--noto-text-secondary)' }}>Year</label>
            <input type="number" required value={form.year} onChange={e => setForm({ ...form, year: +e.target.value })} className={inputClass} style={inputStyle} />
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--noto-text-secondary)' }}>Session</label>
            <select value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} className={inputClass} style={inputStyle}>
              <option>May/June</option>
              <option>Oct/Nov</option>
              <option>Feb/Mar</option>
            </select>
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--noto-text-secondary)' }}>Paper No.</label>
            <input type="number" value={form.paper_number} onChange={e => setForm({ ...form, paper_number: +e.target.value })} className={inputClass} style={inputStyle} min={1} max={9} />
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--noto-text-secondary)' }}>Question Paper URL (Drive)</label>
            <input
              type="text" required value={form.question_paper_url}
              onChange={e => handleUrlChange('question_paper_url', e.target.value)}
              placeholder="https://drive.google.com/…"
              className={inputClass} style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--noto-text-secondary)' }}>Mark Scheme URL (Drive)</label>
            <input
              type="text" value={form.mark_scheme_url}
              onChange={e => handleUrlChange('mark_scheme_url', e.target.value)}
              placeholder="https://drive.google.com/…"
              className={inputClass} style={inputStyle}
            />
          </div>

          <div className="sm:col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
              <Upload size={14} /> {saving ? 'Saving…' : 'Add Paper'}
            </button>
          </div>
        </form>
      )}

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
                  {['Subject', 'Year', 'Session', 'Paper', 'Links'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {papers.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{ backgroundColor: i % 2 === 0 ? 'var(--noto-surface)' : 'var(--noto-surface-alt)' }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--noto-text-primary)' }}>
                      {p.subject_name}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--noto-text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {p.year}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                      {p.session}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                      P{p.paper_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        {p.question_paper_url && (
                          <a href={p.question_paper_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1"
                            style={{ color: 'var(--noto-primary)' }}>
                            <ExternalLink size={12} /> QP
                          </a>
                        )}
                        {p.mark_scheme_url && (
                          <a href={p.mark_scheme_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1"
                            style={{ color: 'var(--noto-success)' }}>
                            <ExternalLink size={12} /> MS
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {papers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12" style={{ color: 'var(--noto-text-secondary)' }}>
                      No past papers yet. Add the first one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
