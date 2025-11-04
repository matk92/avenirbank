'use client';

import Link from 'next/link';
import { Euro, Wallet, Bell, Plus, PiggyBank, TrendingUp } from 'lucide-react';
import Card from '@/components/atoms/Card';
import Stat from '@/components/atoms/Stat';
import SectionTitle from '@/components/atoms/SectionTitle';
import { useClientData } from '@/contexts/ClientDataContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatDateTime } from '@/lib/format';

export default function ClientDashboard() {
  const { state } = useClientData();
  const { t, language } = useI18n();

  const totalBalance = state.accounts
    .filter((account) => account.status === 'active')
    .reduce((acc, account) => acc + account.balance, 0);

  const recentActivity = state.activity.slice(0, 2);

  const baseLinkStyles =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500';
  const primaryLinkStyles = `${baseLinkStyles} bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200/50`;
  const secondaryLinkStyles = `${baseLinkStyles} bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-100`;
  const ghostLinkStyles = `${baseLinkStyles} text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {t('dashboard.greeting', { name: state.profile.firstName })}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t('dashboard.overviewTitle')}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat
          label={t('dashboard.totalBalance')}
          value={formatCurrency(totalBalance, language)}
          icon={<Euro className="h-5 w-5" />}
        />
        <Stat
          label={t('dashboard.accountsSection')}
          value={String(state.accounts.length)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <Stat
          label="Notifications"
          value={String(state.notifications.filter((n) => !n.read).length)}
          icon={<Bell className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card hover>
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('dashboard.quickActions')}</h2>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Plus className="h-5 w-5" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/client/accounts" className={primaryLinkStyles}>
                <Wallet className="h-4 w-4" />
                {t('dashboard.action.createAccount')}
              </Link>
              <Link href="/client/savings" className={secondaryLinkStyles}>
                <PiggyBank className="h-4 w-4" />
                {t('dashboard.action.openSavings')}
              </Link>
              <Link href="/client/investments" className={ghostLinkStyles}>
                <TrendingUp className="h-4 w-4" />
                {t('dashboard.action.placeOrder')}
              </Link>
            </div>
          </div>
        </Card>
        
        <Card hover>
          <SectionTitle title={t('dashboard.activityFeed')} />
          {recentActivity.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('dashboard.emptyActivity')}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-emerald-200 dark:border-zinc-700 dark:hover:border-emerald-600">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{formatDateTime(item.publishedAt, language)}</p>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
