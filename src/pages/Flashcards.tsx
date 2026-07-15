import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, RotateCcw, ThumbsUp, ThumbsDown, AlertCircle, Loader2 } from 'lucide-react';
import { fetchDueFlashcards, reviewFlashcard } from '../api';

const SESSION_KEY = 'noto-session-id';

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function Flashcards() {
  const [cards, setCards] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [finished, setFinished] = useState(false);

  const sessionId = getSessionId();

  useEffect(() => {
    setLoading(true);
    fetchDueFlashcards(sessionId)
      .then(data => { setCards(data); setFinished(data.length === 0); })
      .catch(() => { setError(true); setCards([]); })
      .finally(() => setLoading(false));
  }, []);

  const current = cards[currentIdx];

  const handleReview = async (quality: number) => {
    if (!current) return;
    try { await reviewFlashcard(current.id, quality); } catch {}
    setFlipped(false);
    setTimeout(() => {
      if (currentIdx + 1 >= cards.length) {
        setFinished(true);
      } else {
        setCurrentIdx(i => i + 1);
      }
    }, 200);
  };

  const progress = cards.length > 0 ? ((currentIdx) / cards.length) * 100 : 0;

  return (
    <motion.div
      variants={pageVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-2xl mx-auto px-6 lg:px-8 py-12 pb-24"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={15} style={{ color: 'var(--noto-primary)' }} />
          
        </div>
        <h1 className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          Flashcards
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          Review cards due today using the SM-2 spaced repetition algorithm.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--noto-primary)', opacity: 0.4 }} />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 p-4 rounded-[var(--noto-radius-md)] border text-sm"
          style={{ backgroundColor: 'var(--noto-warning)' + '18', borderColor: 'var(--noto-warning)', color: 'var(--noto-text-primary)' }}>
          <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--noto-warning)' }} />
          <div>
            <p className="font-semibold">Backend not connected</p>
            <p style={{ color: 'var(--noto-text-secondary)' }}>
              Flashcards are generated from AI summaries and require the backend to run.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && finished && (
        <div className="text-center py-20 rounded-[var(--noto-radius-xl)] border"
          style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--noto-success)' + '20', color: 'var(--noto-success)' }}>
            <ThumbsUp size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            All caught up!
          </h2>
          <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            No cards due for review today. Come back tomorrow.
          </p>
        </div>
      )}

      {!loading && !error && !finished && current && (
        <>
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--noto-text-secondary)' }}>
              <span>Card {currentIdx + 1} of {cards.length}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--noto-border)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: 'var(--noto-primary)' }} />
            </div>
          </div>

          {/* Flashcard — click to flip */}
          <div
            className="relative cursor-pointer select-none"
            style={{ perspective: 1000 }}
            onClick={() => setFlipped(f => !f)}
          >
            <AnimatePresence mode="wait">
              {!flipped ? (
                // Front — surface color per design.md §7
                <motion.div
                  key="front"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-[var(--noto-radius-xl)] border p-10 min-h-52 flex flex-col items-center justify-center text-center"
                  style={{
                    backgroundColor: 'var(--noto-surface)',
                    borderColor: 'var(--noto-border)',
                  }}
                >
                  {current.topic && (
                    
                  )}
                  <p className="text-lg font-semibold leading-snug"
                    style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                    {current.front}
                  </p>
                  <p className="text-xs mt-6" style={{ color: 'var(--noto-text-secondary)' }}>
                    Tap to reveal answer
                  </p>
                </motion.div>
              ) : (
                // Back — primary-light tint per design.md §7
                <motion.div
                  key="back"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-[var(--noto-radius-xl)] border p-10 min-h-52 flex flex-col items-center justify-center text-center"
                  style={{
                    backgroundColor: 'var(--noto-primary)' + '12',
                    borderColor: 'var(--noto-primary-light)',
                    borderWidth: 1,
                  }}
                >
                  <p className="text-base leading-relaxed"
                    style={{ color: 'var(--noto-text-primary)' }}>
                    {current.back}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Review buttons — only show when flipped */}
          <AnimatePresence>
            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6"
              >
                <p className="text-center text-xs font-semibold uppercase tracking-wider mb-4"
                  style={{ color: 'var(--noto-text-secondary)' }}>
                  How well did you recall this?
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {[
                    { label: 'Forgot', q: 0, color: 'var(--noto-danger)' },
                    { label: 'Hard', q: 2, color: 'var(--noto-warning)' },
                    { label: 'Good', q: 4, color: 'var(--noto-primary)' },
                    { label: 'Easy', q: 5, color: 'var(--noto-success)' },
                  ].map(({ label, q, color }) => (
                    <button
                      key={q}
                      onClick={() => handleReview(q)}
                      className="px-5 py-2.5 rounded-[var(--noto-radius-md)] text-sm font-semibold border-2 transition-all duration-150 hover:scale-105"
                      style={{
                        borderColor: color,
                        color: color,
                        backgroundColor: color + '10',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
