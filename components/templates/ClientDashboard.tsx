'use client';

import Link from 'next/link';
import { ArrowUpRight, Bell, PiggyBank, Plus, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Stat from '@/components/atoms/Stat';
import SectionTitle from '@/components/atoms/SectionTitle';
import Badge from '@/components/atoms/Badge';
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
  const unreadNotifications = state.notifications.filter((notification) => !notification.read).length;

  const quickActions = [
    { href: '/client/accounts', label: t('dashboard.action.createAccount'), icon: Wallet },
    { href: '/client/savings', label: t('dashboard.action.openSavings'), icon: PiggyBank },
    { href: '/client/investments', label: t('dashboard.action.placeOrder'), icon: TrendingUp },
    { href: '/client/messages', label: t('navigation.messages'), icon: Sparkles },
  ];

  const highlightedAccounts = state.accounts.slice(0, 2);

  const quickActionClasses =
    'group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-xs font-semibold text-white/80 transition hover:border-white/40 hover:bg-white/10';

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="glass-panel rounded-3xl border border-white/15 p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.5em] text-white/50">{t('dashboard.overviewTitle')}</p>
                <h1 className="text-3xl font-semibold text-white">
                  {t('dashboard.greeting', { name: state.profile.firstName })}
                </h1>
              </div>
              <Badge tone="neutral">Metal plan</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">{t('dashboard.totalBalance')}</p>
                <p className="mt-2 text-4xl font-semibold text-white">{formatCurrency(totalBalance, language)}</p>
                <p className="text-sm text-success">+4.8% {t('home.metric.vsLastMonth')}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">{t('dashboard.accountsSection')}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{state.accounts.length}</p>
                <p className="text-sm text-white/60">{t('dashboard.accountsActiveLabel')}</p>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em] text-white/50">
                {t('dashboard.quickActions')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href} className={quickActionClasses}>
                    <action.icon className="h-5 w-5 text-white" />
                    <span>{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Card hover className="h-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">{t('dashboard.activityFeed')}</p>
              <h3 className="text-lg font-semibold text-white">{t('dashboard.highlightsTitle')}</h3>
            </div>
            <div className="rounded-2xl border border-white/10 px-3 py-1 text-xs text-white/70">
              <Bell className="mr-1 inline h-4 w-4" />
              {t('dashboard.notifications.unread', { count: unreadNotifications })}
            </div>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-white/60">{t('dashboard.emptyActivity')}</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50" suppressHydrationWarning>
                    {formatDateTime(item.publishedAt, language)}
                  </p>
                  <p className="text-base font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-white/70">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat
          label={t('dashboard.totalBalance')}
          value={formatCurrency(totalBalance, language)}
          icon={<ArrowUpRight className="h-5 w-5" />}
          trend="up"
          trendValue="+4.8%"
        />
        <Stat
          label={t('dashboard.accountsSection')}
          value={String(state.accounts.length)}
          icon={<Wallet className="h-5 w-5" />}
          trend="neutral"
          trendValue={t('dashboard.trend.stable')}
        />
        <Stat
          label={t('dashboard.notifications.title')}
          value={String(unreadNotifications)}
          icon={<Bell className="h-5 w-5" />}
          trend={unreadNotifications > 0 ? 'up' : 'neutral'}
          trendValue={unreadNotifications > 0 ? `+${unreadNotifications}` : '0'}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card hover>
          <SectionTitle title={t('dashboard.featuredAccountsTitle')} />
          <div className="grid gap-4 md:grid-cols-2">
            {highlightedAccounts.map((account) => (
              <div key={account.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">{account.name}</p>
                  <Badge tone="success">{account.currency}</Badge>
                </div>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatCurrency(account.balance, language)}
                </p>
                <p className="text-xs text-white/50">IBAN {account.iban}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card hover className="space-y-5">
          <SectionTitle title={t('dashboard.quickMessagingTitle')} />
          <p className="text-sm text-white/70">
            {t('dashboard.quickMessagingHelp')}
          </p>
          <Button asChild>
            <Link href="/client/messages" className="gap-2">
              <Plus className="h-4 w-4" />
              {t('dashboard.newMessage')}
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
