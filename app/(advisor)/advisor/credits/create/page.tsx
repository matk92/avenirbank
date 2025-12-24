'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreditForm from '@/components/advisor/CreditForm';
import { ClientProfile } from '@/lib/types-advisor';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateCreditPage() {
	const router = useRouter();
	const [clients, setClients] = useState<ClientProfile[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchClients = async () => {
			try {
				const token = localStorage.getItem('token');
				const response = await fetch('/api/advisor/clients', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setClients(data);
				}
			} catch (error) {
				console.error('Error fetching clients:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchClients();
	}, []);

	const handleSubmit = async (data: any) => {
		try {
			const token = localStorage.getItem('token');
			const monthlyRate = data.annualInterestRate / 100 / 12;
			const monthlyPayment =
				monthlyRate === 0
					? data.amount / data.durationMonths
					: (data.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -data.durationMonths));

			const totalInsurance = (data.amount * data.insuranceRate) / 100;
			const monthlyInsurance = totalInsurance / data.durationMonths;
			const totalAmount = monthlyPayment * data.durationMonths + totalInsurance;

			const response = await fetch('/api/advisor/credits', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					...data,
					monthlyPayment,
					monthlyInsurance,
					totalAmount,
					remainingAmount: data.amount,
					status: 'pending',
				}),
			});

			if (!response.ok) {
				throw new Error('Erreur lors de la création du crédit');
			}

			setTimeout(() => {
				router.push('/advisor/credits');
			}, 2000);
		} catch (error) {
			console.error('Error creating credit:', error);
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
			<Link
				href="/advisor/credits"
				className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
			>
				<ArrowLeft className="h-4 w-4" />
				Retour aux crédits
			</Link>

			<div>
				<h1 className="mb-2 text-4xl font-bold text-white">Octroyer un crédit</h1>
				<p className="text-zinc-400">Créez un nouveau crédit pour un client</p>
			</div>

			<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
				<p className="text-sm text-emerald-300">
					<strong>Méthode de calcul :</strong> Mensualité constante avec assurance obligatoire. L'assurance est calculée sur le montant total du crédit et prélevée mensuellement.
				</p>
			</div>

			<CreditForm clients={clients} onSubmit={handleSubmit} />
		</div>
	);
}