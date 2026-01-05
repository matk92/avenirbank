'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatWindow from '@/components/advisor/ChatWindow';
import TransferConversationModal from '@/components/advisor/TransferConversationModal';
import { useMessaging } from '@/contexts/MessagingContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Card from '@/components/atoms/Card';

export default function ConversationPage() {
	const params = useParams();
	const router = useRouter();
	const conversationId = params.conversationId as string;
	const { transferConversation } = useMessaging();

	const [clientName, setClientName] = useState<string>('');
	const [clientId, setClientId] = useState<string>('');
	const [currentAdvisorId, setCurrentAdvisorId] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);
	const [showTransferModal, setShowTransferModal] = useState(false);

	useEffect(() => {
		const fetchConversation = async () => {
			try {
				const token = localStorage.getItem('token');
				const advisorId = 'advisor-1';
				setCurrentAdvisorId(advisorId);

				const response = await fetch(`/api/advisor/conversations/${conversationId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setClientName(data.clientName);
					setClientId(data.clientId);
				}
			} catch (error) {
				console.error('Error fetching conversation:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchConversation();
	}, [conversationId]);

	const handleTransfer = (toAdvisorId: string, toAdvisorName: string, reason: string) => {
		transferConversation(conversationId, toAdvisorId, toAdvisorName, reason);
		setShowTransferModal(false);

		setTimeout(() => {
			router.push('/advisor/messaging');
		}, 1000);
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
				href="/advisor/messaging"
				className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
			>
				<ArrowLeft className="h-4 w-4" />
				Retour à la messagerie
			</Link>

			<div>
				<h1 className="mb-2 text-4xl font-bold text-white">Conversation avec {clientName}</h1>
				<p className="text-zinc-400">Messagerie instantanée en temps réel</p>
			</div>

			<ChatWindow
				conversationId={conversationId}
				clientId={clientId}
				clientName={clientName}
				currentAdvisorId={currentAdvisorId}
				onTransfer={() => setShowTransferModal(true)}
			/>

			<TransferConversationModal
				isOpen={showTransferModal}
				onClose={() => setShowTransferModal(false)}
				onTransfer={handleTransfer}
				currentAdvisorId={currentAdvisorId}
			/>
		</div>
	);
}