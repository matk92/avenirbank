'use client';

import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

function resolveThemeFromEnvironment(): Theme {
  try {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    if (document.documentElement.classList.contains('dark')) {
      return 'dark';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const detectedTheme = resolveThemeFromEnvironment();
    setTheme(detectedTheme);
    applyTheme(detectedTheme);
    setResolved(true);
  }, []);

  useEffect(() => {
    if (!resolved) {
      return;
    }

    applyTheme(theme);

    try {
      window.localStorage.setItem('theme', theme);
    } catch {
      // Ignore storage access errors
    }
  }, [resolved, theme]);

  useEffect(() => {
    if (!resolved || typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'theme' && (event.newValue === 'light' || event.newValue === 'dark')) {
        setTheme(event.newValue as Theme);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [resolved]);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => {
      const nextTheme = previous === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      try {
        window.localStorage.setItem('theme', nextTheme);
      } catch {
        // Ignore storage access errors
      }
      return nextTheme;
    });
  }, []);

  const label = theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair';
  const title = theme === 'light' ? 'Mode sombre' : 'Mode clair';
  const icon = theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-50 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-emerald-400"
      aria-label={label}
      title={title}
      data-theme-ready={resolved ? 'true' : 'false'}
    >
      {resolved ? icon : <Moon className="h-5 w-5" />}
    </button>
  );
}
