'use client';

import { useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-emerald-50/40 px-6 text-center">
      <h1 className="text-4xl font-semibold text-emerald-900">{t('errors.500.title')}</h1>
      <p className="max-w-md text-sm text-emerald-700">{t('errors.500.message')}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        {t('errors.action.backHome')}
      </button>
    </div>
  );
}
