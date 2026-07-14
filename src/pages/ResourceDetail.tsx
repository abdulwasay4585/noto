import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExternalLink, Sparkles, ChevronLeft, Calendar, Tag,
  BookOpen, PlayCircle, FileText, Loader2,
} from 'lucide-react';
import { fetchResourceDetail, generateResourceSummary } from '../api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useAuth } from '../context/AuthContext';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.4 } },
};

export default function ResourceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchResourceDetail(id);
        setResource(data);
      } catch {
        setError('Failed to load resource details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleGenerateSummary = async () => {
    if (!resource) return;

    if (resource.ai_summary) {
      setShowSummary(true);
      return;
    }

    setSummarizing(true);
    setError(null);
    try {
      const response = await generateResourceSummary(resource.id.toString());
      if (response.success && response.summary) {
        setResource({ ...resource, ai_summary: response.summary });
        setShowSummary(true);
      }
    } catch {
      setError('AI summarisation encountered an error.');
    } finally {
      setSummarizing(false);
    }
  };

  const TypeIcon = {
    book:  BookOpen,
    video: PlayCircle,
    notes: FileText,
  }[(resource?.type as 'book' | 'video' | 'notes')] ?? FileText;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--noto-primary)', opacity: 0.5 }} />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-3xl font-bold mb-4"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          {error || 'Resource not found'}
        </h2>
        <Link to="/resources" style={{ color: 'var(--noto-primary)' }} className="text-sm font-semibold hover:underline">
          ← Return to Library
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-6 lg:px-8 py-10 pb-24"
    >
      {/* Back link */}
      <Link
        to="/resources"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-8 transition-colors duration-150"
        style={{ color: 'var(--noto-text-secondary)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
      >
        <ChevronLeft size={14} /> Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">

          {/* Thumbnail */}
          <div
            className="relative aspect-video rounded-[var(--noto-radius-xl)] overflow-hidden border"
            style={{ borderColor: 'var(--noto-border)' }}
          >
            <img
              src={resource.thumbnail || `https://picsum.photos/seed/${resource.id}/1200/800`}
              alt={resource.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Overlay badges */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'var(--noto-primary)', color: '#ffffff' }}
              >
                {resource.category_name}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: 'var(--noto-accent)',
                  color: 'var(--noto-text-primary)',
                }}
              >
                {resource.subject_name}
              </span>
            </div>
          </div>

          {/* Title + meta */}
          <div>
            <h1
              className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-5"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
            >
              {resource.title}
            </h1>

            <div
              className="flex flex-wrap items-center gap-5 text-xs font-semibold uppercase tracking-wider pb-6 mb-6 border-b"
              style={{ color: 'var(--noto-text-secondary)', borderColor: 'var(--noto-border)' }}
            >
              <div className="flex items-center gap-1.5" style={{ color: 'var(--noto-primary)' }}>
                <TypeIcon size={15} />
                {resource.type}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                {new Date(resource.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </div>
              {resource.tags?.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Tag size={13} />
                  {resource.tags.map((t: any) => t.name).join(', ')}
                </div>
              )}
            </div>

            <p className="text-base leading-relaxed" style={{ color: 'var(--noto-text-secondary)' }}>
              {resource.description}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div
            className="sticky top-24 p-7 rounded-[var(--noto-radius-xl)] border shadow-sm"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-6 pb-4 border-b"
              style={{ color: 'var(--noto-text-secondary)', borderColor: 'var(--noto-border)' }}
            >
              Actions
            </h3>

            <div className="space-y-3">
              {/* Access Document */}
              <a
                href={resource.google_drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--noto-radius-md)] font-semibold text-sm transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  backgroundColor: 'var(--noto-primary)',
                  color: '#ffffff',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--noto-primary-dark)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--noto-primary)'}
              >
                Access Document <ExternalLink size={14} />
              </a>

              {/* Generate AI Synopsis */}
              {user && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={summarizing || showSummary}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--noto-radius-md)] font-medium text-sm border transition-all duration-150 disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--noto-surface-alt)',
                    borderColor: 'var(--noto-border)',
                    color: 'var(--noto-text-primary)',
                  }}
                  onMouseEnter={e => {
                    if (!summarizing && !showSummary) (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-primary)';
                  }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-border)'}
                >
                  {summarizing ? (
                    <><Loader2 size={15} className="animate-spin" style={{ color: 'var(--noto-primary)' }} /> Generating…</>
                  ) : (
                    <><Sparkles size={15} style={{ color: 'var(--noto-primary)' }} /> Generate AI Synopsis</>
                  )}
                </button>
              )}
            </div>

            {/* AI Summary display */}
            <AnimatePresence>
              {showSummary && resource.ai_summary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden mt-6 pt-6 border-t"
                  style={{ borderColor: 'var(--noto-border)' }}
                >
                  <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--noto-primary)' }}>
                    <Sparkles size={14} />
                    <span className="text-xs font-semibold uppercase tracking-widest">AI Synopsis</span>
                  </div>
                  <div
                    className="p-4 rounded-[var(--noto-radius-md)] max-h-[60vh] overflow-y-auto"
                    style={{ backgroundColor: 'var(--noto-surface-alt)', border: '1px solid var(--noto-border)' }}
                  >
                    <div className="text-sm leading-relaxed prose prose-sm prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-0.5" style={{ color: 'var(--noto-text-primary)', maxWidth: 'none' }}>
                      <MarkdownRenderer content={resource.ai_summary} />
                    </div>
                  </div>
                  <p className="text-[10px] text-center mt-3 uppercase tracking-widest"
                    style={{ color: 'var(--noto-text-secondary)', opacity: 0.6 }}>
                    Generated by Gemini AI
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
