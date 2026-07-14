import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight, GraduationCap, BookOpen, Award, MessageCircle,
  Map, Layers, ClipboardCheck, FileStack, Users,
} from 'lucide-react';
import { fetchCategories, fetchResources } from '../api';
import ResourceCard from '../components/ResourceCard';


const categoryIcons: Record<string, React.ElementType> = {
  'O Level': GraduationCap,
  'A Level': Award,
  'SAT': BookOpen,
};

const v2Features = [
  { icon: MessageCircle, label: 'AI Study Chat',    desc: 'Ask anything, get sourced answers from your library.',   path: '/chat' },
  { icon: Map,           label: 'Smart Roadmap',    desc: 'Generate a personalised study plan to your exam date.',   path: '/roadmap' },
  { icon: FileStack,     label: 'Past Papers',      desc: 'Browse, filter, and compile past exam papers by year.',   path: '/past-papers' },
  { icon: Layers,        label: 'Flashcards',       desc: 'Spaced-repetition review cards generated from summaries.', path: '/flashcards' },
  { icon: ClipboardCheck,label: 'Mock Exams',       desc: 'Sit timed practice exams assembled from real questions.',  path: '/mock-exam' },
  { icon: Users,         label: 'Study Groups',     desc: 'Compete on group leaderboards, earn points as you learn.', path: '/groups' },
];

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  in:      { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  out:     { opacity: 0, y: -24, transition: { duration: 0.4 } },
};

export default function Home() {
  const [categories, setCategories] = useState<any[]>([]);
  const [recentResources, setRecentResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cats, res] = await Promise.all([
          fetchCategories(),
          fetchResources({ limit: 4 }),
        ]);
        setCategories(cats);
        setRecentResources(res.data);
      } catch {
        // graceful — backend may not be running
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <motion.div variants={pageVariants as any} initial="initial" animate="in" exit="out">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: 'var(--noto-primary)' }}
      >


        {/* Subtle bottom gradient to blend bars into content */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, var(--noto-primary) 0%, transparent 100%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-36 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-8"
            style={{
              backgroundColor: 'rgba(242, 234, 211, 0.15)',
              color: 'var(--noto-accent)',
              border: '1px solid rgba(242, 234, 211, 0.25)',
            }}
          >
            Academic Excellence, Rethought
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6 drop-shadow-xl"
            style={{ color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Elite Curated{' '}
            <span style={{ color: 'var(--noto-accent)' }}>Study Archives</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            Strictly curated notes, authoritative past papers, and premium study tools for O Level, A Level, and SAT scholars.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/resources"
              className="flex items-center gap-2 px-8 py-3.5 rounded-[var(--noto-radius-md)] font-semibold text-base transition-all duration-150 hover:scale-105 active:scale-95 shadow-lg"
              style={{
                backgroundColor: 'var(--noto-accent)',
                color: 'var(--noto-accent-text)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--noto-accent-dark)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--noto-accent)'}
            >
              Access Library <ArrowRight size={18} />
            </Link>
            <a
              href="#categories"
              className="flex items-center gap-2 px-8 py-3.5 rounded-[var(--noto-radius-md)] font-semibold text-base transition-all duration-150"
              style={{
                color: 'var(--noto-accent)',
                border: '1px solid rgba(242, 234, 211, 0.35)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(242,234,211,0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
            >
              Explore Pathways
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section
        id="categories"
        className="max-w-7xl mx-auto px-6 lg:px-8 py-20"
      >
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
          >
            Distinct Pathways
          </motion.h2>
          <p style={{ color: 'var(--noto-text-secondary)' }}>
            Select your academic track to uncover specialised study materials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(categories.length > 0 ? categories : [
            { id: 1, name: 'O Level' }, { id: 2, name: 'A Level' }, { id: 3, name: 'SAT' }
          ]).map((cat, idx) => {
            const Icon = categoryIcons[cat.name] ?? BookOpen;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
              >
                <Link
                  to={`/resources?categoryId=${cat.id}`}
                  className="group block p-8 rounded-[var(--noto-radius-xl)] border transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: 'var(--noto-surface)',
                    borderColor: 'var(--noto-border)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-primary)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(18, 120, 176, 0.12)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-border)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-[var(--noto-radius-md)] flex items-center justify-center mb-6 transition-colors duration-300"
                    style={{
                      backgroundColor: 'var(--noto-surface-alt)',
                      color: 'var(--noto-primary)',
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3
                    className="text-xl font-semibold mb-2 transition-colors duration-200"
                    style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
                  >
                    {cat.name}
                  </h3>
                  <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--noto-text-secondary)' }}>
                    Rigorous materials specifically curated for {cat.name} scholars.
                  </p>
                  <div
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--noto-primary)' }}
                  >
                    Enter Archive
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="border-t" style={{ borderColor: 'var(--noto-border)' }} />
      </div>

      {/* ── Recent Resources ─────────────────────────────────────────────── */}
      {(recentResources.length > 0 || loading) && (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold"
                style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
              >
                Recently Added
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--noto-text-secondary)' }}>
                The latest additions to the archive.
              </p>
            </div>
            <Link
              to="/resources"
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: 'var(--noto-primary)' }}
            >
              View all <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-[var(--noto-radius-lg)] h-72 border"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)' }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentResources.map(res => (
                <ResourceCard key={res.id} resource={res} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="border-t" style={{ borderColor: 'var(--noto-border)' }} />
      </div>

      {/* ── v2 Feature Previews ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
          >
            Full Study Platform
          </motion.h2>
          <p style={{ color: 'var(--noto-text-secondary)' }}>
            Every tool you need to accelerate from confused to confident.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {v2Features.map(({ icon: Icon, label, desc, path }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
            >
              <Link
                to={path}
                className="group flex flex-col h-full p-6 rounded-[var(--noto-radius-lg)] border transition-all duration-250 hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--noto-surface)',
                  borderColor: 'var(--noto-border)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-primary-light)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(18, 120, 176, 0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div
                  className="w-10 h-10 rounded-[var(--noto-radius-sm)] flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-primary)' }}
                >
                  <Icon size={19} />
                </div>
                <h3
                  className="font-semibold text-base mb-1.5"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
                >
                  {label}
                </h3>
                <p className="text-sm flex-1 leading-relaxed" style={{ color: 'var(--noto-text-secondary)' }}>
                  {desc}
                </p>
                <div
                  className="flex items-center gap-1 mt-4 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--noto-primary)' }}
                >
                  Try it <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[var(--noto-radius-xl)] p-12 md:p-16 text-center"
          style={{ backgroundColor: 'var(--noto-primary)' }}
        >
          {/* Background bars echo */}
          <div className="absolute inset-0 flex items-end justify-center gap-4 pb-0 pointer-events-none overflow-hidden">
            {[40, 60, 75, 90, 80, 65, 50, 70, 85, 60].map((h, i) => (
              <div
                key={i}
                className="w-4 rounded-full"
                style={{ height: `${h}%`, backgroundColor: 'rgba(242,234,211,0.08)' }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <h2
              className="text-3xl md:text-5xl font-bold mb-4"
              style={{ color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Ready to <span style={{ color: 'var(--noto-accent)' }}>Excel?</span>
            </h2>
            <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Join thousands of students who rely on NOTO to prepare smarter and perform better.
            </p>
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[var(--noto-radius-md)] font-semibold transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'var(--noto-accent)',
                color: 'var(--noto-accent-text)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--noto-accent-dark)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--noto-accent)'}
            >
              Access The Vault <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}
