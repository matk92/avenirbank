'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import { formatDateTime } from '@/lib/format';
import type { Conversation } from '@/lib/types-advisor';

interface ClientMessageListProps {
	conversations: Conversation[];
}

export default function ClientMessageList({ conversations }: ClientMessageListProps) {
	if (conversations.length === 0) {
		return (
			<Card>
				<p className="text-center text-white/60">Aucune conversation pour le moment</p>
			</Card>
		);
	}

	return (
		<div className="space-y-3">
			{conversations.map((conv) => (
				<Link key={conv.clientId} href={`/advisor/messages/${conv.clientId}`}>
					<Card hover className="cursor-pointer">
						<div className="flex min-w-0 items-center justify-between gap-3">
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<h3 className="truncate text-base font-semibold text-white">{conv.clientName}</h3>
									{conv.unreadCount > 0 && (
										<Badge tone="success">{conv.unreadCount} nouveau(x)</Badge>
									)}
								</div>
								<p className="text-sm text-white/60 mt-1 line-clamp-1">{conv.lastMessage}</p>
								<p className="text-xs text-white/40 mt-1">
									{formatDateTime(conv.lastMessageAt, 'fr')}
								</p>
							</div>
						</div>
					</Card>
				</Link>
			))}
		</div>
	);
}