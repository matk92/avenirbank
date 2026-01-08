import type { MetadataRoute } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://avenirbank.com').replace(/\/$/, '');

const routes = [
  '/',
  '/login',
  '/register',
  '/client',
  '/client/accounts',
  '/client/savings',
  '/client/investments',
  '/client/activity',
  '/client/messages',
];

function normalizePath(path: unknown): string | null {
  if (typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('/')) return null;
  return trimmed;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const unique = new Set<string>();
  for (const path of routes) {
    const normalized = normalizePath(path);
    if (!normalized) continue;
    unique.add(normalized);
  }

  return Array.from(unique).map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
  }));
}
