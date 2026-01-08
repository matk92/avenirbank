'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Wallet, PiggyBank, TrendingUp, Newspaper, MessageSquare } from 'lucide-react';
import LanguageSwitcher from '@/components/atoms/LanguageSwitcher';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import DarkVeil from '@/components/DarkVeil';
import Badge from '@/components/atoms/Badge';
import { useI18n } from '@/contexts/I18nContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { useClientData } from '@/contexts/ClientDataContext';
import type { TranslationKey } from '@/lib/i18n';
import { logout } from '@/lib/logout';
import { useEffect, useMemo, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

const navItems: { href: string; labelKey: TranslationKey; icon: LucideIcon }[] = [
	{ href: '/client', labelKey: 'navigation.dashboard', icon: LayoutDashboard },
	{ href: '/client/accounts', labelKey: 'navigation.accounts', icon: Wallet },
	{ href: '/client/savings', labelKey: 'navigation.savings', icon: PiggyBank },
	{ href: '/client/investments', labelKey: 'navigation.investments', icon: TrendingUp },
	{ href: '/client/activity', labelKey: 'navigation.activity', icon: Newspaper },
	{ href: '/client/messages', labelKey: 'navigation.messages', icon: MessageSquare },
];

function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

async function ensurePushSubscription() {
	if (typeof window === 'undefined') return;
	if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

	const token = localStorage.getItem('token');
	if (!token) return;

	const keyResp = await fetch('/api/push/vapid-public-key', { cache: 'no-store' });
	const keyData = (await keyResp.json().catch(() => null)) as { publicKey?: string | null } | null;
	const publicKey = keyData?.publicKey;
	if (!publicKey) return;

	const registration = await navigator.serviceWorker.register('/push-sw.js');
	let subscription = await registration.pushManager.getSubscription();

	if (!subscription) {
		const permission = await Notification.requestPermission();
		if (permission !== 'granted') return;

		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey),
		});
	}

	await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(subscription),
	});
}

export default function ClientShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const { t, language } = useI18n();
	const { unreadTotal } = useMessaging();
	const { state } = useClientData();

	const normalizeText = (value: string) =>
		value
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/\u2019/g, "'")
			.toLowerCase();

	const isSavingsRateNotification = (message: string) => {
		const normalized = normalizeText(message);
		return normalized.includes('taux') && normalized.includes('epargne');
	};

	const unreadSavingsRateNotifications = useMemo(
		() =>
			state.notifications.filter(
				(notification) =>
					!notification.read &&
					isSavingsRateNotification(notification.message),
			).length,
		[state.notifications],
	);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (!('Notification' in window)) return;

		// Some browsers will ignore/block permission prompts without a user gesture.
		// So we only request permission on the first user interaction.
		const run = () =>
			ensurePushSubscription().catch(() => {
				// silent: push is a bonus feature
			});

		if (Notification.permission === 'granted') {
			run();
			return;
		}

		if (Notification.permission !== 'default') {
			// denied
			return;
		}

		const onFirstClick = () => {
			window.removeEventListener('click', onFirstClick);
			run();
		};
		window.addEventListener('click', onFirstClick, { once: true });
		return () => {
			window.removeEventListener('click', onFirstClick);
		};
	}, []);

	return (
		<div className="relative min-h-screen bg-(--background) text-white">
			<div className="pointer-events-none fixed inset-0 z-0 h-screen w-screen opacity-90">
				<DarkVeil hueShift={-25} noiseIntensity={0.05} scanlineIntensity={0} scanlineFrequency={0} warpAmount={0.15} speed={0.4} resolutionScale={0.75} />
			</div>

			<div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-0">
				<header className="glass-panel rounded-3xl p-6 sm:p-8">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex items-center gap-4">
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl font-semibold text-white">
								R
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.4em] text-white/50">Avenir</p>
								<h1 className="text-2xl font-semibold">{t('clientPortal.title')}</h1>
								<p className="text-sm text-white/60">{t('clientPortal.subtitle')}</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<ThemeToggle />
							<LanguageSwitcher />
							<button
								type="button"
								onClick={async () => {
									await logout();
									router.replace('/login');
								}}
								className="cursor-pointer rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
							>
								{t('navigation.logout')}
							</button>
						</div>
					</div>
				</header>

				<nav className="glass-panel flex flex-wrap gap-2 overflow-hidden rounded-3xl p-3 text-sm font-medium">
					{navItems.map((item) => {
						const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
						const Icon = item.icon;
						const isMessages = item.href === '/client/messages';
						const isSavings = item.href === '/client/savings';
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`group flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2 transition ${
									active
										? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.25)]'
										: 'text-white/70 hover:bg-white/10'
								}`}
							>
								<Icon className={`h-4 w-4 ${active ? 'text-black' : 'text-white/60 group-hover:text-white'}`} />
								<span>{t(item.labelKey)}</span>
								{isMessages && unreadTotal > 0 && (
									<Badge
										tone="neutral"
										className={`shrink-0 px-2 py-0.5 ${
											active ? 'border-black/10 bg-black/10 text-black/80' : ''
										}`}
									>
										{unreadTotal}
									</Badge>
								)}
								{isSavings && unreadSavingsRateNotifications > 0 && (
									<Badge
										tone="neutral"
										className={`shrink-0 px-2 py-0.5 ${
											active ? 'border-black/10 bg-black/10 text-black/80' : ''
										}`}
									>
										{unreadSavingsRateNotifications}
									</Badge>
								)}
							</Link>
						);
					})}
				</nav>

				<main className="glass-panel rounded-3xl p-6 sm:p-8">
					{children}
				</main>

				<footer className="pb-6 text-center text-xs text-white/50">
					© {new Date().getFullYear()} Avenir Bank — {language === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}
				</footer>
			</div>
		</div>
	);
}