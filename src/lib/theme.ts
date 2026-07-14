// src/lib/theme.ts — Theme toggle and initialization per design.md §2

export function toggleTheme(): void {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('noto-theme', next);
}

export function initTheme(): void {
  const saved = localStorage.getItem('noto-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

export function getTheme(): 'light' | 'dark' {
  return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
}
