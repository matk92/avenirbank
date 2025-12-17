import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { getServerT } from '@/lib/i18n-server';

export default async function NotFoundPage() {
  const { t } = await getServerT();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(100,116,255,0.15),transparent_45%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_55%)]" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#ffffff08,transparent_50%)]" />

      <Card className="relative z-10 max-w-xl border-white/15 bg-white/5 p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Compass className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-semibold text-white">{t('errors.404.title')}</h1>
        <p className="mt-3 text-sm text-white/70">{t('errors.404.message')}</p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('errors.action.backHome')}
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href="/client" className="gap-2">
              {t('navigation.dashboard')}
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
