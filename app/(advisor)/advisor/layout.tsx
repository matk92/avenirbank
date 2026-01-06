'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Newspaper, Bell, MessageSquare, Users } from 'lucide-react';
import LanguageSwitcher from '@/components/atoms/LanguageSwitcher';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import DarkVeil from '@/components/DarkVeil';
import { logout } from '@/lib/logout';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import Badge from '@/components/atoms/Badge';
import { useMessaging } from '@/contexts/MessagingContext';
const navItems: { href: string; label: string; icon: LucideIcon }[] = [
	{ href: '/advisor', label: 'Tableau de bord', icon: LayoutDashboard },
	{ href: '/advisor/activities', label: 'Actualités', icon: Newspaper },
	{ href: '/advisor/notifications', label: 'Notifications', icon: Bell },
	{ href: '/advisor/messages', label: 'Messages clients', icon: MessageSquare },
	{ href: '/advisor/group-chat', label: 'Discussion groupe', icon: Users },
];

export default function AdvisorLayout({ children }: { children: ReactNode }) {
	const { unreadTotal } = useMessaging();
	const pathname = usePathname();
	const router = useRouter();

	return (
		<div className="relative min-h-screen bg-(--background) text-white">
			<div className="pointer-events-none fixed inset-0 z-0 h-screen w-screen opacity-90">
				<DarkVeil hueShift={-25} noiseIntensity={0.05} scanlineIntensity={0} scanlineFrequency={0} warpAmount={0.15} speed={0.4} resolutionScale={0.75} />
			</div>

			<div className="relative z-10">
				<nav className="glass-panel sticky top-0 z-50 border-b border-white/10 px-4 py-3">
					<div className="mx-auto flex max-w-7xl items-center justify-between">
						<div className="flex items-center gap-8">
							<Link href="/advisor" className="text-xl font-bold text-white">
								Avenir Bank <span className="text-emerald-500">Conseiller</span>
							</Link>
							<div className="hidden gap-4 md:flex">
								{navItems.map((item) => {
									const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
									const isMessages = item.href === '/advisor/messages';
									return (
										<Link
											key={item.href}
											href={item.href}
											className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
												isActive
													? 'bg-emerald-500/20 text-emerald-400'
													: 'text-white/70 hover:bg-white/10 hover:text-white'
											}`}
										>
											<item.icon className="h-4 w-4" />
											<span>{item.label}</span>
											{isMessages && unreadTotal > 0 && (
												<Badge tone="success" className="shrink-0 px-2 py-0.5">
													{unreadTotal}
												</Badge>
											)}
										</Link>
									);
								})}
							</div>
						</div>
						<div className="flex items-center gap-3">
							<LanguageSwitcher />
							<ThemeToggle />
							<button
								type="button"
								onClick={async () => {
									await logout();
									router.replace('/login');
								}}
								className="cursor-pointer rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
							>
								Déconnexion
							</button>
						</div>
					</div>
				</nav>
				<main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
			</div>
		</div>
	);
}