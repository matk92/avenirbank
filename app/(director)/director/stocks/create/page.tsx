'use client';

import { useRouter } from 'next/navigation';
import StockManagementForm from '@/components/director/StockManagementForm';
import { useDirectorData } from '@/contexts/DirectorDataContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateStockPage() {
	const router = useRouter();
	const { addStock } = useDirectorData();

	const handleSubmit = async (data: any) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/director/stocks', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error('Erreur lors de la création de l\'action');
			}

			const newStock = await response.json();
			addStock(newStock);

			setTimeout(() => {
				router.push('/director/stocks');
			}, 1500);
		} catch (error) {
			console.error('Error creating stock:', error);
			throw error;
		}
	};

	return (
		<div className="space-y-6">
			<Link
				href="/director/stocks"
				className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
			>
				<ArrowLeft className="h-4 w-4" />
				Retour aux actions
			</Link>

			<div>
				<h1 className="mb-2 text-4xl font-bold text-white">Créer une action</h1>
				<p className="text-zinc-400">Ajoutez une nouvelle action disponible pour vos clients</p>
			</div>

			<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
				<p className="text-sm text-amber-300">
					Le prix que vous définissez ici est le prix initial. Le cours de l'action sera ensuite géré automatiquement par le système.
				</p>
			</div>

			<StockManagementForm mode="create" onSubmit={handleSubmit} />
		</div>
	);
}