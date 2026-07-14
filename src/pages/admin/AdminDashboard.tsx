// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FileText, FileStack, Users, TrendingUp, ArrowRight,
  Clock, Plus, Edit2, AlertTriangle, CheckCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  total_resources: number;
  added_this_week: number;
  active_interns: number;
  total_interns: number;
  total_past_papers: number;
  most_active_intern: { username: string; cnt: number } | null;
  resources_by_type: Record<string, number>;
  resources_by_subject: { subject: string; count: number }[];
  recent_activity: ActivityEntry[];
  intern_list: InternStatus[];
}

interface ActivityEntry {
  id: number;
  user_id: number;
  username: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_title: string | null;
  metadata: any;
  created_at: string;
}

interface InternStatus {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  last_seen: string | null;
  added_today: number;
  total_actions: number;
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
  created: { label: 'Created', icon: Plus, color: 'var(--noto-success)' },
  updated: { label: 'Updated', icon: Edit2, color: 'var(--noto-primary)' },
  attempted_delete: { label: 'Attempted Delete', icon: AlertTriangle, color: 'var(--noto-danger)' },
  deleted: { label: 'Deleted', icon: AlertTriangle, color: 'var(--noto-danger)' },
  uploaded: { label: 'Uploaded', icon: CheckCircle, color: 'var(--noto-success)' },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, delay,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="card flex items-start gap-4"
    >
      <div
        className="p-2.5 rounded-[var(--noto-radius-md)] shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--noto-text-secondary)' }}>
          {label}
        </p>
        <p
          className="text-2xl font-bold"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--noto-text-primary)' }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>{sub}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const cfg = actionConfig[entry.action] ?? {
    label: entry.action, icon: Clock, color: 'var(--noto-text-secondary)',
  };
  const Icon = cfg.icon;

  return (
    <div
      className="flex items-start gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--noto-border)' }}
    >
      <div
        className="mt-0.5 p-1.5 rounded-full shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${cfg.color} 15%, transparent)` }}
      >
        <Icon size={12} style={{ color: cfg.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-sm" style={{ color: 'var(--noto-text-primary)' }}>
          <span className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {entry.username || 'Unknown'}
          </span>
          <span style={{ color: cfg.color }} className="text-xs font-semibold uppercase tracking-wider">
            {cfg.label}
          </span>
          {entry.entity_title && (
            <span className="text-xs truncate max-w-[160px]" style={{ color: 'var(--noto-text-secondary)' }}>
              "{entry.entity_title}"
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>
          {entry.entity_type} • {timeAgo(entry.created_at)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('noto_token');
    fetch('/api/admin/activity-logs/stats', {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const subjectData = (stats?.resources_by_subject ?? []).slice(0, 8);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
        >
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--noto-text-secondary)' }}>
          Live overview of resources and intern activity
        </p>
      </div>

      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Resources"
          value={stats?.total_resources ?? 0}
          icon={FileText}
          color="var(--noto-primary)"
          delay={0}
        />
        <StatCard
          label="Added This Week"
          value={stats?.added_this_week ?? 0}
          icon={TrendingUp}
          color="var(--noto-success)"
          sub="by all interns"
          delay={0.05}
        />
        <StatCard
          label="Active Interns"
          value={`${stats?.active_interns ?? 0} / ${stats?.total_interns ?? 0}`}
          icon={Users}
          color="var(--noto-warning)"
          delay={0.1}
        />
        <StatCard
          label="Past Papers"
          value={stats?.total_past_papers ?? 0}
          icon={FileStack}
          color="var(--noto-primary-light)"
          delay={0.15}
        />
      </div>

      {/* Row 2: Activity feed + Intern list */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
            >
              Recent Activity
            </h2>
            <Link
              to="/admin/activity"
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors"
              style={{ color: 'var(--noto-primary)' }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {stats?.recent_activity?.length ? (
            <div className="divide-y" style={{ borderColor: 'var(--noto-border)' }}>
              {stats.recent_activity.slice(0, 8).map(entry => (
                <ActivityRow key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--noto-text-secondary)' }}>
              No activity yet
            </p>
          )}
        </motion.div>

        {/* Intern Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
            >
              Interns
            </h2>
            <Link
              to="/admin/interns"
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--noto-primary)' }}
            >
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          {stats?.intern_list?.length ? (
            <div className="space-y-2">
              {stats.intern_list.map(intern => (
                <Link
                  key={intern.id}
                  to={`/admin/interns/${intern.id}`}
                  className="flex items-center gap-3 p-3 rounded-[var(--noto-radius-md)] transition-colors"
                  style={{ backgroundColor: 'var(--noto-surface-alt)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--noto-primary) 8%, var(--noto-surface-alt))')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--noto-surface-alt)')}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: 'var(--noto-primary)', color: 'white' }}
                  >
                    {intern.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                        {intern.username}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: intern.is_active
                            ? 'color-mix(in srgb, var(--noto-success) 15%, transparent)'
                            : 'color-mix(in srgb, var(--noto-danger) 15%, transparent)',
                          color: intern.is_active ? 'var(--noto-success)' : 'var(--noto-danger)',
                        }}
                      >
                        {intern.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>
                      {intern.last_seen ? `Last seen ${timeAgo(intern.last_seen)}` : 'Never logged in'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-sm font-bold"
                      style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--noto-text-primary)' }}
                    >
                      +{intern.added_today}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--noto-text-secondary)' }}>today</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm mb-3" style={{ color: 'var(--noto-text-secondary)' }}>No interns yet</p>
              <Link
                to="/admin/interns"
                className="btn-primary text-xs px-4 py-2 gap-1"
              >
                <Plus size={13} /> Add first intern
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 3: Resources by Subject chart */}
      {subjectData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="card"
        >
          <h2
            className="text-base font-semibold mb-5"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
          >
            Resources by Subject
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <XAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: 'var(--noto-text-secondary)', fontFamily: 'Inter, sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--noto-text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--noto-surface)',
                  border: '1px solid var(--noto-border)',
                  borderRadius: '8px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: 'var(--noto-text-primary)',
                }}
                cursor={{ fill: 'color-mix(in srgb, var(--noto-primary) 8%, transparent)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {subjectData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index % 2 === 0 ? 'var(--noto-primary)' : 'var(--noto-primary-light)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
