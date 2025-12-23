'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import SectionTitle from '@/components/atoms/SectionTitle';
import PrivateChatPanel from '@/components/advisor/PrivateChatPanel';
import Button from '@/components/atoms/Button';
import { ArrowLeft } from 'lucide-react';

export default function ClientChatPage() {
	const params = useParams();
	const router = useRouter();
	const clientId = params.clientId as string;
	const [clientName, setClientName] = React.useState('');

	React.useEffect(() => {
		fetch(`http://localhost:3001/advisor/clients/${clientId}`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('advisor-token')}`,
			},
		})
			.then((res) => res.json())
			.then((client) => {
				setClientName(`${client.firstName} ${client.lastName}`);
			})
			.catch((error) => {
				console.error('Erreur lors du chargement du client:', error);
			});
	}, [clientId]);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Button onClick={() => router.back()} className="gap-2">
					<ArrowLeft className="h-4 w-4" />
					Retour
				</Button>
				<SectionTitle title={`Discussion avec ${clientName}`} />
			</div>

			<PrivateChatPanel clientId={clientId} clientName={clientName} />
		</div>
	);
}