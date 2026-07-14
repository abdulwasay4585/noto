import React, { Component } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { initTheme } from './lib/theme.ts';
import './index.css';

// Initialize theme before first render to avoid flash of wrong theme
initTheme();

// ─── Global Error Boundary ────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '2rem',
          backgroundColor: 'var(--noto-background)', color: 'var(--noto-text-primary)',
          fontFamily: 'Inter, sans-serif', gap: '1rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem' }}>⚠️</div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.4rem', fontWeight: 700 }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--noto-text-secondary)', maxWidth: 500, fontSize: '0.875rem' }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              marginTop: '1rem', padding: '0.6rem 1.4rem', borderRadius: '9999px',
              backgroundColor: 'var(--noto-primary)', color: '#fff', border: 'none',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
