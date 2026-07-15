// src/pages/admin/ActivityFeed.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ChevronDown, ChevronUp, Plus, Edit2, AlertTriangle, CheckCircle,
  Clock, Search,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityEntry {
  id: number;
  user_id: number;
  username: string;
  email: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_title: string | null;
  metadata: any;
  ip_address: string | null;
  created_at: string;
}

interface InternOption {
  id: number;
  username: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const actionConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  created:          { label: 'Created',          icon: Plus,          color: 'var(--noto-success)' },
  updated:          { label: 'Updated',          icon: Edit2,         color: 'var(--noto-primary)' },
  attempted_delete: { label: 'Attempted Delete', icon: AlertTriangle, color: 'var(--noto-danger)' },
  deleted:          { label: 'Deleted',          icon: AlertTriangle, color: 'var(--noto-danger)' },
  uploaded:         { label: 'Uploaded',         icon: CheckCircle,   color: 'var(--noto-success)' },
};

function apiHeaders() {
  const token = localStorage.getItem('noto_token');
  return { Authorization: `Bearer ${token ?? ''}` };
}

// ─── Expanded Row ─────────────────────────────────────────────────────────────

function MetadataPanel({ entry }: { entry: ActivityEntry }) {
  const { metadata, action } = entry;
  if (!metadata) return <p className="text-xs py-1" style={{ color: 'var(--noto-text-secondary)' }}>No additional details.</p>;

  if (action === 'attempted_delete') {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--noto-danger)' }}>
        <AlertTriangle size={13} />
        Intern attempted to delete this {entry.entity_type} - blocked by server policy.
      </div>
    );
  }

  if (metadata.before && metadata.after) {
    return (
      <div className="space-y-1">
        {(metadata.changed_fields ?? []).map((field: string) => (
          <div key={field} className="text-xs flex flex-wrap items-center gap-1.5">
            <code className="font-mono px-1 rounded text-[10px]"
              style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}>
              {field}
            </code>
            <span style={{ color: 'var(--noto-danger)', textDecoration: 'line-through' }}>
              {String(metadata.before[field] ?? '').slice(0, 80)}
            </span>
            <span style={{ color: 'var(--noto-text-secondary)' }}>→</span>
            <span style={{ color: 'var(--noto-success)' }}>
              {String(metadata.after[field] ?? '').slice(0, 80)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (metadata.type || metadata.google_drive_url) {
    return (
      <div className="text-xs space-y-1" style={{ color: 'var(--noto-text-secondary)' }}>
        {metadata.type && <div><strong>Type:</strong> {metadata.type}</div>}
        {metadata.google_drive_url && (
          <div>
            <strong>Drive URL: </strong>
            <a href={metadata.google_drive_url} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--noto-primary)' }} className="underline">
              {String(metadata.google_drive_url).slice(0, 80)}…
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <pre className="text-xs overflow-x-auto rounded p-2"
      style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)', maxHeight: '120px' }}>
      {JSON.stringify(metadata, null, 2)}
    </pre>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActivityFeed() {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [interns, setInterns] = useState<InternOption[]>([]);

  // Filters
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Load intern list for the user dropdown
  useEffect(() => {
    fetch('/api/admin/users', { headers: apiHeaders() })
      .then(r => r.json())
      .then((data: any[]) => setInterns(data.map(u => ({ id: u.id, username: u.username }))))
      .catch(() => {});
  }, []);

  const loadLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (filterUser)     params.set('user_id',     filterUser);
    if (filterAction)   params.set('action',      filterAction);
    if (filterEntity)   params.set('entity_type', filterEntity);
    if (filterDateFrom) params.set('date_from',   filterDateFrom);
    if (filterDateTo)   params.set('date_to',     filterDateTo);

    fetch(`/api/admin/activity-logs?${params}`, { headers: apiHeaders() })
      .then(r => r.json())
      .then(data => {
        setLogs(data.data ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, filterUser, filterAction, filterEntity, filterDateFrom, filterDateTo]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const resetFilters = () => {
    setFilterUser(''); setFilterAction(''); setFilterEntity('');
    setFilterDateFrom(''); setFilterDateTo(''); setPage(1);
  };

  const selectStyle = {
    backgroundColor: 'var(--noto-surface)',
    borderColor: 'var(--noto-border)',
    color: 'var(--noto-text-primary)',
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          Activity Feed
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>
          All intern actions across the platform
        </p>
      </div>

      {/* Filter bar */}
      <div className="card flex flex-wrap items-center gap-3">
        <select
          value={filterUser}
          onChange={e => { setFilterUser(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm outline-none"
          style={selectStyle}
        >
          <option value="">All interns</option>
          {interns.map(i => <option key={i.id} value={i.id}>{i.username}</option>)}
        </select>

        <select
          value={filterAction}
          onChange={e => { setFilterAction(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm outline-none"
          style={selectStyle}
        >
          <option value="">All actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="attempted_delete">Attempted Delete</option>
        </select>

        <select
          value={filterEntity}
          onChange={e => { setFilterEntity(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm outline-none"
          style={selectStyle}
        >
          <option value="">All types</option>
          <option value="resource">Resource</option>
          <option value="past_paper">Past Paper</option>
          <option value="subject">Subject</option>
          <option value="intern_account">Intern Account</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date" value={filterDateFrom}
            onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm outline-none"
            style={selectStyle}
          />
          <span className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>–</span>
          <input
            type="date" value={filterDateTo}
            onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm outline-none"
            style={selectStyle}
          />
        </div>

        {(filterUser || filterAction || filterEntity || filterDateFrom || filterDateTo) && (
          <button
            onClick={resetFilters}
            className="text-xs font-medium px-3 py-2 rounded-[var(--noto-radius-md)] transition-colors"
            style={{ color: 'var(--noto-danger)', backgroundColor: 'color-mix(in srgb, var(--noto-danger) 10%, transparent)' }}
          >
            Clear filters
          </button>
        )}
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
                  {['Timestamp', 'User', 'Action', 'Entity Type', 'Entity Title', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((entry, i) => {
                  const cfg = actionConfig[entry.action] ?? { label: entry.action, icon: Clock, color: 'var(--noto-text-secondary)' };
                  const Icon = cfg.icon;
                  const isExpanded = expanded === entry.id;

                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        style={{ backgroundColor: i % 2 === 0 ? 'var(--noto-surface)' : 'var(--noto-surface-alt)' }}
                        className="hover:bg-primary/5 transition-colors"
                      >
                        {/* Timestamp */}
                        <td className="px-4 py-3">
                          <p className="text-xs font-mono" style={{ color: 'var(--noto-text-primary)' }}>
                            {new Date(entry.created_at).toLocaleString()}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>
                            {timeAgo(entry.created_at)}
                          </p>
                        </td>

                        {/* User */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-xs" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                            {entry.username || '—'}
                          </p>
                        </td>

                        {/* Action badge */}
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
                              color: cfg.color,
                            }}
                          >
                            <Icon size={11} />
                            {cfg.label}
                          </span>
                        </td>

                        {/* Entity type */}
                        <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--noto-text-secondary)' }}>
                          {entry.entity_type}
                        </td>

                        {/* Entity title */}
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--noto-text-primary)', maxWidth: '200px' }}>
                          <p className="truncate">{entry.entity_title ?? '—'}</p>
                        </td>

                        {/* Expand toggle */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpanded(isExpanded ? null : entry.id)}
                            className="p-1 rounded transition-colors"
                            style={{ color: 'var(--noto-text-secondary)' }}
                            title="Show details"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded metadata row */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: i % 2 === 0 ? 'var(--noto-surface)' : 'var(--noto-surface-alt)' }}>
                          <td colSpan={6} className="px-8 pb-4 pt-0">
                            <div
                              className="p-3 rounded-[var(--noto-radius-md)] border"
                              style={{ backgroundColor: 'var(--noto-background)', borderColor: 'var(--noto-border)' }}
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--noto-text-secondary)' }}>
                                Details
                              </p>
                              <MetadataPanel entry={entry} />
                              {entry.ip_address && (
                                <p className="text-[10px] mt-2" style={{ color: 'var(--noto-text-secondary)' }}>
                                  IP: {entry.ip_address}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12" style={{ color: 'var(--noto-text-secondary)' }}>
                      No activity matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t" style={{ borderColor: 'var(--noto-border)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-[var(--noto-radius-sm)] border text-xs transition-colors disabled:opacity-40"
                style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
              >
                Previous
              </button>
              <span className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                Page {page} of {totalPages}
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
  );
}
