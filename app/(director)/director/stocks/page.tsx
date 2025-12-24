'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import StockList from '@/components/director/StockList';
import { useDirectorData } from '@/contexts/DirectorDataContext';
import { Plus } from 'lucide-react';

export default function StocksPage() {
	const { stocks, setStocks, updateStock, deleteStock } = useDirectorData();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchStocks = async () => {
			try {
				const token = localStorage.getItem('token');
				const response = await fetch('/api/director/stocks', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setStocks(data);
				}
			} catch (error) {
				console.error('Error fetching stocks:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchStocks();
	}, [setStocks]);

	const handleToggleAvailability = async (stockId: string, currentAvailability: boolean) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`/api/director/stocks/${stockId}/availability`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ isAvailable: !currentAvailability }),
			});

			if (response.ok) {
				const updatedStock = await response.json();
				updateStock(updatedStock);
			}
		} catch (error) {
			console.error('Error toggling stock availability:', error);
			throw error;
		}
	};

	const handleDelete = async (stockId: string) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`/api/director/stocks/${stockId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				deleteStock(stockId);
			}
		} catch (error) {
			console.error('Error deleting stock:', error);
			throw error;
		}
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
					<h1 className="mb-2 text-4xl font-bold text-white">Actions</h1>
					<p className="text-zinc-400">Gérez les actions disponibles pour vos clients</p>
				</div>
				<Link href="/director/stocks/create">
					<Button
						variant="primary"
						className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-[0_15px_35px_rgba(245,158,11,0.35)]"
					>
						<Plus className="h-4 w-4" />
						Créer une action
					</Button>
				</Link>
			</div>

			<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
				<p className="text-sm text-amber-300">
					<strong>Note :</strong> Le cours des actions est géré automatiquement par le système. Vous pouvez uniquement gérer la disponibilité des actions et créer de nouvelles actions. Les clients sont propriétaires de leurs actions.
				</p>
			</div>

			<StockList
				stocks={stocks}
				onToggleAvailability={handleToggleAvailability}
				onDelete={handleDelete}
			/>
		</div>
	);
}