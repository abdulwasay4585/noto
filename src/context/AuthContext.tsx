// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResourcePermissions {
  can_read: boolean;
  can_write: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role: 'admin' | 'intern' | 'student' | 'tutor';
  must_change_password: boolean;
  permissions: Record<string, ResourcePermissions>;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  password: string;
  terms_accepted: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Check if the current user can perform an action on a resource type */
  can: (resourceType: string, action: 'read' | 'write' | 'edit' | 'delete') => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('noto_token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Verify token and load fresh user data
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        // Keep localStorage in sync for legacy Admin.tsx compatibility
        localStorage.setItem('noto_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('noto_token');
        localStorage.removeItem('noto_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<AuthUser> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('noto_token', data.token);
    localStorage.setItem('noto_user', JSON.stringify(data.user));
    // Legacy event for old Admin.tsx
    window.dispatchEvent(new Event('noto_auth_change'));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<AuthUser> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const respData = await res.json().catch(() => ({}));
      throw new Error(respData.error ?? 'Registration failed');
    }

    const respData = await res.json();
    localStorage.setItem('noto_token', respData.token);
    localStorage.setItem('noto_user', JSON.stringify(respData.user));
    window.dispatchEvent(new Event('noto_auth_change'));
    setUser(respData.user);
    return respData.user;
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('noto_token');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('noto_token');
    localStorage.removeItem('noto_user');
    window.dispatchEvent(new Event('noto_auth_change'));
    setUser(null);
  }, []);

  /**
   * Check if the current user can perform an action on a resource type.
   * Admins always return true. Interns use their permissions record.
   */
  const can = useCallback((resourceType: string, action: 'read' | 'write' | 'edit' | 'delete'): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'student' || user.role === 'tutor') return action === 'read'; // Students/tutors can read by default
    const perms = user.permissions?.[resourceType];
    if (!perms) return false;
    return perms[`can_${action}`] === true;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
