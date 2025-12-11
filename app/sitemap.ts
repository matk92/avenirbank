import type { MetadataRoute } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://avenirbank.example.com').replace(/\/$/, '');

const routes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/client',
  '/client/accounts',
  '/client/savings',
  '/client/investments',
  '/client/activity',
  '/client/messages',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
  }));
}
