'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import ClientAccountsList from '@/components/director/ClientAccountsList';
import ClientDirectory from '@/components/director/ClientDirectory';
import CreateClientModal from '@/components/director/CreateClientModal';
import { useDirectorData } from '@/contexts/DirectorDataContext';
import { DirectorClient } from '@/lib/types-director';
import { Plus, UserPlus } from 'lucide-react';

export default function AccountsPage() {
	const { accounts, setAccounts, updateAccount } = useDirectorData();
	const [isLoading, setIsLoading] = useState(true);
	const [clients, setClients] = useState<DirectorClient[]>([]);
	const [showCreateClientModal, setShowCreateClientModal] = useState(false);

	const refreshData = async () => {
		const token = localStorage.getItem('token');
		if (!token) return;

		const [accountsResponse, clientsResponse] = await Promise.all([
			fetch('/api/director/accounts', {
				headers: { Authorization: `Bearer ${token}` },
			}),
			fetch('/api/director/clients', {
				headers: { Authorization: `Bearer ${token}` },
			}),
		]);

		if (accountsResponse.ok) {
			const data = await accountsResponse.json();
			setAccounts(data);
		}

		if (clientsResponse.ok) {
			const data = await clientsResponse.json();
			console.log('Clients data received:', data);
			setClients(data?.data ?? []);
		} else {
			console.error('Error fetching clients:', clientsResponse.status);
		}
	};

	useEffect(() => {
		const fetchInitial = async () => {
			try {
				await refreshData();
			} catch (error) {
				console.error('Error fetching data:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchInitial();
	}, []);

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
				await response.json();
				await refreshData();
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
				await response.json();
				await refreshData();
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

	console.log('AccountsPage - clients count:', clients.length);
	console.log('AccountsPage - accounts count:', accounts.length);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="mb-2 text-4xl font-bold text-white">Gestion clients</h1>
					<p className="text-zinc-400">Gérez les clients et leurs comptes</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="secondary"
						onClick={() => setShowCreateClientModal(true)}
						className="bg-white/5 shadow-[0_10px_25px_rgba(5,1,13,0.5)]"
					>
						<UserPlus className="h-4 w-4" />
						Créer un client
					</Button>
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
			</div>

			<ClientDirectory clients={clients} onRefresh={refreshData} />

			<div>
				<h2 className="mb-4 text-2xl font-bold text-white">Tous les comptes</h2>
				<ClientAccountsList
					accounts={accounts}
					onSuspend={handleSuspend}
					onBan={handleBan}
					onReactivate={handleReactivate}
				/>
			</div>

			<CreateClientModal
				isOpen={showCreateClientModal}
				onClose={() => setShowCreateClientModal(false)}
				onSuccess={refreshData}
			/>
		</div>
	);
}