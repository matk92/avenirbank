'use client';

import { useState } from 'react';
import Card from '@/components/atoms/Card';
import SavingsRateForm from '@/components/director/SavingsRateForm';
import { useDirectorData } from '@/contexts/DirectorDataContext';
import { SavingsRateUpdate } from '@/lib/types-director';
import Badge from '@/components/atoms/Badge';

export default function SavingsRatePage() {
	const { currentSavingsRate, updateSavingsRate } = useDirectorData();
	const [history, setHistory] = useState<SavingsRateUpdate[]>([]);
	const [isLoading] = useState(false);

	const handleSubmit = async (newRate: number) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/director/savings-rate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ rate: newRate }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Erreur lors de la modification du taux');
			}

			const result = await response.json();
			updateSavingsRate(newRate);
			
			if (result.data) {
				const update = {
					oldRate: currentSavingsRate,
					newRate: result.data.rate,
					updatedAt: new Date(result.data.createdAt),
					updatedBy: result.data.setBy || 'Director',
					affectedAccounts: 0
				};
				setHistory((prev) => [update, ...prev]);
			}
		} catch (error) {
			console.error('Error updating savings rate:', error);
			throw error;
		}
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="mb-2 text-4xl font-bold text-white">Taux d'épargne</h1>
				<p className="text-zinc-400">Gérez le taux d'épargne de la banque</p>
			</div>

			<SavingsRateForm currentRate={currentSavingsRate} onSubmit={handleSubmit} />

			<Card>
				<h2 className="mb-4 text-2xl font-bold text-white">Historique des modifications</h2>

				{isLoading ? (
					<div className="py-8 text-center text-zinc-400">Chargement...</div>
				) : history.length === 0 ? (
					<div className="py-8 text-center text-zinc-400">Aucune modification enregistrée</div>
				) : (
					<div className="space-y-3">
						{history.map((update, index) => (
							<div
								key={index}
								className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
							>
								<div>
									<div className="mb-1 flex items-center gap-2">
										<span className="font-semibold text-white">
											{update.oldRate.toFixed(2)}% → {update.newRate.toFixed(2)}%
										</span>
										{update.newRate > update.oldRate ? (
											<Badge tone="success">+{(update.newRate - update.oldRate).toFixed(2)}%</Badge>
										) : (
										<Badge tone="warning">{(update.newRate - update.oldRate).toFixed(2)}%</Badge>
										)}
									</div>
									<p className="text-sm text-zinc-400">{formatDate(update.updatedAt)}</p>
									<p className="text-xs text-zinc-500">
										{update.affectedAccounts} compte{update.affectedAccounts > 1 ? 's' : ''}{' '}
										concerné{update.affectedAccounts > 1 ? 's' : ''}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</Card>
		</div>
	);
}