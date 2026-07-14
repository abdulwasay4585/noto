// src/pages/tutor/TutorShell.tsx
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, BookOpen, Video, Radio,
  Bell, CreditCard, LogOut, Menu, X, ChevronRight, GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import HeaderAvatar from '../../components/HeaderAvatar';

export default function TutorShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/tutor' },
    { label: 'Students',      icon: Users,           path: '/tutor/students' },
    { label: 'Courses',       icon: BookOpen,        path: '/tutor/courses' },
    { label: 'Videos',        icon: Video,           path: '/tutor/videos' },
    { label: 'Live Classes',  icon: Radio,           path: '/tutor/classes' },
    { label: 'Payments',      icon: CreditCard,      path: '/tutor/payments' },
    { label: 'Announcements', icon: Bell,            path: '/tutor/announcements' },
  ];

  const handleLogout = async () => { await logout(); navigate('/signin', { replace: true }); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <GraduationCap size={18} color="white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NOTO</div>
          <div className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Tutor Panel</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/tutor'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? 'text-white' : 'text-white/60 hover:text-white/90'
              }`
            }
            style={({ isActive }) => ({ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent' })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="shrink-0 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Removed old user area from sidebar bottom */}
    </div>
  );

  const sidebarBg = 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)';

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--noto-background)' }}>
      <aside className="hidden lg:flex flex-col w-60 shrink-0" style={{ background: sidebarBg }}>
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-60 flex flex-col lg:hidden" style={{ background: sidebarBg }}>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b shrink-0"
          style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg" style={{ color: 'var(--noto-text-secondary)' }}>
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>NOTO Tutor</span>
          </div>
          <HeaderAvatar />
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
