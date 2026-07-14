import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, CalendarDays, BookOpen, Clock, CheckCircle, SkipForward, Loader2, AlertCircle } from 'lucide-react';
import { fetchSubjects, createStudyPlan, fetchStudyPlan, updateStudyTask } from '../api';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

// Task status colors per design.md §7
const taskStatusStyle = (status: string) => {
  switch (status) {
    case 'done':    return { borderColor: 'var(--noto-success)', backgroundColor: 'var(--noto-success)' + '12' };
    case 'skipped': return { borderColor: 'var(--noto-text-secondary)', backgroundColor: 'var(--noto-surface-alt)' };
    default:        return { borderColor: 'var(--noto-accent-dark)', backgroundColor: 'var(--noto-accent)' + '15' }; // pending
  }
};

export default function Roadmap() {
  const [step, setStep] = useState<'form' | 'loading' | 'plan'>('form');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [examDate, setExamDate] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [plan, setPlan] = useState<any>(null);
  const [planId, setPlanId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects().then(setSubjects).catch(() => {});
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examDate || selectedSubjects.length === 0) return;
    setStep('loading');
    setError(null);
    try {
      const res = await createStudyPlan({
        exam_date: examDate,
        subjects: selectedSubjects,
        hours_per_week: hoursPerWeek,
      });
      const id = res.id || res.plan_id;
      setPlanId(id);
      const fullPlan = await fetchStudyPlan(id);
      setPlan(fullPlan);
      setStep('plan');
    } catch {
      setError('Could not generate a roadmap. Ensure the backend is running and the database has topic data.');
      setStep('form');
    }
  };

  const handleTaskAction = async (taskId: number, status: 'done' | 'skipped') => {
    if (!planId) return;
    try {
      await updateStudyTask(planId, taskId, status);
      const updated = await fetchStudyPlan(planId);
      setPlan(updated);
    } catch {}
  };

  const toggleSubject = (id: number) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <motion.div
      variants={pageVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto px-6 lg:px-8 py-12 pb-24"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Map size={15} style={{ color: 'var(--noto-primary)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-primary)' }}>
            Study Planner
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          Smart Roadmap
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          Generate a personalised study plan calibrated to your exam date and available hours.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Form step ────────────────────────────────────────────────── */}
        {step === 'form' && (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleGenerate}
            className="p-8 rounded-[var(--noto-radius-xl)] border space-y-8"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
          >
            {error && (
              <div className="flex items-start gap-3 p-3 rounded-[var(--noto-radius-md)] border text-sm"
                style={{ backgroundColor: 'var(--noto-danger)' + '12', borderColor: 'var(--noto-danger)', color: 'var(--noto-danger)' }}>
                <AlertCircle size={15} className="mt-0.5" /> {error}
              </div>
            )}

            {/* Exam date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2"
                style={{ color: 'var(--noto-text-primary)' }}>
                <CalendarDays size={15} style={{ color: 'var(--noto-primary)' }} />
                Exam Date
              </label>
              <input
                type="date"
                required
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="px-4 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none w-full max-w-xs"
                style={{
                  backgroundColor: 'var(--noto-surface-alt)',
                  borderColor: 'var(--noto-border)',
                  color: 'var(--noto-text-primary)',
                }}
              />
            </div>

            {/* Hours per week */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2"
                style={{ color: 'var(--noto-text-primary)' }}>
                <Clock size={15} style={{ color: 'var(--noto-primary)' }} />
                Study Hours per Week: <span style={{ color: 'var(--noto-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{hoursPerWeek}h</span>
              </label>
              <input
                type="range" min={2} max={40} step={1}
                value={hoursPerWeek}
                onChange={e => setHoursPerWeek(Number(e.target.value))}
                className="w-full max-w-sm"
                style={{ accentColor: 'var(--noto-primary)' }}
              />
              <div className="flex justify-between text-xs mt-1 max-w-sm" style={{ color: 'var(--noto-text-secondary)' }}>
                <span>2h</span><span>40h</span>
              </div>
            </div>

            {/* Subject selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-3"
                style={{ color: 'var(--noto-text-primary)' }}>
                <BookOpen size={15} style={{ color: 'var(--noto-primary)' }} />
                Subjects to Cover
              </label>
              <div className="flex flex-wrap gap-2">
                {subjects.map(sub => {
                  const active = selectedSubjects.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubject(sub.id)}
                      className="px-3.5 py-1.5 rounded-[var(--noto-radius-sm)] text-sm font-medium border transition-all duration-150"
                      style={{
                        backgroundColor: active ? 'var(--noto-primary)' : 'var(--noto-surface-alt)',
                        borderColor:     active ? 'var(--noto-primary)' : 'var(--noto-border)',
                        color:           active ? '#ffffff' : 'var(--noto-text-secondary)',
                      }}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
              {subjects.length === 0 && (
                <p className="text-xs mt-2" style={{ color: 'var(--noto-text-secondary)' }}>
                  Subjects load from the backend — ensure Docker is running.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!examDate || selectedSubjects.length === 0}
              className="btn-primary px-8 py-3 rounded-[var(--noto-radius-md)] font-semibold text-sm disabled:opacity-40 flex items-center gap-2"
            >
              <Map size={15} /> Generate Roadmap
            </button>
          </motion.form>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--noto-primary)' }} />
            <p style={{ color: 'var(--noto-text-secondary)' }}>Generating your personalised study plan…</p>
          </motion.div>
        )}

        {/* ── Plan display ────────────────────────────────────────────────── */}
        {step === 'plan' && plan && (
          <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                Your Study Plan
              </h2>
              <button onClick={() => { setStep('form'); setPlan(null); }}
                className="text-xs font-semibold" style={{ color: 'var(--noto-primary)' }}>
                ← Regenerate
              </button>
            </div>

            <div className="space-y-3">
              {(plan.tasks || []).map((task: any, i: number) => (
                <div
                  key={task.id}
                  className="p-4 rounded-[var(--noto-radius-lg)] border-l-4 border flex items-center justify-between"
                  style={{
                    ...taskStatusStyle(task.status),
                    borderRightColor: 'var(--noto-border)',
                    borderTopColor: 'var(--noto-border)',
                    borderBottomColor: 'var(--noto-border)',
                    backgroundColor: 'var(--noto-surface)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-12">
                      <span className="block text-xs font-mono" style={{ color: 'var(--noto-text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {new Date(task.scheduled_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>
                        {task.topic}
                        {task.is_weak_topic && (
                          <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                            style={{ backgroundColor: 'var(--noto-warning)' + '20', color: 'var(--noto-warning)' }}>
                            Weak
                          </span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                        {task.estimated_minutes} min
                      </p>
                    </div>
                  </div>
                  {task.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleTaskAction(task.id, 'done')}
                        className="p-1.5 rounded transition-colors"
                        title="Mark done"
                        style={{ color: 'var(--noto-success)' }}>
                        <CheckCircle size={18} />
                      </button>
                      <button onClick={() => handleTaskAction(task.id, 'skipped')}
                        className="p-1.5 rounded transition-colors"
                        title="Skip"
                        style={{ color: 'var(--noto-text-secondary)' }}>
                        <SkipForward size={18} />
                      </button>
                    </div>
                  )}
                  {task.status === 'done' && <CheckCircle size={18} style={{ color: 'var(--noto-success)' }} />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
