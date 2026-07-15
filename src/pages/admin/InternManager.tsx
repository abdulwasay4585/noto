// src/pages/admin/InternManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Eye, Settings, Power, RefreshCw, X, Check,
  AlertCircle, Copy, CheckCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Intern {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  last_seen: string | null;
  last_login: string | null;
  created_at: string;
  resources_added: number;
  total_actions: number;
}

interface PermGrid {
  resources:   { can_read: boolean; can_write: boolean; can_edit: boolean };
  past_papers: { can_read: boolean; can_write: boolean; can_edit: boolean };
  subjects:    { can_read: boolean; can_write: boolean; can_edit: boolean };
  categories:  { can_read: boolean; can_write: boolean; can_edit: boolean };
}

const DEFAULT_PERMS: PermGrid = {
  resources:   { can_read: true, can_write: true, can_edit: true },
  past_papers: { can_read: true, can_write: true, can_edit: false },
  subjects:    { can_read: true, can_write: false, can_edit: false },
  categories:  { can_read: true, can_write: false, can_edit: false },
};

const RESOURCE_LABELS: Record<keyof PermGrid, string> = {
  resources: 'Resources',
  past_papers: 'Past Papers',
  subjects: 'Subjects',
  categories: 'Categories',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string | null): string {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function apiHeaders() {
  const token = localStorage.getItem('noto_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` };
}

// ─── Permission Toggle Grid ───────────────────────────────────────────────────

function PermGrid({ perms, onChange }: {
  perms: PermGrid;
  onChange: (perms: PermGrid) => void;
}) {
  const toggle = (rt: keyof PermGrid, field: 'can_read' | 'can_write' | 'can_edit') => {
    onChange({ ...perms, [rt]: { ...perms[rt], [field]: !perms[rt][field] } });
  };

  return (
    <div className="overflow-hidden rounded-[var(--noto-radius-md)] border" style={{ borderColor: 'var(--noto-border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: 'var(--noto-surface-alt)' }}>
            <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>
              Resource Type
            </th>
            {(['Read', 'Write', 'Edit'] as const).map(a => (
              <th key={a} className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-center" style={{ color: 'var(--noto-text-secondary)' }}>
                {a}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(Object.keys(RESOURCE_LABELS) as (keyof PermGrid)[]).map((rt, i) => (
            <tr key={rt} style={{ backgroundColor: i % 2 === 0 ? 'var(--noto-surface)' : 'var(--noto-surface-alt)' }}>
              <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--noto-text-primary)' }}>
                {RESOURCE_LABELS[rt]}
              </td>
              {(['can_read', 'can_write', 'can_edit'] as const).map(field => (
                <td key={field} className="px-3 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => toggle(rt, field)}
                    className="w-7 h-7 rounded flex items-center justify-center mx-auto transition-colors"
                    style={{
                      backgroundColor: perms[rt][field]
                        ? 'color-mix(in srgb, var(--noto-success) 15%, transparent)'
                        : 'var(--noto-surface-alt)',
                      border: `1px solid ${perms[rt][field] ? 'var(--noto-success)' : 'var(--noto-border)'}`,
                      color: perms[rt][field] ? 'var(--noto-success)' : 'var(--noto-border)',
                    }}
                    aria-label={`Toggle ${field} for ${rt}`}
                  >
                    <Check size={13} />
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-[11px] border-t" style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)', backgroundColor: 'var(--noto-surface-alt)' }}>
        Delete is never granted to interns - enforced at the server level.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InternManager() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);

  // Create intern modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', email: '', temporary_password: '' });
  const [createPerms, setCreatePerms] = useState<PermGrid>({ ...DEFAULT_PERMS });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newPasswordCopied, setNewPasswordCopied] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Permission modal
  const [permOpen, setPermOpen] = useState(false);
  const [permIntern, setPermIntern] = useState<Intern | null>(null);
  const [permData, setPermData] = useState<PermGrid>({ ...DEFAULT_PERMS });
  const [savingPerms, setSavingPerms] = useState(false);

  // Reset password
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetCopied, setResetCopied] = useState(false);

  const loadInterns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { headers: apiHeaders() });
      const data = await res.json();
      setInterns(Array.isArray(data) ? data : []);
    } catch { setInterns([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadInterns(); }, [loadInterns]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    return Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => chars[b % chars.length]).join('');
  };

  const openCreate = () => {
    const pwd = generatePassword();
    setGeneratedPassword(pwd);
    setCreateForm({ username: '', email: '', temporary_password: pwd });
    setCreatePerms({ ...DEFAULT_PERMS });
    setCreateError('');
    setNewPasswordCopied(false);
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ ...createForm, permissions: createPerms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setCreateOpen(false);
      loadInterns();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (intern: Intern) => {
    await fetch(`/api/admin/users/${intern.id}`, {
      method: 'PATCH',
      headers: apiHeaders(),
      body: JSON.stringify({ is_active: !intern.is_active }),
    });
    loadInterns();
  };

  const openPermissions = async (intern: Intern) => {
    setPermIntern(intern);
    setPermOpen(true);
    const res = await fetch(`/api/admin/users/${intern.id}/permissions`, { headers: apiHeaders() });
    const data = await res.json();
    // Merge with defaults for any missing keys
    setPermData({
      resources:   data.resources   ?? DEFAULT_PERMS.resources,
      past_papers: data.past_papers ?? DEFAULT_PERMS.past_papers,
      subjects:    data.subjects    ?? DEFAULT_PERMS.subjects,
      categories:  data.categories  ?? DEFAULT_PERMS.categories,
    });
  };

  const savePermissions = async () => {
    if (!permIntern) return;
    setSavingPerms(true);
    await fetch(`/api/admin/users/${permIntern.id}/permissions`, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify(permData),
    });
    setSavingPerms(false);
    setPermOpen(false);
  };

  const handleResetPassword = async (id: number) => {
    const pwd = generatePassword();
    setResetPassword(pwd);
    setResetId(id);
    setResetCopied(false);
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: apiHeaders(),
      body: JSON.stringify({ new_password: pwd }),
    });
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inputStyle = {
    backgroundColor: 'var(--noto-surface-alt)',
    borderColor: 'var(--noto-border)',
    color: 'var(--noto-text-primary)',
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            Interns
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>
            {interns.filter(i => i.is_active).length} active of {interns.length} total
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Create Intern
        </button>
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
                  {['Intern', 'Status', 'Last Seen', 'Resources Added', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interns.map((intern, i) => (
                  <tr
                    key={intern.id}
                    style={{ backgroundColor: i % 2 === 0 ? 'var(--noto-surface)' : 'var(--noto-surface-alt)' }}
                  >
                    {/* Intern info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: 'var(--noto-primary)', color: 'white' }}
                        >
                          {intern.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                            {intern.username}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                            {intern.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: intern.is_active
                            ? 'color-mix(in srgb, var(--noto-success) 15%, transparent)'
                            : 'color-mix(in srgb, var(--noto-danger) 15%, transparent)',
                          color: intern.is_active ? 'var(--noto-success)' : 'var(--noto-danger)',
                        }}
                      >
                        {intern.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Last seen */}
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                      {timeAgo(intern.last_seen)}
                    </td>

                    {/* Resources added */}
                    <td className="px-4 py-3">
                      <span
                        className="text-sm font-bold"
                        style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--noto-text-primary)' }}
                      >
                        {intern.resources_added ?? 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/admin/interns/${intern.id}`}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'var(--noto-primary)' }}
                          title="View activity"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => openPermissions(intern)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'var(--noto-text-secondary)' }}
                          title="Edit permissions"
                        >
                          <Settings size={15} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(intern.id)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'var(--noto-warning)' }}
                          title="Reset password"
                        >
                          <RefreshCw size={15} />
                        </button>
                        <button
                          onClick={() => toggleActive(intern)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: intern.is_active ? 'var(--noto-danger)' : 'var(--noto-success)' }}
                          title={intern.is_active ? 'Deactivate' : 'Reactivate'}
                        >
                          <Power size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {interns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12" style={{ color: 'var(--noto-text-secondary)' }}>
                      No interns yet. Create the first one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset password toast */}
      <AnimatePresence>
        {resetId && resetPassword && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-[var(--noto-radius-lg)] shadow-xl border max-w-sm"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--noto-text-primary)' }}>Password reset</p>
              <button onClick={() => setResetId(null)} style={{ color: 'var(--noto-text-secondary)' }}>
                <X size={16} />
              </button>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--noto-text-secondary)' }}>
              New temporary password (share securely):
            </p>
            <div className="flex items-center gap-2">
              <code
                className="flex-1 px-2 py-1.5 rounded text-sm font-mono"
                style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-primary)' }}
              >
                {resetPassword}
              </code>
              <button
                onClick={() => copyToClipboard(resetPassword, setResetCopied)}
                className="p-1.5 rounded transition-colors"
                style={{ color: resetCopied ? 'var(--noto-success)' : 'var(--noto-text-secondary)' }}
              >
                {resetCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Intern Modal ── */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setCreateOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[var(--noto-radius-xl)] shadow-2xl"
              style={{ backgroundColor: 'var(--noto-surface)', border: '1px solid var(--noto-border)' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--noto-border)' }}>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                  Create Intern Account
                </h2>
                <button onClick={() => setCreateOpen(false)} style={{ color: 'var(--noto-text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {/* Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Username</label>
                    <input
                      required value={createForm.username}
                      onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="e.g. ali_intern"
                      className="w-full px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Email</label>
                    <input
                      type="email" required value={createForm.email}
                      onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="intern@example.com"
                      className="w-full px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>
                    Temporary Password
                  </label>
                  <div className="flex gap-2">
                    <code
                      className="flex-1 px-3 py-2.5 rounded-[var(--noto-radius-md)] text-sm font-mono border"
                      style={{ ...inputStyle, color: 'var(--noto-text-primary)' }}
                    >
                      {createForm.temporary_password}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createForm.temporary_password, setNewPasswordCopied)}
                      className="px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm transition-colors"
                      style={{ borderColor: 'var(--noto-border)', color: newPasswordCopied ? 'var(--noto-success)' : 'var(--noto-text-secondary)' }}
                    >
                      {newPasswordCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const pwd = generatePassword();
                        setGeneratedPassword(pwd);
                        setCreateForm(f => ({ ...f, temporary_password: pwd }));
                      }}
                      className="px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm"
                      style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}
                      title="Regenerate"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--noto-text-secondary)' }}>
                    Intern will be forced to change this on first login.
                  </p>
                </div>

                {/* Permissions grid */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--noto-text-secondary)' }}>
                    Initial Permissions
                  </p>
                  <PermGrid perms={createPerms} onChange={setCreatePerms} />
                </div>

                {createError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--noto-radius-md)] text-sm"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--noto-danger) 10%, transparent)', color: 'var(--noto-danger)' }}>
                    <AlertCircle size={14} /> {createError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary text-sm">Cancel</button>
                  <button type="submit" disabled={creating} className="btn-primary text-sm flex items-center gap-2">
                    {creating && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                    Create Intern
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Permissions Modal ── */}
      <AnimatePresence>
        {permOpen && permIntern && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setPermOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-lg rounded-[var(--noto-radius-xl)] shadow-2xl"
              style={{ backgroundColor: 'var(--noto-surface)', border: '1px solid var(--noto-border)' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--noto-border)' }}>
                <div>
                  <h2 className="text-base font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                    Edit Permissions
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>
                    {permIntern.username}
                  </p>
                </div>
                <button onClick={() => setPermOpen(false)} style={{ color: 'var(--noto-text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <PermGrid perms={permData} onChange={setPermData} />
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setPermOpen(false)} className="btn-secondary text-sm">Cancel</button>
                  <button
                    onClick={savePermissions}
                    disabled={savingPerms}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    {savingPerms && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
