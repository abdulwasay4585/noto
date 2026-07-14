// src/pages/intern/InternDashboard.tsx
import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, FileText, FileStack, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InternDashboard() {
  const { user } = useAuth();

  const getAccessLevel = (perms: any) => {
    if (!perms) return { label: 'No Access', color: 'var(--noto-text-secondary)', icon: ShieldAlert };
    if (perms.can_edit || perms.can_write) return { label: 'Edit Access', color: 'var(--noto-primary)', icon: ShieldCheck };
    if (perms.can_read) return { label: 'Read Only', color: 'var(--noto-success)', icon: ShieldCheck };
    return { label: 'No Access', color: 'var(--noto-text-secondary)', icon: ShieldAlert };
  };

  const modules = [
    { key: 'resources', label: 'Resources', desc: 'Manage study materials and curriculum', icon: FileText, path: '/intern/resources' },
    { key: 'past_papers', label: 'Past Papers', desc: 'Handle exam papers and solutions', icon: FileStack, path: '/intern/past-papers' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
        >
          Welcome, {user?.username}
        </h1>
        <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          Intern Portal Dashboard. Here is an overview of your assigned access permissions.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((mod, i) => {
          const perms = user?.permissions?.[mod.key];
          const access = getAccessLevel(perms);
          const hasAccess = perms?.can_read;

          return (
            <motion.div
              key={mod.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.35, ease: 'easeOut' }}
              className="card p-5 flex flex-col h-full"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="p-3 rounded-[var(--noto-radius-lg)] shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${access.color} 15%, transparent)` }}
                >
                  <mod.icon size={24} style={{ color: access.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-lg truncate"
                    style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
                  >
                    {mod.label}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>
                    {mod.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <access.icon size={16} style={{ color: access.color }} />
                <span className="text-sm font-medium" style={{ color: access.color }}>
                  {access.label}
                </span>
              </div>

              <div className="mt-auto">
                {hasAccess ? (
                  <Link
                    to={mod.path}
                    className="btn-primary w-full justify-center text-sm"
                  >
                    Open {mod.label}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="btn-secondary w-full justify-center text-sm opacity-50 cursor-not-allowed"
                  >
                    Access Denied
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
