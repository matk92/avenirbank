'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, PiggyBank, TrendingUp, Newspaper, MessageSquare } from 'lucide-react';
import LanguageSwitcher from '@/components/atoms/LanguageSwitcher';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

const navItems: { href: string; labelKey: TranslationKey; icon: LucideIcon }[] = [
	{ href: '/client', labelKey: 'navigation.dashboard', icon: LayoutDashboard },
	{ href: '/client/accounts', labelKey: 'navigation.accounts', icon: Wallet },
	{ href: '/client/savings', labelKey: 'navigation.savings', icon: PiggyBank },
	{ href: '/client/investments', labelKey: 'navigation.investments', icon: TrendingUp },
	{ href: '/client/activity', labelKey: 'navigation.activity', icon: Newspaper },
	{ href: '/client/messages', labelKey: 'navigation.messages', icon: MessageSquare },
];

export default function ClientShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const { t, language } = useI18n();

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
			<div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
				<header className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200/50">
							<svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Avenir Bank</p>
							<h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('clientPortal.title')}</h1>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<ThemeToggle />
						<LanguageSwitcher />
					</div>
				</header>

				<nav className="flex flex-wrap gap-2">
					{navItems.map((item) => {
						const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
						const Icon = item.icon;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
									active
										? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50'
										: 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600'
								}`}
							>
								<Icon className={`h-4 w-4 ${active ? '' : 'opacity-60 group-hover:opacity-100'}`} />
								<span>{t(item.labelKey)}</span>
							</Link>
						);
					})}
				</nav>

				<main className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 sm:p-8">
					{children}
				</main>

				<footer className="pb-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
					© {new Date().getFullYear()} Avenir Bank — {language === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}
				</footer>
			</div>
		</div>
	);
}
