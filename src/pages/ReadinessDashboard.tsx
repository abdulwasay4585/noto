import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { fetchReadiness, fetchSubjects } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';

const SESSION_KEY = 'noto-session-id';
function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(SESSION_KEY, id); }
  return id;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

function getBarColor(pct: number): string {
  if (pct >= 70) return 'var(--noto-success)';
  if (pct >= 40) return 'var(--noto-warning)';
  return 'var(--noto-danger)';
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pct = payload[0].value;
  return (
    <div className="px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm shadow-md"
      style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}>
      <p className="font-semibold">{label}</p>
      <p style={{
        color: getBarColor(pct),
        fontFamily: 'JetBrains Mono, monospace',
      }}>{pct}%</p>
    </div>
  );
};

export default function ReadinessDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const sessionId = getSessionId();

  useEffect(() => {
    fetchReadiness(sessionId)
      .then(res => {
        // Normalise API response to { topic, score_pct } array
        const arr = Array.isArray(res) ? res : res.topics ?? [];
        setData(arr.map((item: any) => ({
          topic: item.topic ?? item.topic_name,
          score_pct: Math.round(item.score_pct ?? item.score ?? 0),
        })));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const overall = data.length > 0
    ? Math.round(data.reduce((acc, d) => acc + d.score_pct, 0) / data.length)
    : null;

  return (
    <motion.div
      variants={pageVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-5xl mx-auto px-6 lg:px-8 py-12 pb-24"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          Readiness Dashboard
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          Your topic-level mastery based on mock exam results and flashcard reviews.
        </p>
      </div>



      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--noto-primary)', opacity: 0.4 }} />
        </div>
      ) : error ? (
        <div className="text-center py-20 rounded-[var(--noto-radius-xl)] border"
          style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
          <h3 className="font-semibold mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            Connection Error
          </h3>
          <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            Unable to connect to the backend. Please ensure the server is running.
          </p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 rounded-[var(--noto-radius-xl)] border"
          style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
          <h3 className="font-semibold mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            No data yet
          </h3>
          <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            Complete some mock exams to populate your readiness dashboard.
          </p>
        </div>
      ) : (
        <>
          {/* Overall score */}
          {overall !== null && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              {[
                { label: 'Overall Readiness', value: `${overall}%`, color: getBarColor(overall) },
                { label: 'Topics Tracked', value: String(data.length), color: 'var(--noto-primary)' },
                {
                  label: 'Topics Mastered',
                  value: String(data.filter(d => d.score_pct >= 70).length),
                  color: 'var(--noto-success)',
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="p-5 rounded-[var(--noto-radius-lg)] border"
                  style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--noto-text-secondary)' }}>
                    {label}
                  </p>
                  <p className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Bar chart */}
          <div
            className="p-6 rounded-[var(--noto-radius-xl)] border mb-8"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
          >
            <h2 className="text-base font-semibold mb-6"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
              Topic Readiness Heatmap
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
                <CartesianGrid
                  stroke="var(--noto-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="topic"
                  tick={{ fill: 'var(--noto-text-secondary)', fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'var(--noto-text-secondary)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--noto-surface-alt)' }} />
                <Bar dataKey="score_pct" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={getBarColor(entry.score_pct)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Topic list */}
          <div className="space-y-2">
            {[...data].sort((a, b) => a.score_pct - b.score_pct).map(d => (
              <div key={d.topic} className="flex items-center gap-4">
                <span className="text-sm w-36 shrink-0 truncate" style={{ color: 'var(--noto-text-secondary)' }}>{d.topic}</span>
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--noto-border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${d.score_pct}%`, backgroundColor: getBarColor(d.score_pct) }}
                  />
                </div>
                <span
                  className="text-xs w-10 text-right"
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: getBarColor(d.score_pct) }}
                >
                  {d.score_pct}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
