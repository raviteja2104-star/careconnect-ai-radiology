'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
    theme: ThemeMode;
    resolvedTheme: 'light' | 'dark';
    highContrast: boolean;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
    setHighContrast: (on: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'cc-theme';
const CONTRAST_KEY = 'cc-contrast';

function systemPrefersDark() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme: ThemeMode, highContrast: boolean) {
    const root = document.documentElement;
    const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark());
    root.classList.toggle('dark', dark);
    if (highContrast) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    root.style.colorScheme = dark ? 'dark' : 'light';
}

/** Inline boot script — runs before paint so the stored theme never flashes. */
export function ThemeScript() {
    const code = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';var c=localStorage.getItem('${CONTRAST_KEY}')==='1';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);if(c)r.setAttribute('data-contrast','high');r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
    return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('system');
    const [highContrast, setHighContrastState] = useState(false);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const storedTheme = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system';
        const storedContrast = localStorage.getItem(CONTRAST_KEY) === '1';
        setThemeState(storedTheme);
        setHighContrastState(storedContrast);
        applyTheme(storedTheme, storedContrast);
        setResolvedTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onSystemChange = () => {
            const current = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system';
            if (current === 'system') {
                applyTheme('system', localStorage.getItem(CONTRAST_KEY) === '1');
                setResolvedTheme(mq.matches ? 'dark' : 'light');
            }
        };
        mq.addEventListener('change', onSystemChange);
        return () => mq.removeEventListener('change', onSystemChange);
    }, []);

    const setTheme = useCallback((next: ThemeMode) => {
        setThemeState(next);
        localStorage.setItem(STORAGE_KEY, next);
        const contrast = localStorage.getItem(CONTRAST_KEY) === '1';
        applyTheme(next, contrast);
        setResolvedTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }, []);

    const toggleTheme = useCallback(() => {
        const dark = document.documentElement.classList.contains('dark');
        setTheme(dark ? 'light' : 'dark');
    }, [setTheme]);

    const setHighContrast = useCallback((on: boolean) => {
        setHighContrastState(on);
        localStorage.setItem(CONTRAST_KEY, on ? '1' : '0');
        applyTheme((localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system', on);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, highContrast, setTheme, toggleTheme, setHighContrast }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
