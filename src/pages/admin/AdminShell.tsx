// src/pages/admin/AdminShell.tsx
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import HeaderAvatar from '../../components/HeaderAvatar';
import {
  LayoutDashboard, FileText, FileStack, Users, Activity,
  ShieldCheck, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  show: boolean;
}

export default function AdminShell() {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      show: true,
    },
    {
      label: 'Resources',
      icon: FileText,
      path: '/admin/resources',
      show: can('resources', 'read'),
    },
    {
      label: 'Past Papers',
      icon: FileStack,
      path: '/admin/past-papers',
      show: can('past_papers', 'read'),
    },
    {
      label: 'Interns',
      icon: Users,
      path: '/admin/interns',
      show: user?.role === 'admin',
    },
    {
      label: 'Activity',
      icon: Activity,
      path: '/admin/activity',
      show: user?.role === 'admin',
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
            {user?.role === 'admin' ? 'Admin Panel' : 'Intern Portal'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/admin'}
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
    </div>
  );

  const sidebarBg = 'linear-gradient(180deg, #020617 0%, #0f172a 100%)';

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--noto-background)' }}>
      <aside className="hidden lg:flex flex-col w-60 shrink-0" style={{ background: sidebarBg }}>
        <SidebarContent />
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative flex flex-col w-60 max-w-xs flex-1 shadow-2xl" style={{ background: sidebarBg }}>
            <SidebarContent />
          </div>
        </div>
      )}

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
              NOTOO Admin
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
