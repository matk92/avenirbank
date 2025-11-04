import type { MetadataRoute } from 'next';

const baseUrl = 'https://avenirbank.example.com';

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
