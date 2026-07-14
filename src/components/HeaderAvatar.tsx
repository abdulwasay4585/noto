import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function HeaderAvatar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initial = (user.first_name?.[0] || user.email?.[0] || '?').toUpperCase();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/signin';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white transition-transform hover:scale-105 active:scale-95 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        aria-label="User menu"
      >
        {initial}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-xl border shadow-xl overflow-hidden z-50"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--noto-border)', backgroundColor: 'var(--noto-surface-alt)' }}>
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--noto-text-primary)' }}>
                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : (user.username || user.email.split('@')[0])}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>{user.email}</p>
            </div>
            
            <div className="py-1">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--noto-surface-alt)]"
                style={{ color: 'var(--noto-text-primary)' }}
              >
                <User size={16} style={{ color: 'var(--noto-text-secondary)' }} />
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#ef444415] hover:text-[#ef4444]"
                style={{ color: 'var(--noto-text-primary)' }}
              >
                <LogOut size={16} style={{ color: 'var(--noto-text-secondary)' }} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
