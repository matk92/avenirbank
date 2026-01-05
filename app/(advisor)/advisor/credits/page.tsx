'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
import { Credit } from '@/lib/types-advisor';
import { Plus, DollarSign } from 'lucide-react';

export default function CreditsPage() {
	const [credits, setCredits] = useState<Credit[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [filterStatus, setFilterStatus] = useState<string>('all');

	useEffect(() => {
		const fetchCredits = async () => {
			try {
				const token = localStorage.getItem('token');
				const response = await fetch('/api/advisor/credits', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setCredits(data);
				}
			} catch (error) {
				console.error('Error fetching credits:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchCredits();
	}, []);

	const filteredCredits = filterStatus === 'all'
		? credits
		: credits.filter((credit) => credit.status === filterStatus);

	const getStatusBadge = (status: Credit['status']) => {
		switch (status) {
			case 'pending':
				return <Badge tone="warning">En attente</Badge>;
			case 'approved':
				return <Badge tone="info">Approuvé</Badge>;
			case 'rejected':
			return <Badge tone="warning">Refusé</Badge>;
		case 'active':
			return <Badge tone="success">Actif</Badge>;
		case 'completed':
			return <Badge tone="neutral">Terminé</Badge>;
		}
	};

	const formatCurrency = (amount: number) => {
		return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('fr-FR');
	};

	if (isLoading) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="text-zinc-400">Chargement...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="mb-2 text-4xl font-bold text-white">Crédits</h1>
					<p className="text-zinc-400">Gérez les crédits de vos clients</p>
				</div>
				<Link href="/advisor/credits/create">
					<Button variant="primary">
						<Plus className="h-4 w-4" />
						Nouveau crédit
					</Button>
				</Link>
			</div>
			<Card>
				<div className="flex items-center gap-4">
					<label htmlFor="filterStatus" className="text-sm font-medium text-zinc-300">
						Filtrer par statut :
					</label>
					<Select
						id="filterStatus"
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
						className="w-64"
					>
						<option value="all">Tous les statuts</option>
						<option value="pending">En attente</option>
						<option value="approved">Approuvés</option>
						<option value="rejected">Refusés</option>
						<option value="active">Actifs</option>
						<option value="completed">Terminés</option>
					</Select>
					<span className="text-sm text-zinc-400">
						{filteredCredits.length} crédit{filteredCredits.length > 1 ? 's' : ''}
					</span>
				</div>
			</Card>
			{filteredCredits.length === 0 ? (
				<Card className="text-center">
					<div className="py-12">
						<DollarSign className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
						<h3 className="mb-2 text-lg font-semibold text-white">Aucun crédit</h3>
						<p className="mb-4 text-sm text-zinc-400">
							{filterStatus === 'all'
								? 'Vous n\'avez pas encore octroyé de crédit'
								: 'Aucun crédit ne correspond aux filtres sélectionnés'}
						</p>
						{filterStatus === 'all' && (
							<Link href="/advisor/credits/create">
								<Button variant="primary">Octroyer un crédit</Button>
							</Link>
						)}
					</div>
				</Card>
			) : (
				<div className="space-y-4">
					{filteredCredits.map((credit) => (
						<Card key={credit.id} hover>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="mb-2 flex items-center gap-3">
										<h3 className="text-xl font-semibold text-white">{credit.clientName}</h3>
										{getStatusBadge(credit.status)}
									</div>

									<div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
										<div>
											<p className="text-xs text-zinc-500">Montant</p>
											<p className="font-semibold text-white">{formatCurrency(credit.amount)}</p>
										</div>
										<div>
											<p className="text-xs text-zinc-500">Mensualité</p>
											<p className="font-semibold text-emerald-400">
												{formatCurrency(credit.monthlyPayment + credit.monthlyInsurance)}
											</p>
										</div>
										<div>
											<p className="text-xs text-zinc-500">Taux annuel</p>
											<p className="font-semibold text-white">{credit.annualInterestRate}%</p>
										</div>
										<div>
											<p className="text-xs text-zinc-500">Durée</p>
											<p className="font-semibold text-white">{credit.durationMonths} mois</p>
										</div>
									</div>

									<div className="flex items-center gap-4 text-xs text-zinc-500">
										<span>Créé le {formatDate(credit.createdAt)}</span>
										{credit.approvedAt && (
											<>
												<span>•</span>
												<span>Approuvé le {formatDate(credit.approvedAt)}</span>
											</>
										)}
										<span>•</span>
										<span>Restant : {formatCurrency(credit.remainingAmount)}</span>
									</div>
								</div>

								<Button variant="secondary" size="sm">
									Détails
								</Button>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}