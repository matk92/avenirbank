'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Stat from '@/components/atoms/Stat';
import Button from '@/components/atoms/Button';
import { useDirectorData } from '@/contexts/DirectorDataContext';
import { Users, Ban, Pause, TrendingUp, Plus, Settings, Percent } from 'lucide-react';

export default function DirectorDashboard() {
	const { stats, setStats } = useDirectorData();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const token = localStorage.getItem('token');
				const response = await fetch('/api/director/stats', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setStats(data);
				}
			} catch (error) {
				console.error('Error fetching stats:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchStats();
	}, [setStats]);

	if (isLoading) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="text-zinc-400">Chargement...</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="mb-2 text-4xl font-bold text-white">Tableau de bord</h1>
				<p className="text-zinc-400">Vue d'ensemble de votre banque</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Stat
					label="Comptes actifs"
					value={stats.activeAccounts.toString()}
					icon={<Users className="h-5 w-5" />}
				/>
				<Stat
					label="Comptes suspendus"
					value={stats.suspendedAccounts.toString()}
					icon={<Pause className="h-5 w-5" />}
				/>
				<Stat
					label="Comptes bannis"
					value={stats.bannedAccounts.toString()}
					icon={<Ban className="h-5 w-5" />}
				/>
				<Stat
					label="Actions disponibles"
					value={stats.availableStocks.toString()}
					icon={<TrendingUp className="h-5 w-5" />}
				/>
			</div>

			<Card className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border-amber-500/30">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="mb-2 text-lg font-semibold text-white">Taux d'épargne actuel</h3>
						<p className="text-4xl font-bold text-amber-400">{stats.currentSavingsRate.toFixed(2)}%</p>
						<p className="mt-2 text-sm text-zinc-400">
							Appliqué à tous les comptes d'épargne
						</p>
					</div>
					<Link href="/director/savings-rate">
						<Button
							variant="primary"
							className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-[0_15px_35px_rgba(245,158,11,0.35)]"
						>
							<Settings className="h-4 w-4" />
							Modifier
						</Button>
					</Link>
				</div>
			</Card>

			<div>
				<h2 className="mb-4 text-2xl font-bold text-white">Actions rapides</h2>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Link href="/director/accounts/create">
						<Card hover className="h-full cursor-pointer">
							<div className="flex items-center gap-4">
								<div className="rounded-full bg-amber-500/20 p-3">
									<Plus className="h-6 w-6 text-amber-400" />
								</div>
								<div>
									<h3 className="font-semibold text-white">Créer un compte</h3>
									<p className="text-sm text-zinc-400">Nouveau compte client</p>
								</div>
							</div>
						</Card>
					</Link>

					<Link href="/director/savings-rate">
						<Card hover className="h-full cursor-pointer">
							<div className="flex items-center gap-4">
								<div className="rounded-full bg-amber-500/20 p-3">
									<Percent className="h-6 w-6 text-amber-400" />
								</div>
								<div>
									<h3 className="font-semibold text-white">Modifier le taux</h3>
									<p className="text-sm text-zinc-400">Taux d'épargne</p>
								</div>
							</div>
						</Card>
					</Link>

					<Link href="/director/stocks/create">
						<Card hover className="h-full cursor-pointer">
							<div className="flex items-center gap-4">
								<div className="rounded-full bg-amber-500/20 p-3">
									<TrendingUp className="h-6 w-6 text-amber-400" />
								</div>
								<div>
									<h3 className="font-semibold text-white">Créer une action</h3>
									<p className="text-sm text-zinc-400">Nouvelle action</p>
								</div>
							</div>
						</Card>
					</Link>
				</div>
			</div>

			<Card>
				<h3 className="mb-4 text-xl font-bold text-white">Résumé</h3>
				<div className="space-y-3">
					<div className="flex justify-between">
						<span className="text-zinc-400">Total des comptes</span>
						<span className="font-semibold text-white">{stats.totalAccounts}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-zinc-400">Total des actions</span>
						<span className="font-semibold text-white">{stats.totalStocks}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-zinc-400">Actions disponibles</span>
						<span className="font-semibold text-white">{stats.availableStocks}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-zinc-400">Actions indisponibles</span>
						<span className="font-semibold text-white">
							{stats.totalStocks - stats.availableStocks}
						</span>
					</div>
				</div>
			</Card>
		</div>
	);
}