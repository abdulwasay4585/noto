import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { fetchCategories, fetchSubjects, fetchResources } from '../api';
import ResourceCard from '../components/ResourceCard';
import { cn } from '../lib/utils';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.4 } },
};

export default function Resources() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const categoryId = searchParams.get('categoryId');
  const subjectId  = searchParams.get('subjectId');
  const type       = searchParams.get('type');
  const search     = searchParams.get('search') || '';
  const page       = searchParams.get('page') || '1';

  useEffect(() => {
    (async () => {
      const [cats, subs] = await Promise.all([
        fetchCategories(),
        fetchSubjects(categoryId ? Number(categoryId) : undefined),
      ]);
      setCategories(cats);
      setSubjects(subs);
    })();
  }, [categoryId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchResources({ categoryId, subjectId, type, search, page, limit: 12 });
        setResources(res.data);
        setPagination(res.pagination);
      } catch {
        setResources([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryId, subjectId, type, search, page]);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const filterBtnStyle = (active: boolean) => ({
    backgroundColor: active ? 'var(--noto-primary)' : 'var(--noto-surface-alt)',
    color:           active ? '#ffffff' : 'var(--noto-text-secondary)',
    border:          `1px solid ${active ? 'var(--noto-primary)' : 'var(--noto-border)'}`,
    borderRadius:    'var(--noto-radius-sm)',
    padding:         '0.35rem 0.875rem',
    fontSize:        '0.75rem',
    fontWeight:      500,
    cursor:          'pointer',
    transition:      'all 0.15s ease',
  } as React.CSSProperties);

  return (
    <motion.div
      variants={pageVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-6 lg:px-8 py-12 pb-24"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'var(--noto-primary)' }}
          >
            The Archive
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
          >
            Library
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            Browse our curated collection of study materials.
          </p>
        </div>

        {/* Search + Filter toggle */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--noto-text-secondary)' }}
            />
            <input
              type="text"
              placeholder="Search resources…"
              className="pl-9 pr-4 py-2.5 rounded-[var(--noto-radius-md)] text-sm outline-none w-64 border"
              style={{
                backgroundColor: 'var(--noto-surface)',
                borderColor: 'var(--noto-border)',
                color: 'var(--noto-text-primary)',
              }}
              value={search}
              onChange={e => updateFilter('search', e.target.value || null)}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-primary)'}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-border)'}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--noto-radius-md)] text-sm font-medium border transition-colors duration-150"
            style={{
              backgroundColor: showFilters ? 'var(--noto-primary)' : 'var(--noto-surface)',
              color:           showFilters ? '#ffffff' : 'var(--noto-text-secondary)',
              borderColor:     showFilters ? 'var(--noto-primary)' : 'var(--noto-border)',
            }}
          >
            <Filter size={14} />
            Filters
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-8"
          >
            <div
              className="p-6 rounded-[var(--noto-radius-lg)] border grid grid-cols-1 md:grid-cols-3 gap-8"
              style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
            >
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--noto-text-secondary)' }}>
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button style={filterBtnStyle(!categoryId)} onClick={() => updateFilter('categoryId', null)}>All</button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      style={filterBtnStyle(categoryId === cat.id.toString())}
                      onClick={() => updateFilter('categoryId', cat.id.toString())}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--noto-text-secondary)' }}>
                  Subject
                </label>
                <div className="flex flex-wrap gap-2">
                  <button style={filterBtnStyle(!subjectId)} onClick={() => updateFilter('subjectId', null)}>All</button>
                  {subjects.map(sub => (
                    <button
                      key={sub.id}
                      style={filterBtnStyle(subjectId === sub.id.toString())}
                      onClick={() => updateFilter('subjectId', sub.id.toString())}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--noto-text-secondary)' }}>
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {['book', 'video', 'notes'].map(t => (
                    <button
                      key={t}
                      style={filterBtnStyle(type === t)}
                      onClick={() => updateFilter('type', type === t ? null : t)}
                      className="capitalize"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resource grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[var(--noto-radius-lg)] h-80 border"
              style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)' }}
            />
          ))}
        </div>
      ) : resources.length > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {resources.map(res => <ResourceCard key={res.id} resource={res} />)}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <button
                disabled={pagination.page === 1}
                onClick={() => updateFilter('page', (pagination.page - 1).toString())}
                className="p-2.5 rounded-[var(--noto-radius-md)] border disabled:opacity-30 transition-colors duration-150"
                style={{ borderColor: 'var(--noto-border)', backgroundColor: 'var(--noto-surface)', color: 'var(--noto-text-primary)' }}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium" style={{ color: 'var(--noto-text-secondary)' }}>
                Page <span style={{ color: 'var(--noto-primary)', fontWeight: 600 }}>{pagination.page}</span> of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => updateFilter('page', (pagination.page + 1).toString())}
                className="p-2.5 rounded-[var(--noto-radius-md)] border disabled:opacity-30 transition-colors duration-150"
                style={{ borderColor: 'var(--noto-border)', backgroundColor: 'var(--noto-surface)', color: 'var(--noto-text-primary)' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-24 rounded-[var(--noto-radius-xl)] border"
          style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}
          >
            <X size={28} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            No Resources Found
          </h3>
          <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            Try adjusting your filters or search query.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
