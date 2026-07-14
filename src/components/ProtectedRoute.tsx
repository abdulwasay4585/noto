// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Full-page spinner ────────────────────────────────────────────────────────

function FullPageSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--noto-background)' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* NOTO logo mark animation */}
        <div className="flex items-end gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 rounded-sm animate-bounce"
              style={{
                backgroundColor: 'var(--noto-primary)',
                height: `${14 + i * 6}px`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--noto-text-secondary)', fontFamily: 'Inter, sans-serif' }}
        >
          Loading…
        </p>
      </div>
    </div>
  );
}

// ─── Protected Route ──────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
  /** If true, only admins can access this route. Non-admins redirect to /admin. */
  requireAdmin?: boolean;
  /** If true, only tutors can access this route. */
  requireTutor?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireTutor = false }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/signin" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/intern" replace />;
  if (requireTutor && user.role !== 'tutor') return <Navigate to="/" replace />;

  return <>{children}</>;
}

