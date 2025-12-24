'use client';

import { useEffect, useState } from 'react';
import ConversationList from '@/components/advisor/ConversationList';
import { useMessaging } from '@/contexts/MessagingContext';

export default function MessagingPage() {
	const {
		conversations,
		pendingConversations,
		activeConversations,
		setConversations,
		claimConversation,
	} = useMessaging();
	const [isLoading, setIsLoading] = useState(true);
	const [currentAdvisorId, setCurrentAdvisorId] = useState<string>('');

	useEffect(() => {
		const fetchConversations = async () => {
			try {
				const token = localStorage.getItem('token');
				const advisorId = 'advisor-1';
				setCurrentAdvisorId(advisorId);

				const response = await fetch('/api/advisor/conversations', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setConversations(data);
				}
			} catch (error) {
				console.error('Error fetching conversations:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchConversations();
	}, [setConversations]);

	const handleClaim = (conversationId: string, advisorId: string, advisorName: string) => {
		claimConversation(conversationId, advisorId, advisorName);
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
			<div>
				<h1 className="mb-2 text-4xl font-bold text-white">Messagerie</h1>
				<p className="text-zinc-400">Gérez vos conversations avec les clients</p>
			</div>

			<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
				<p className="text-sm text-emerald-300">
					<strong>Fonctionnement :</strong> Les conversations en attente peuvent être prises en charge par n'importe quel conseiller. Une fois active, la conversation vous est attribuée. Vous pouvez transférer une conversation à un autre conseiller si nécessaire.
				</p>
			</div>

			<ConversationList
				pendingConversations={pendingConversations}
				activeConversations={activeConversations}
				currentAdvisorId={currentAdvisorId}
				onClaim={handleClaim}
			/>
		</div>
	);
}