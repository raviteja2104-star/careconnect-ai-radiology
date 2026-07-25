import React, { createContext, useContext, useEffect, useState } from 'react';

// ─── Theme Types ──────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'system';

export interface HospitalBranding {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  appName?: string;
  tenantId?: string;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark' | 'high-contrast';
  setMode: (mode: ThemeMode) => void;
  branding: HospitalBranding;
  setBranding: (branding: HospitalBranding) => void;
  toggleDark: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  defaultBranding?: HospitalBranding;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultMode = 'system',
  defaultBranding = {},
  storageKey = 'cc-theme',
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(storageKey) as ThemeMode) ?? defaultMode;
    }
    return defaultMode;
  });

  const [branding, setBrandingState] = useState<HospitalBranding>(defaultBranding);

  const resolvedMode = React.useMemo<'light' | 'dark' | 'high-contrast'>(() => {
    if (mode === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    }
    return mode;
  }, [mode]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;

    // Clear all theme attributes
    root.removeAttribute('data-theme');
    root.classList.remove('dark');

    if (resolvedMode === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else if (resolvedMode === 'high-contrast') {
      root.setAttribute('data-theme', 'high-contrast');
    }
  }, [resolvedMode]);

  // Apply hospital branding via CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    if (branding.primaryColor) {
      root.style.setProperty('--color-brand-primary', branding.primaryColor);
    }
    if (branding.secondaryColor) {
      root.style.setProperty('--color-brand-secondary', branding.secondaryColor);
    }
    if (branding.accentColor) {
      root.style.setProperty('--color-brand-accent', branding.accentColor);
    }
  }, [branding]);

  // Sync system preference changes
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setModeState('system'); // re-trigger resolution
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(storageKey, newMode);
  };

  const setBranding = (newBranding: HospitalBranding) => {
    setBrandingState(prev => ({ ...prev, ...newBranding }));
  };

  const toggleDark = () => {
    setMode(resolvedMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, setMode, branding, setBranding, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Theme Toggle Component ────────────────────────────────────────────────────
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedMode, toggleDark } = useTheme();

  return (
    <button
      onClick={toggleDark}
      aria-label={`Switch to ${resolvedMode === 'dark' ? 'light' : 'dark'} mode`}
      className={`p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`}
    >
      {resolvedMode === 'dark' ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364-.707-.707M6.343 6.343l-.707-.707m12.728 0-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
