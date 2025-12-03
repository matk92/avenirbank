"use client";

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CreditCard, PiggyBank, Send, Sparkles, BadgeDollarSign, TrendingUp, ShieldHalf, Wallet } from 'lucide-react';
import LanguageSwitcher from '@/components/atoms/LanguageSwitcher';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import LiquidChrome from '@/components/LiquidChrome';
import { useI18n } from '@/contexts/I18nContext';

export default function HomeLanding() {
  const { t } = useI18n();

  const quickActions = [
    { icon: Send, label: t('home.quick.transfer') },
    { icon: CreditCard, label: t('home.quick.cards') },
    { icon: PiggyBank, label: t('home.quick.savings') },
    { icon: Sparkles, label: t('home.quick.topup') },
  ];

  const transactions = [
    { label: 'Metal plan fee', amount: '-€13,25', tag: 'Metal', positive: false },
    { label: 'Starbucks', amount: '-€3,50', tag: 'Food', positive: false },
    { label: 'Salary added via IBAN', amount: '+€2 300', tag: 'Income', positive: true },
  ];

  const featureCards = [
    { icon: Wallet, title: t('home.feature.accounts'), description: t('home.feature.accountsDetail') },
    { icon: BadgeDollarSign, title: t('home.feature.fx'), description: t('home.feature.fxDetail') },
    { icon: TrendingUp, title: t('home.feature.investments'), description: t('home.feature.investmentsDetail') },
    { icon: ShieldHalf, title: t('home.feature.security'), description: t('home.feature.securityDetail') },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <LiquidChrome
          baseColor={[0.55, 0.6, 0.68]}
          amplitude={0.4}
          frequencyX={2.3}
          frequencyY={1.5}
          speed={0.3}
          interactive={false}
          className="h-full w-full"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(100,116,255,0.15),transparent_45%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.1),transparent_55%)]" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,#ffffff05,transparent_45%)]" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-14 px-6 pb-24 pt-8 lg:gap-16">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold text-white">
              A
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-white/50">Avenir</p>
              <h1 className="text-2xl font-semibold text-white">Banking, refined</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <section className="rounded-[36px] border border-white/10 bg-black/40 p-8 shadow-[0_50px_120px_rgba(0,0,0,0.35)] backdrop-blur-3xl sm:p-12">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
                  {t('home.tagline')}
                </p>
                <h2 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                  {t('home.heroTitle')}
                </h2>
                <p className="text-lg text-white/70 md:text-xl">{t('home.heroSubtitle')}</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button asChild>
                  <Link href="/client" className="gap-3">
                    {t('home.ctaClient')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/client/accounts" className="gap-3">
                    {t('home.ctaDiscover')}
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card hover className="space-y-3 border-white/15 bg-black/30">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/60">{t('home.metric.volumeLabel')}</p>
                  <p className="text-4xl font-semibold text-white">€2,8M</p>
                  <p className="text-sm text-success">+18% {t('home.metric.vsLastMonth')}</p>
                </Card>
                <Card hover className="space-y-3 border-white/15 bg-black/25">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/60">{t('home.metric.npsLabel')}</p>
                  <p className="text-4xl font-semibold text-white">74</p>
                  <p className="text-sm text-white/70">NPS</p>
                </Card>
              </div>
            </div>

            <div className="w-full rounded-4xl border border-white/15 bg-black/60 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
              <div className="rounded-3xl border border-white/10 bg-linear-to-b from-white/10 to-white/0 p-5">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Main · EUR</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <p className="mt-4 text-4xl font-semibold">€520</p>
                <div className="mt-6 grid grid-cols-4 gap-2 text-center text-xs text-white/80">
                  {quickActions.map((action) => (
                    <div key={action.label} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/10 p-2">
                      <action.icon className="h-4 w-4" />
                      <span>{action.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-white/15 bg-black/60 p-5">
                <div className="mb-4 flex items-center justify-between text-sm text-white/60">
                  <span>{t('home.preview.cards')}</span>
                  <button className="text-xs font-semibold text-white/90">{t('home.preview.manage')}</button>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-linear-to-r from-[#1f1b2e] to-[#2c2545] px-4 py-3">
                    <p className="text-sm text-white/70">Metal</p>
                    <p className="text-lg font-semibold">Visa · 8930</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-linear-to-r from-[#2f1f3a] to-[#371f43] px-4 py-3 opacity-75">
                    <p className="text-sm text-white/70">Online</p>
                    <p className="text-lg font-semibold">Mastercard · 1044</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-white/15 bg-black/60 p-5">
                <div className="mb-3 flex items-center justify-between text-sm text-white/60">
                  <span>{t('home.preview.activity')}</span>
                  <button className="text-xs font-semibold text-white/90">{t('home.preview.seeAll')}</button>
                </div>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.label} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-white">{transaction.label}</p>
                        <p className="text-xs text-white/50">{transaction.tag}</p>
                      </div>
                      <span className={transaction.positive ? 'text-success font-semibold' : 'text-white font-semibold'}>
                        {transaction.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-white/50">{t('home.sections.features')}</p>
              <h3 className="text-3xl font-semibold">{t('home.featuresTitle')}</h3>
            </div>
            <Link href="/client/investments" className="text-sm font-medium text-white/60 hover:text-white">
              {t('home.featuresCta')}
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {featureCards.map((feature) => (
              <Card key={feature.title} hover className="flex items-start gap-4 border-white/15 bg-black/60 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{feature.title}</p>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/15 bg-black/65 p-8 text-white backdrop-blur-3xl lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">{t('home.preview.premium')}</p>
            <h4 className="text-2xl font-semibold">{t('home.preview.premiumTitle')}</h4>
            <p className="text-white/70">{t('home.preview.premiumSubtitle')}</p>
            <div className="flex flex-wrap gap-4">
              <Button>
                {t('home.preview.ctaPrimary')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost">{t('home.preview.ctaSecondary')}</Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-linear-to-br from-[#1f162f] to-[#2c2545] p-4">
              <p className="text-sm text-white/60">{t('home.preview.cards')}</p>
              <p className="text-2xl font-semibold">Metal · €13,25</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-linear-to-br from-[#122637] to-[#103244] p-4">
              <p className="text-sm text-white/60">{t('home.preview.fx')}</p>
              <p className="text-2xl font-semibold">{t('home.preview.fxValue')}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
