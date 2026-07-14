// src/pages/admin/InternDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft, Plus, Edit2, AlertTriangle, CheckCircle, Clock,
  FileText, User, Calendar, Filter,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InternUser {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  last_seen: string | null;
  last_login: string | null;
  created_at: string;
}

interface ActivityLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_title: string | null;
  metadata: any;
  created_at: string;
}

interface Stats {
  total_created: number;
  total_updated: number;
  added_this_week: number;
  last_activity: string | null;
}

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

const actionConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  created:          { label: 'Created', icon: Plus, color: 'var(--noto-success)', bg: 'color-mix(in srgb, var(--noto-success) 15%, transparent)' },
  updated:          { label: 'Updated', icon: Edit2, color: 'var(--noto-primary)', bg: 'color-mix(in srgb, var(--noto-primary) 15%, transparent)' },
  attempted_delete: { label: 'Attempted Delete', icon: AlertTriangle, color: 'var(--noto-danger)', bg: 'color-mix(in srgb, var(--noto-danger) 15%, transparent)' },
  deleted:          { label: 'Deleted', icon: AlertTriangle, color: 'var(--noto-danger)', bg: 'color-mix(in srgb, var(--noto-danger) 15%, transparent)' },
  uploaded:         { label: 'Uploaded', icon: CheckCircle, color: 'var(--noto-success)', bg: 'color-mix(in srgb, var(--noto-success) 15%, transparent)' },
};

function apiHeaders() {
  const token = localStorage.getItem('noto_token');
  return { Authorization: `Bearer ${token ?? ''}` };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className="p-2.5 rounded-[var(--noto-radius-md)] shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>
          {label}
        </p>
        <p className="text-2xl font-bold mt-1"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--noto-text-primary)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InternDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<InternUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filters
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    if (!id) return;
    // Load user info
    fetch(`/api/admin/users`, { headers: apiHeaders() })
      .then(r => r.json())
      .then((users: InternUser[]) => {
        const found = users.find(u => u.id === parseInt(id));
        setUser(found ?? null);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filterAction) params.set('action', filterAction);
    if (filterEntity) params.set('entity_type', filterEntity);
    if (filterDateFrom) params.set('date_from', filterDateFrom);
    if (filterDateTo) params.set('date_to', filterDateTo);

    fetch(`/api/admin/users/${id}/activity?${params}`, { headers: apiHeaders() })
      .then(r => r.json())
      .then(data => {
        setStats(data.stats);
        setLogs(data.data ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, page, filterAction, filterEntity, filterDateFrom, filterDateTo]);

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <User size={32} style={{ color: 'var(--noto-text-secondary)' }} />
        <p style={{ color: 'var(--noto-text-secondary)' }}>Intern not found</p>
        <Link to="/admin/interns" className="btn-primary text-sm">← Back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        to="/admin/interns"
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: 'var(--noto-text-secondary)' }}
      >
        <ArrowLeft size={15} /> Back to Interns
      </Link>

      {/* Section 1: Profile header */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-wrap items-center gap-5"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ backgroundColor: 'var(--noto-primary)', color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                {user.username}
              </h1>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--noto-primary) 15%, transparent)',
                  color: 'var(--noto-primary)',
                }}
              >
                {user.role}
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: user.is_active
                    ? 'color-mix(in srgb, var(--noto-success) 15%, transparent)'
                    : 'color-mix(in srgb, var(--noto-danger) 15%, transparent)',
                  color: user.is_active ? 'var(--noto-success)' : 'var(--noto-danger)',
                }}
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
              <span className="flex items-center gap-1">
                <Clock size={12} /> Last seen {timeAgo(user.last_seen)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Joined {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 2: Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Resources Added" value={stats?.total_created ?? 0} icon={FileText} color="var(--noto-primary)" />
        <StatCard label="Total Edits" value={stats?.total_updated ?? 0} icon={Edit2} color="var(--noto-warning)" />
        <StatCard label="Added This Week" value={stats?.added_this_week ?? 0} icon={Plus} color="var(--noto-success)" />
        <StatCard
          label="Last Activity"
          value={stats?.last_activity ? timeAgo(stats.last_activity) : 'None'}
          icon={Clock}
          color="var(--noto-primary-light)"
        />
      </div>

      {/* Section 3: Activity timeline */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <h2 className="text-base font-semibold flex-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            Activity Timeline
          </h2>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterAction}
              onChange={e => { setFilterAction(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 rounded-[var(--noto-radius-sm)] border text-xs outline-none"
              style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
            >
              <option value="">All actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="attempted_delete">Attempted delete</option>
            </select>
            <select
              value={filterEntity}
              onChange={e => { setFilterEntity(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 rounded-[var(--noto-radius-sm)] border text-xs outline-none"
              style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
            >
              <option value="">All types</option>
              <option value="resource">Resource</option>
              <option value="past_paper">Past Paper</option>
            </select>
            <input
              type="date" value={filterDateFrom}
              onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="px-2 py-1.5 rounded-[var(--noto-radius-sm)] border text-xs outline-none"
              style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
            />
            <span className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>to</span>
            <input
              type="date" value={filterDateTo}
              onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
              className="px-2 py-1.5 rounded-[var(--noto-radius-sm)] border text-xs outline-none"
              style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--noto-border)' }} />
            <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>No activity matching filters</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-5 top-0 bottom-0 w-px"
              style={{ backgroundColor: 'var(--noto-border)' }}
            />
            <div className="space-y-0">
              {logs.map(log => {
                const cfg = actionConfig[log.action] ?? {
                  label: log.action, icon: Clock,
                  color: 'var(--noto-text-secondary)',
                  bg: 'var(--noto-surface-alt)',
                };
                const Icon = cfg.icon;
                return (
                  <div key={log.id} className="flex gap-4 pl-12 relative pb-4">
                    {/* Icon dot */}
                    <div
                      className="absolute left-2.5 top-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Icon size={10} style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 rounded-[var(--noto-radius-md)] p-3 border"
                      style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)' }}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                          {log.entity_type}
                        </span>
                        {log.entity_title && (
                          <span className="text-xs font-medium" style={{ color: 'var(--noto-text-primary)' }}>
                            "{log.entity_title}"
                          </span>
                        )}
                        <span className="ml-auto text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                          {timeAgo(log.created_at)}
                        </span>
                      </div>

                      {/* Metadata diff */}
                      {log.metadata?.before && log.metadata?.after && (
                        <div className="mt-2 text-xs space-y-1">
                          {(log.metadata.changed_fields ?? []).map((field: string) => (
                            <div key={field}>
                              <span className="font-medium" style={{ color: 'var(--noto-text-secondary)' }}>{field}: </span>
                              <span style={{ color: 'var(--noto-danger)', textDecoration: 'line-through' }}>
                                {String(log.metadata.before[field] ?? '').slice(0, 60)}
                              </span>
                              {' → '}
                              <span style={{ color: 'var(--noto-success)' }}>
                                {String(log.metadata.after[field] ?? '').slice(0, 60)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-[var(--noto-radius-sm)] border text-xs transition-colors disabled:opacity-40"
                  style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-[var(--noto-radius-sm)] border text-xs transition-colors disabled:opacity-40"
                  style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
