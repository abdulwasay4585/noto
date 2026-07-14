import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, MessageCircle, Mail, Book, ChevronLeft, HelpCircle } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.4 } },
};

const faqs = [
  {
    q: 'How do I access study materials?',
    a: 'Browse all resources via the Library link in the navigation. Filter by category, subject, or type to find what you need.',
  },
  {
    q: 'Are the resources free to use?',
    a: 'Yes. All resources listed on NOTO are free to access. We curate high-quality educational content for your convenience.',
  },
  {
    q: 'How does AI summarisation work?',
    a: 'On any resource detail page, click "Generate AI Synopsis". Our system uses Gemini AI to produce a structured academic summary of the material.',
  },
  {
    q: 'Can I contribute my own notes?',
    a: 'A community contribution system is coming — use the submit workflow when it launches. Admin-approved submissions will appear in the library.',
  },
  {
    q: 'What is the AI Study Chat?',
    a: 'The RAG Chat feature lets you ask questions and receive answers grounded in your library. Each answer cites specific resources as sources.',
  },
  {
    q: 'How does the Readiness Dashboard work?',
    a: 'Complete mock exams and flashcard reviews. Your per-topic readiness score is automatically computed and displayed on your dashboard.',
  },
];

export default function HelpCenter() {
  return (
    <motion.div
      variants={pageVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-5xl mx-auto px-6 lg:px-8 py-12 pb-24"
    >
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-8"
        style={{ color: 'var(--noto-text-secondary)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
      >
        <ChevronLeft size={14} /> Home
      </Link>

      {/* Header */}
      <div className="text-center mb-14">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HelpCircle size={15} style={{ color: 'var(--noto-primary)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-primary)' }}>
            Support
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-3"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          Help Center
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--noto-text-secondary)' }}>
          Find answers to common questions or reach out to our support team.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto mb-14">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--noto-text-secondary)' }} />
        <input
          type="text"
          placeholder="Search for help…"
          className="w-full pl-10 pr-4 py-3 rounded-[var(--noto-radius-lg)] border text-sm outline-none"
          style={{
            backgroundColor: 'var(--noto-surface)',
            borderColor: 'var(--noto-border)',
            color: 'var(--noto-text-primary)',
          }}
        />
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
        {[
          { Icon: MessageCircle, title: 'Live Chat', desc: 'Available Mon–Fri, 9am–5pm', action: 'Start Chat' },
          { Icon: Mail, title: 'Email Support', desc: 'We respond within 24 hours', action: 'Send Email' },
          { Icon: Book, title: 'Documentation', desc: 'Browse our full knowledge base', action: 'Read Docs' },
        ].map(({ Icon, title, desc, action }) => (
          <div
            key={title}
            className="p-6 rounded-[var(--noto-radius-xl)] border text-center"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
          >
            <div
              className="w-11 h-11 rounded-[var(--noto-radius-md)] flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-primary)' }}
            >
              <Icon size={20} />
            </div>
            <h3 className="font-semibold mb-1"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
              {title}
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--noto-text-secondary)' }}>{desc}</p>
            <button className="text-xs font-semibold" style={{ color: 'var(--noto-primary)' }}>
              {action}
            </button>
          </div>
        ))}
      </div>

      {/* FAQs */}
      <h2 className="text-xl font-semibold mb-5"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
        Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {faqs.map(({ q, a }) => (
          <div key={q} className="p-5 rounded-[var(--noto-radius-lg)] border"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <p className="font-semibold text-sm mb-2"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
              {q}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--noto-text-secondary)' }}>{a}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
