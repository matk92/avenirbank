'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/SectionTitle';
import ClientMessageList from '@/components/advisor/ClientMessageList';
import Card from '@/components/atoms/Card';
import type { Conversation } from '@/lib/types-advisor';

export default function MessagesPage() {
	const [conversations, setConversations] = React.useState<Conversation[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);

	React.useEffect(() => {
		fetch('http://localhost:3001/advisor/conversations', {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('advisor-token')}`,
			},
		})
			.then((res) => res.json())
			.then((data) => {
				setConversations(data);
				setIsLoading(false);
			})
			.catch((error) => {
				console.error('Erreur lors du chargement:', error);
				setIsLoading(false);
			});
	}, []);

	return (
		<div className="flex flex-col gap-6">
			<SectionTitle
				title="Messages clients"
				subtitle="Gérez vos conversations avec vos clients"
			/>

			{isLoading ? (
				<Card>
					<p className="text-center text-white/60">Chargement...</p>
				</Card>
			) : (
				<ClientMessageList conversations={conversations} />
			)}
		</div>
	);
}