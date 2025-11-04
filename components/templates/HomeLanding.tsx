'use client';

import Link from 'next/link';
import { ArrowRight, Wallet, PiggyBank, TrendingUp, MessageSquare, CheckCircle2 } from 'lucide-react';
import LanguageSwitcher from '@/components/atoms/LanguageSwitcher';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import Card from '@/components/atoms/Card';
import { useI18n } from '@/contexts/I18nContext';

export default function HomeLanding() {
  const { t } = useI18n();

  const baseLinkStyles =
    'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500';

  const features = [
    { icon: Wallet, title: t('home.feature.accounts') },
    { icon: PiggyBank, title: t('home.feature.savings') },
    { icon: TrendingUp, title: t('home.feature.investments') },
    { icon: MessageSquare, title: t('home.feature.realtime') },
  ];

  return (
  <div className="min-h-screen bg-linear-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200/50">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Avenir Bank</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-20 px-6 py-12 pb-24">
        <section className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight text-zinc-900 dark:text-zinc-100 lg:text-6xl">
                {t('home.heroTitle')}
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-400">{t('home.heroSubtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/client" className={`${baseLinkStyles} bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 hover:bg-emerald-700`}>
                {t('home.ctaClient')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/client/accounts" className={`${baseLinkStyles} bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-100`}>
                {t('home.ctaDiscover')}
              </Link>
            </div>
          </div>

          <Card hover className="bg-linear-to-br from-emerald-50 to-white p-8 dark:from-emerald-950/20 dark:to-zinc-900">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Avenir Bank</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">2025</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{t('home.detail.accounts')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{t('home.detail.rate')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{t('home.detail.orderbook')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{t('home.detail.realtime')}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t('home.featuresTitle')}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} hover className="text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <Icon className="h-7 w-7" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{feature.title}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
