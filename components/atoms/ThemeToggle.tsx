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
  const [theme, setTheme] = useState<Theme>('dark');
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const detectedTheme = resolveThemeFromEnvironment();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- we need to capture the client-side theme after hydration
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
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-all hover:border-white/30 hover:bg-white/10"
      aria-label={label}
      title={title}
      data-theme-ready={resolved ? 'true' : 'false'}
    >
      {resolved ? icon : <Sun className="h-5 w-5" />}
    </button>
  );
}
