import type { Language } from './i18n';

export function formatCurrency(amount: number, locale: Language = 'fr'): string {
  const intlLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(value: string | number | Date, locale: Language = 'fr'): string {
  const date = value instanceof Date ? value : new Date(value);
  const intlLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatRelativeDays(days: number, locale: Language = 'fr'): string {
  const intlLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';
  const formatter = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' });
  return formatter.format(days, 'day');
}
