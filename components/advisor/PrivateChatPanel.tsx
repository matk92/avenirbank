'use client';

import React from 'react';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import { useWebSocket } from '@/lib/websocket-client';
import { formatDateTime } from '@/lib/format';
import type { PrivateMessage } from '@/lib/types-advisor';

interface PrivateChatPanelProps {
	clientId: string;
	clientName: string;
}

export default function PrivateChatPanel({ clientId, clientName }: PrivateChatPanelProps) {
	const { socket, isConnected } = useWebSocket('/messaging');
	const [messages, setMessages] = React.useState<PrivateMessage[]>([]);
	const [inputValue, setInputValue] = React.useState('');
	const messagesEndRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!socket) return;

		socket.emit('join-private', clientId);

		socket.on('private-message', (message: PrivateMessage) => {
			setMessages((prev) => [...prev, message]);
		});

		socket.emit('get-messages', clientId);
		socket.on('messages-history', (history: PrivateMessage[]) => {
			setMessages(history);
		});

		return () => {
			socket.emit('leave-private', clientId);
			socket.off('private-message');
			socket.off('messages-history');
		};
	}, [socket, clientId]);

	React.useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleSendMessage = () => {
		if (!socket || !inputValue.trim()) return;

		socket.emit('send-private-message', {
			clientId,
			content: inputValue,
		});

		setInputValue('');
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	if (!isConnected) {
		return (
			<Card>
				<p className="text-center text-white/60">Connexion en cours...</p>
			</Card>
		);
	}

	return (
		<Card>
			<div className="flex flex-col gap-4">
				<div className="border-b border-white/10 pb-3">
					<h2 className="text-lg font-semibold text-white">Conversation avec {clientName}</h2>
				</div>

				<div className="flex max-h-96 flex-col gap-4 overflow-y-auto pr-2">
					{messages.map((message) => (
						<div
							key={message.id}
							className={`flex flex-col ${
								message.senderRole === 'advisor'
									? 'items-end text-right'
									: 'items-start text-left'
							}`}
						>
							<div
								className={`max-w-sm rounded-2xl px-4 py-3 text-sm shadow-sm ${
									message.senderRole === 'advisor'
										? 'bg-emerald-600 text-white'
										: 'bg-white/10 text-white'
								}`}
							>
								<p>{message.content}</p>
							</div>
							<span className="mt-1 text-xs text-zinc-400">
								{formatDateTime(message.createdAt, 'fr')}
							</span>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>

				<div className="flex gap-3 pt-3 border-t border-white/10">
					<Input
						placeholder="Votre message..."
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyPress={handleKeyPress}
					/>
					<Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
						Envoyer
					</Button>
				</div>
			</div>
		</Card>
	);
}