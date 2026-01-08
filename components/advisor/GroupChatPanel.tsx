'use client';

import React from 'react';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Badge from '@/components/atoms/Badge';
import SectionTitle from '@/components/atoms/SectionTitle';
import { useWebSocket } from '@/lib/websocket-client';
import { formatDateTime } from '@/lib/format';
import type { GroupMessage } from '@/lib/types-advisor';

export default function GroupChatPanel() {
	const { socket, isConnected } = useWebSocket('/group-chat');
	const [messages, setMessages] = React.useState<GroupMessage[]>([]);
	const [inputValue, setInputValue] = React.useState('');
	const [isTyping, setIsTyping] = React.useState<string | null>(null);
	const messagesEndRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!socket) return;
		socket.emit('join-group', 'all-staff');

		socket.on('group-message', (message: GroupMessage) => {
			setMessages((prev) => [...prev, message]);
		});

		socket.on('user-typing', ({ userId: _userId, userName }: { userId: string; userName: string }) => {
			setIsTyping(userName);
			setTimeout(() => setIsTyping(null), 3000);
		});

		socket.emit('get-group-messages', 'all-staff');
		socket.on('group-messages-history', (history: GroupMessage[]) => {
			setMessages(history);
		});

		return () => {
			socket.emit('leave-group', 'all-staff');
			socket.off('group-message');
			socket.off('user-typing');
			socket.off('group-messages-history');
		};
	}, [socket]);

	React.useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);

		if (socket && e.target.value) {
			socket.emit('typing', { room: 'all-staff' });
		}
	};

	const handleSendMessage = () => {
		if (!socket || !inputValue.trim()) return;

		socket.emit('send-group-message', {
			room: 'all-staff',
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

	return (
		<Card>
			<SectionTitle
				title="Discussion de groupe"
				subtitle="Communication en temps réel avec toute l'équipe"
			/>

			<div className="messages-container max-h-96 overflow-y-auto space-y-3 mt-4">
				{messages.length === 0 ? (
					<p className="text-center text-white/60 py-8">Aucun message pour le moment</p>
				) : (
					messages.map((message) => (
						<div
							key={message.id}
							className={`flex flex-col rounded-xl p-3 ${
								message.author.role === 'director'
									? 'border-l-4 border-amber-500 bg-amber-50/5 dark:bg-amber-900/20'
									: 'bg-white/5'
							}`}
						>
							<div className="flex items-center gap-2 mb-1">
								<span
									className={`text-sm font-semibold ${
										message.author.role === 'director'
											? 'text-amber-600 dark:text-amber-400'
											: 'text-zinc-700 dark:text-zinc-300'
									}`}
								>
									{message.author.name}
								</span>
								{message.author.role === 'director' && <Badge tone="warning">Directeur</Badge>}
								<span className="text-xs text-zinc-400">
									{formatDateTime(message.createdAt, 'fr')}
								</span>
							</div>
							<p className="text-sm text-zinc-800 dark:text-zinc-200">{message.content}</p>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{isTyping && (
				<p className="text-xs italic text-emerald-600 mt-2">{isTyping} est en train d'écrire...</p>
			)}

			<div className="flex gap-3 mt-4">
				<Input
					placeholder="Votre message..."
					value={inputValue}
					onChange={handleInputChange}
					onKeyPress={handleKeyPress}
				/>
				<Button onClick={handleSendMessage} disabled={!isConnected || !inputValue.trim()}>
					Envoyer
				</Button>
			</div>

			{!isConnected && (
				<p className="text-xs text-red-500 mt-2">Connexion en cours...</p>
			)}
		</Card>
	);
}
