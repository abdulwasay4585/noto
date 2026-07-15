import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen, Home, Info, ShieldCheck, Sun, Moon, Menu, X,
  MessageCircle, FileStack, Map, Layers, ClipboardCheck, BarChart3, Users, LogIn, User, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toggleTheme, getTheme } from '../lib/theme';
import AuthModal from './AuthModal';
import HeaderAvatar from './HeaderAvatar';

// ─── NOTOO Logo SVG ─────────────────────────────────────────────────────────
// Blue rounded shape with one squared corner (top-left), cream vertical bars
function NotoMark({ size = 32 }: { size?: number }) {
  return (
    <img 
      src="/logo.png" 
      alt="NOTOO Logo" 
      width={size} 
      height={size} 
      style={{ objectFit: 'contain' }}
    />
  );
}

// ─── Nav Items ──────────────────────────────────────────────────────────────
const primaryNav = [
  { name: 'Home',      path: '/',          icon: Home },
  { name: 'Library',   path: '/resources', icon: BookOpen },
  { name: 'Chat',      path: '/chat',      icon: MessageCircle },
  { name: 'Papers',    path: '/past-papers', icon: FileStack },
  { name: 'Roadmap',   path: '/roadmap',   icon: Map },
];

const toolsNav = [
  { name: 'Flashcards', path: '/flashcards', icon: Layers },
  { name: 'Mock Exam',  path: '/mock-exam',  icon: ClipboardCheck },
  { name: 'Readiness',  path: '/readiness',  icon: BarChart3 },
  { name: 'Groups',     path: '/groups',     icon: Users },
  { name: 'Tutoring',   path: '/tutoring',   icon: GraduationCap },
];

const allNavItems = [...primaryNav, ...toolsNav];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(getTheme() === 'dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<{ id: number; email: string; role: string; username?: string } | null>(() => {
    const saved = localStorage.getItem('noto_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  useEffect(() => {
    // Listen for auth changes (login/logout)
    const onAuthChange = () => {
      const u = localStorage.getItem('noto_user');
      try { setUser(u ? JSON.parse(u) : null); } catch { setUser(null); }
    };
    window.addEventListener('noto_auth_change', onAuthChange);
    return () => window.removeEventListener('noto_auth_change', onAuthChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleToggleTheme = () => {
    toggleTheme();
    setIsDark(prev => !prev);
  };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--noto-background)', color: 'var(--noto-text-primary)' }}
    >
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-md' : ''}`}
        style={{
          backgroundColor: scrolled ? 'var(--noto-surface)' : 'var(--noto-surface)',
          opacity: scrolled ? 0.95 : 1,
          borderBottom: scrolled ? '1px solid var(--noto-border)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 30px rgba(0, 0, 0, 0.1)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-6">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group" onClick={() => window.scrollTo(0, 0)}>
              <motion.div whileHover={{ rotate: -8 }} transition={{ type: 'spring', stiffness: 300 }}>
                <NotoMark size={32} />
              </motion.div>
              <span
                className="text-xl font-bold tracking-wide hidden sm:block"
                style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-primary)' }}
              >
                NOTOO
              </span>
            </Link>

            {/* Primary Nav (desktop) */}
            <div className="hidden lg:flex items-center gap-1 flex-1">
              {primaryNav.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
                  style={{
                    color: isActive(item.path) ? 'var(--noto-primary)' : 'var(--noto-text-secondary)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive(item.path))
                      (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-primary)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive(item.path))
                      (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)';
                  }}
                >
                  <item.icon size={15} />
                  {item.name}
                  {isActive(item.path) && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--noto-primary)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}

              {/* Tools dropdown (simple) */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
                  style={{ color: 'var(--noto-text-secondary)' }}
                >
                  Tools ▾
                </button>
                <div className="absolute top-full left-0 pt-1 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div
                    className="rounded-lg shadow-lg border py-1"
                    style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
                  >
                    {toolsNav.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-100"
                        style={{
                          color: isActive(item.path) ? 'var(--noto-primary)' : 'var(--noto-text-secondary)',
                          backgroundColor: isActive(item.path) ? 'var(--noto-surface-alt)' : 'transparent',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--noto-surface-alt)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = isActive(item.path) ? 'var(--noto-surface-alt)' : 'transparent';
                          (e.currentTarget as HTMLElement).style.color = isActive(item.path) ? 'var(--noto-primary)' : 'var(--noto-text-secondary)';
                        }}
                      >
                        <item.icon size={15} />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: About, Admin, Theme, CTA */}
            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/about"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
                style={{ color: 'var(--noto-text-secondary)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-primary)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
              >
                <Info size={15} />
                About
              </Link>

              {/* Role-based Dashboard link for authenticated users */}
              {user && user.role === 'admin' && (
                <Link to="/admin"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
                  style={{ color: 'var(--noto-text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-primary)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
                >
                  <ShieldCheck size={15} /> Admin
                </Link>
              )}
              {user && user.role === 'intern' && (
                <Link to="/intern"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
                  style={{ color: 'var(--noto-text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-primary)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
                >
                  <ShieldCheck size={15} /> Portal
                </Link>
              )}
              {user && user.role === 'tutor' && (
                <Link to="/tutor"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
                  style={{ color: '#6366f1' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#8b5cf6'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6366f1'}
                >
                  <GraduationCap size={15} /> Tutor Panel
                </Link>
              )}
              {user && user.role === 'student' && (
                <Link to="/my-tutor"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
                  style={{ color: '#6366f1' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#8b5cf6'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6366f1'}
                >
                  <GraduationCap size={15} /> My Tutor
                </Link>
              )}

              {/* Theme toggle */}
              <button
                onClick={handleToggleTheme}
                className="p-2 rounded-md transition-colors duration-150"
                style={{ color: 'var(--noto-text-secondary)' }}
                aria-label="Toggle theme"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* CTA / Auth */}
              {user ? (
                <div className="hidden md:flex items-center ml-2">
                  <HeaderAvatar />
                </div>
              ) : (
                <Link
                  to="/signin"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: 'var(--noto-primary)',
                    color: '#ffffff',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--noto-primary-dark)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--noto-primary)'}
                >
                  <LogIn size={15} /> Sign In
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(prev => !prev)}
                className="lg:hidden p-2 rounded-md"
                style={{ color: 'var(--noto-text-secondary)' }}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t"
              style={{
                backgroundColor: 'var(--noto-surface)',
                borderColor: 'var(--noto-border)',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 gap-1">
                {allNavItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                    style={{
                      color: isActive(item.path) ? 'var(--noto-primary)' : 'var(--noto-text-secondary)',
                      backgroundColor: isActive(item.path) ? 'var(--noto-surface-alt)' : 'transparent',
                    }}
                  >
                    <item.icon size={16} />
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/about"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium"
                  style={{ color: 'var(--noto-text-secondary)' }}
                >
                  <Info size={16} /> About
                </Link>

                {/* Mobile Auth actions */}
                <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--noto-border)' }}>
                  {user ? (
                    <>
                      {user.role !== 'student' && (
                        <Link
                          to={user.role === 'admin' ? '/admin' : '/intern'}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium"
                          style={{ color: 'var(--noto-text-secondary)' }}
                          onClick={() => setMobileOpen(false)}
                        >
                          <ShieldCheck size={16} /> {user.role === 'admin' ? 'Admin' : 'Portal'}
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          localStorage.removeItem('noto_token');
                          localStorage.removeItem('noto_user');
                          window.dispatchEvent(new Event('noto_auth_change'));
                          setMobileOpen(false);
                          window.location.href = '/';
                        }}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border"
                        style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}
                      >
                        <LogOut size={18} /> Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/signin"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium w-full text-left"
                      style={{ color: 'var(--noto-text-secondary)' }}
                      onClick={() => setMobileOpen(false)}
                    >
                      <LogIn size={16} /> Sign In
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Page Content ───────────────────────────────────────────────────── */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        className="border-t mt-24"
        style={{
          backgroundColor: 'var(--noto-surface-alt)',
          borderColor: 'var(--noto-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-10 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-2">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <NotoMark size={28} />
                <span
                  className="text-lg font-bold"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-primary)' }}
                >
                  NOTOO
                </span>
              </Link>
              <p
                className="text-sm leading-relaxed max-w-xs"
                style={{ color: 'var(--noto-text-secondary)' }}
              >
                An elite academic repository empowering students with high-quality notes, past papers, and premium study tools.
              </p>
            </div>

            {/* Library Links */}
            <div>
              <h4
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: 'var(--noto-text-primary)' }}
              >
                Library
              </h4>
              <ul className="space-y-2.5 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
                {[
                  ['All Resources', '/resources'],
                  ['O Level', '/resources?categoryId=1'],
                  ['A Level', '/resources?categoryId=2'],
                  ['SAT', '/resources?categoryId=3'],
                  ['Past Papers', '/past-papers'],
                ].map(([label, path]) => (
                  <li key={path}>
                    <Link
                      to={path}
                      className="hover:underline transition-colors"
                      style={{ color: 'var(--noto-text-secondary)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Study Tools */}
            <div>
              <h4
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: 'var(--noto-text-primary)' }}
              >
                Study Tools
              </h4>
              <ul className="space-y-2.5 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
                {toolsNav.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="hover:underline transition-colors"
                      style={{ color: 'var(--noto-text-secondary)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: 'var(--noto-text-primary)' }}
              >
                Company
              </h4>
              <ul className="space-y-2.5 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
                {[['About', '/about'], ['Help', '/help'], ['Terms', '/terms'], ['Privacy', '/privacy']].map(
                  ([label, path]) => (
                    <li key={path}>
                      <Link
                        to={path}
                        className="hover:underline transition-colors"
                        style={{ color: 'var(--noto-text-secondary)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'}
                      >
                        {label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t gap-4 text-xs"
            style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}
          >
            <p>© {new Date().getFullYear()} NOTOO Foundation. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleTheme}
                className="flex items-center gap-1.5 hover:underline"
                style={{ color: 'var(--noto-text-secondary)' }}
              >
                {isDark ? <Sun size={13} /> : <Moon size={13} />}
                {isDark ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
