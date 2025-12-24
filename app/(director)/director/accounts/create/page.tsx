'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountManagementForm from '@/components/director/AccountManagementForm';
import { useDirectorData } from '@/contexts/DirectorDataContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateAccountPage() {
	const router = useRouter();
	const { addAccount } = useDirectorData();

	const handleSubmit = async (data: any) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/director/accounts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error('Erreur lors de la création du compte');
			}

			const newAccount = await response.json();
			addAccount(newAccount);
			setTimeout(() => {
				router.push('/director/accounts');
			}, 1500);
		} catch (error) {
			console.error('Error creating account:', error);
			throw error;
		}
	};

	return (
		<div className="space-y-6">
			<Link
				href="/director/accounts"
				className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
			>
				<ArrowLeft className="h-4 w-4" />
				Retour aux comptes
			</Link>

			<div>
				<h1 className="mb-2 text-4xl font-bold text-white">Créer un compte</h1>
				<p className="text-zinc-400">Créez un nouveau compte client</p>
			</div>

			<AccountManagementForm mode="create" onSubmit={handleSubmit} />
		</div>
	);
}