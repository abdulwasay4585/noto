// src/pages/intern/InternShell.tsx
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, FileText, FileStack, LogOut, Menu, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import HeaderAvatar from '../../components/HeaderAvatar';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  show: boolean;
}

export default function InternShell() {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/intern',
      show: true,
    },
    {
      label: 'Resources',
      icon: FileText,
      path: '/intern/resources',
      show: can('resources', 'read'),
    },
    {
      label: 'Past Papers',
      icon: FileStack,
      path: '/intern/past-papers',
      show: can('past_papers', 'read'),
    },
  ].filter(item => item.show);

  const handleLogout = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div
        className="px-5 py-5 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {/* Logo mark */}
        <div className="flex items-center justify-center w-8 h-8 shrink-0">
          <img src="/logo.png" alt="NOTOO Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <div
            className="text-sm font-bold text-white leading-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            NOTOO
          </div>
          <div className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Intern Portal
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/intern'}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-[var(--noto-radius-sm)] text-sm font-medium transition-all duration-150 group ${
                isActive ? 'text-white' : 'text-white/60 hover:text-white/90'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight size={14} className="shrink-0 opacity-60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Removed old user area from sidebar bottom */}
    </div>
  );

  const sidebarBg = 'var(--noto-primary-dark)';

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--noto-background)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0" style={{ backgroundColor: sidebarBg }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-56 flex flex-col lg:hidden"
              style={{ backgroundColor: sidebarBg }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-3 border-b shrink-0"
          style={{
            backgroundColor: 'var(--noto-surface)',
            borderColor: 'var(--noto-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-[var(--noto-radius-sm)]"
              style={{ color: 'var(--noto-text-secondary)' }}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
            >
              Intern Portal
            </span>
          </div>
          <HeaderAvatar />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
