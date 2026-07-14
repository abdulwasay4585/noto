import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, PlayCircle, BookOpen, FileStack, ArrowRight } from 'lucide-react';

// Map type → icon per design.md §4
const typeIcons = {
  book:       BookOpen,
  video:      PlayCircle,
  notes:      FileText,
  'past-paper': FileStack,
} as const;

interface ResourceCardProps {
  resource: {
    id: number;
    title: string;
    description: string;
    type: 'book' | 'video' | 'notes' | 'past-paper';
    /** thumbnail_url (new) or thumbnail (legacy) — both supported */
    thumbnail_url?: string;
    thumbnail?: string;
    category_name: string;
    subject_name: string;
  };
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const TypeIcon = typeIcons[resource.type] ?? FileText;
  // Support both the new thumbnail_url field and the legacy thumbnail field
  const thumbSrc = resource.thumbnail_url || resource.thumbnail || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group relative overflow-hidden rounded-[var(--noto-radius-lg)] border"
      style={{
        backgroundColor: 'var(--noto-surface)',
        borderColor: 'var(--noto-border)',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-primary-light)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-border)'}
    >
      <Link to={`/resources/${resource.id}`} className="block">

        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden" style={{ borderBottom: '1px solid var(--noto-border)' }}>
          <img
            src={thumbSrc || `https://picsum.photos/seed/${resource.id}/600/400`}
            alt={resource.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback to picsum placeholder if Drive thumbnail fails (e.g. 403 from private file)
              const img = e.currentTarget as HTMLImageElement;
              img.onerror = null;
              img.src = `https://picsum.photos/seed/${resource.id}/600/400`;
            }}
          />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--noto-primary)',
                color: '#ffffff',
              }}
            >
              {resource.category_name}
            </span>
          </div>

          {/* Type icon */}
          <div className="absolute bottom-3 right-3">
            <div
              className="p-2 rounded-lg shadow-sm"
              style={{ backgroundColor: 'var(--noto-accent)', color: 'var(--noto-accent-text)' }}
            >
              <TypeIcon size={16} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <div
            className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider mb-2"
            style={{ color: 'var(--noto-text-secondary)' }}
          >
            <span>{resource.subject_name}</span>
            <span style={{ color: 'var(--noto-border)' }}>•</span>
            <span>{resource.type}</span>
          </div>

          <h3
            className="font-semibold text-base mb-2 line-clamp-1 transition-colors duration-150"
            style={{ color: 'var(--noto-text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {resource.title}
          </h3>

          <p
            className="text-sm line-clamp-2 mb-4 leading-relaxed h-10"
            style={{ color: 'var(--noto-text-secondary)' }}
          >
            {resource.description}
          </p>

          <div
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-150"
            style={{ color: 'var(--noto-primary)' }}
          >
            View Resource
            <ArrowRight
              size={13}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
