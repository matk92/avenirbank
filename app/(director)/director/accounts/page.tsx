'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import ClientAccountsList from '@/components/director/ClientAccountsList';
import { useDirectorData } from '@/contexts/DirectorDataContext';
import { Plus } from 'lucide-react';

export default function AccountsPage() {
	const { accounts, setAccounts, updateAccount } = useDirectorData();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchAccounts = async () => {
			try {
				const token = localStorage.getItem('token');
				const response = await fetch('/api/director/accounts', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setAccounts(data);
				}
			} catch (error) {
				console.error('Error fetching accounts:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchAccounts();
	}, [setAccounts]);

	const handleSuspend = async (accountId: string) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`/api/director/accounts/${accountId}/suspend`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const updatedAccount = await response.json();
				updateAccount(updatedAccount);
			}
		} catch (error) {
			console.error('Error suspending account:', error);
			throw error;
		}
	};

	const handleBan = async (accountId: string) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`/api/director/accounts/${accountId}/ban`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const updatedAccount = await response.json();
				updateAccount(updatedAccount);
			}
		} catch (error) {
			console.error('Error banning account:', error);
			throw error;
		}
	};

	const handleReactivate = async (accountId: string) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`/api/director/accounts/${accountId}/reactivate`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const updatedAccount = await response.json();
				updateAccount(updatedAccount);
			}
		} catch (error) {
			console.error('Error reactivating account:', error);
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
					<h1 className="mb-2 text-4xl font-bold text-white">Comptes clients</h1>
					<p className="text-zinc-400">Gérez tous les comptes clients</p>
				</div>
				<Link href="/director/accounts/create">
					<Button
						variant="primary"
						className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-[0_15px_35px_rgba(245,158,11,0.35)]"
					>
						<Plus className="h-4 w-4" />
						Créer un compte
					</Button>
				</Link>
			</div>

			<ClientAccountsList
				accounts={accounts}
				onSuspend={handleSuspend}
				onBan={handleBan}
				onReactivate={handleReactivate}
			/>
		</div>
	);
}