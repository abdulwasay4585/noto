import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileStack, ExternalLink, Filter, Loader2, AlertCircle } from 'lucide-react';
import { fetchPastPapers, fetchSubjects } from '../api';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function PastPapers() {
  const [papers, setPapers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [subjectId, setSubjectId] = useState<number | undefined>();
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');

  useEffect(() => {
    fetchSubjects().then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchPastPapers({
      subjectId,
      yearFrom: yearFrom ? Number(yearFrom) : undefined,
      yearTo: yearTo ? Number(yearTo) : undefined,
    })
      .then(res => setPapers(res.data || []))
      .catch(() => { setError(true); setPapers([]); })
      .finally(() => setLoading(false));
  }, [subjectId, yearFrom, yearTo]);

  const currentYear = new Date().getFullYear();

  return (
    <motion.div
      variants={pageVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-6 lg:px-8 py-12 pb-24"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FileStack size={15} style={{ color: 'var(--noto-primary)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-primary)' }}>
            Archive
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          Past Papers
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          Browse, filter, and download past examination papers with mark schemes.
        </p>
      </div>

      {/* Filters */}
      <div
        className="px-6 py-5 rounded-[var(--noto-radius-lg)] border mb-8 flex flex-col md:flex-row gap-6 md:items-center"
        style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest md:border-r pr-6"
          style={{ color: 'var(--noto-text-secondary)', borderColor: 'var(--noto-border)' }}>
          <Filter size={14} /> Filters
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--noto-text-secondary)' }}>Subject</label>
            <select
              value={subjectId ?? ''}
              onChange={e => setSubjectId(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm outline-none"
              style={{
                backgroundColor: 'var(--noto-surface-alt)',
                borderColor: 'var(--noto-border)',
                color: 'var(--noto-text-primary)',
              }}
            >
              <option value="">All subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Year range */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--noto-text-secondary)' }}>Year from</label>
            <input type="number" placeholder="2015" min="2000" max={currentYear}
              value={yearFrom} onChange={e => setYearFrom(e.target.value)}
              className="w-24 px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm outline-none"
              style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--noto-text-secondary)' }}>Year to</label>
            <input type="number" placeholder={String(currentYear)} min="2000" max={currentYear}
              value={yearTo} onChange={e => setYearTo(e.target.value)}
              className="w-24 px-3 py-2 rounded-[var(--noto-radius-md)] border text-sm outline-none"
              style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Backend banner */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-[var(--noto-radius-md)] border mb-6 text-sm"
          style={{ backgroundColor: 'var(--noto-warning)' + '18', borderColor: 'var(--noto-warning)', color: 'var(--noto-text-primary)' }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--noto-warning)' }} />
          <div>
            <p className="font-semibold mb-0.5">Backend not connected</p>
            <p style={{ color: 'var(--noto-text-secondary)' }}>Past papers require the PHP backend + PostgreSQL to be running via Docker.</p>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--noto-primary)', opacity: 0.4 }} />
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-20 rounded-[var(--noto-radius-xl)] border"
          style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
          <FileStack size={32} className="mx-auto mb-4" style={{ color: 'var(--noto-text-secondary)', opacity: 0.4 }} />
          <p className="font-semibold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            No papers found
          </p>
          <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            Papers will appear here once they are added via the Admin panel.
          </p>
        </div>
      ) : (
        <div className="rounded-[var(--noto-radius-lg)] border overflow-hidden"
          style={{ borderColor: 'var(--noto-border)' }}>
          {/* Header row */}
          <div
            className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--noto-primary-dark)', color: '#ffffff' }}
          >
            <div className="col-span-4">Subject</div>
            <div className="col-span-2">Year</div>
            <div className="col-span-2">Session</div>
            <div className="col-span-2">Paper</div>
            <div className="col-span-2 text-right">Downloads</div>
          </div>
          {papers.map((p, i) => (
            <div
              key={p.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-center text-sm border-t"
              style={{
                backgroundColor: i % 2 === 0 ? 'var(--noto-surface)' : 'var(--noto-surface-alt)',
                borderColor: 'var(--noto-border)',
                color: 'var(--noto-text-primary)',
              }}
            >
              <div className="col-span-4 font-medium">{p.subject_name || `Subject #${p.subject_id}`}</div>
              <div className="col-span-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--noto-text-secondary)' }}>
                {p.year}
              </div>
              <div className="col-span-2 capitalize" style={{ color: 'var(--noto-text-secondary)' }}>{p.session ?? '—'}</div>
              <div className="col-span-2" style={{ color: 'var(--noto-text-secondary)' }}>Paper {p.paper_number}</div>
              <div className="col-span-2 flex justify-end gap-3">
                {p.question_paper_url && (
                  <a href={p.question_paper_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: 'var(--noto-primary)' }}>
                    QP <ExternalLink size={11} />
                  </a>
                )}
                {p.mark_scheme_url && (
                  <a href={p.mark_scheme_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: 'var(--noto-text-secondary)' }}>
                    MS <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
