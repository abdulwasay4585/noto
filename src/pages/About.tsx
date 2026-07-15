import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.4 } },
};

export default function About() {
  return (
    <motion.div
      variants={pageVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-3xl mx-auto px-6 lg:px-8 py-14 pb-28"
    >
      {/* Label */}
      <h1
        className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-10"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
      >
        About{' '}
        <span style={{ color: 'var(--noto-primary)' }}>NOTOO</span>
      </h1>

      <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--noto-text-secondary)' }}>
        <p>
          NOTOO (Notes Organized Through Open Opportunities) is an elite educational archive, built to empower ambitious students preparing for the most rigorous academic examinations globally.
        </p>
        <p>
          Our foundation focuses on sourcing, curating, and rigorously filtering high-quality study materials, including O Level, A Level, and SAT documentation.
        </p>

        {/* Mission box */}
        <div
          className="p-8 rounded-[var(--noto-radius-xl)] border relative overflow-hidden my-10"
          style={{ backgroundColor: 'var(--noto-primary)', borderColor: 'transparent' }}
        >
          {/* Bar motif */}
          <div className="absolute bottom-0 right-0 flex items-end gap-2 h-full pb-0 pointer-events-none opacity-10">
            {[60, 80, 100, 75, 55, 90].map((h, i) => (
              <div key={i} className="w-4 rounded-t-full"
                style={{ height: `${h}%`, backgroundColor: 'var(--noto-accent)' }} />
            ))}
          </div>
          <h3
            className="text-xl font-bold text-white mb-4 relative z-10"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Our Mission
          </h3>
          <p className="relative z-10 text-base" style={{ color: 'rgba(255,255,255,0.8)' }}>
            To synthesise the chaotic world of educational resources into a singular, highly refined locus of intellectual acceleration - where every student has access to the highest-quality preparation materials.
          </p>
        </div>

        <p>
          NOTOO is continually evolving. Beyond the curated library, we are building AI-powered tools - smart roadmaps, RAG chat, flashcards, mock exams, and more - to give every student an unfair advantage in their academic journey.
        </p>
      </div>
    </motion.div>
  );
}
