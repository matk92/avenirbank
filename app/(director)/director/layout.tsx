'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Percent, TrendingUp } from 'lucide-react';
import LanguageSwitcher from '@/components/atoms/LanguageSwitcher';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import DarkVeil from '@/components/DarkVeil';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
	{ href: '/director', label: 'Tableau de bord', icon: LayoutDashboard },
	{ href: '/director/accounts', label: 'Comptes clients', icon: Users },
	{ href: '/director/savings-rate', label: 'Taux d\'épargne', icon: Percent },
	{ href: '/director/stocks', label: 'Actions', icon: TrendingUp },
];

export default function DirectorLayout({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	return (
		<div className="relative min-h-screen bg-(--background) text-white">
			<div className="pointer-events-none fixed inset-0 z-0 h-screen w-screen opacity-90">
				<DarkVeil hueShift={15} noiseIntensity={0.05} scanlineIntensity={0} scanlineFrequency={0} warpAmount={0.15} speed={0.4} resolutionScale={0.75} />
			</div>

			<div className="relative z-10">
				<nav className="glass-panel sticky top-0 z-50 border-b border-amber-500/20 px-4 py-3">
					<div className="mx-auto flex max-w-7xl items-center justify-between">
						<div className="flex items-center gap-8">
							<Link href="/director" className="text-xl font-bold text-white">
								Avenir Bank <span className="text-amber-500">Directeur</span>
							</Link>
							<div className="hidden gap-4 md:flex">
								{navItems.map((item) => {
									const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
									return (
										<Link
											key={item.href}
											href={item.href}
											className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
												isActive
													? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
													: 'text-white/70 hover:bg-white/10 hover:text-white'
											}`}
										>
											<item.icon className="h-4 w-4" />
											{item.label}
										</Link>
									);
								})}
							</div>
						</div>
						<div className="flex items-center gap-3">
							<LanguageSwitcher />
							<ThemeToggle />
							<Link
								href="/auth/login"
								className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 transition hover:bg-amber-500/30 border border-amber-500/30"
							>
								Déconnexion
							</Link>
						</div>
					</div>
				</nav>
				<main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
			</div>
		</div>
	);
}