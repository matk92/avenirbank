'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/SectionTitle';
import NotificationForm from '@/components/advisor/NotificationForm';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import { formatDateTime } from '@/lib/format';
import type { SendNotificationPayload, ClientProfile, Notification } from '@/lib/types-advisor';

export default function SendNotificationPage() {
	const [clients, setClients] = React.useState<ClientProfile[]>([]);
	const [recentNotifications, setRecentNotifications] = React.useState<Notification[]>([]);
	const [successMessage, setSuccessMessage] = React.useState<string>('');

	React.useEffect(() => {
		fetch('http://localhost:3001/advisor/clients', {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('advisor-token')}`,
			},
		})
			.then((res) => res.json())
			.then(setClients)
			.catch((error) => console.error('Erreur chargement clients:', error));
		fetch('http://localhost:3001/advisor/notifications/recent', {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('advisor-token')}`,
			},
		})
			.then((res) => res.json())
			.then(setRecentNotifications)
			.catch((error) => console.error('Erreur chargement notifications:', error));
	}, []);

	const handleSendNotification = async (data: SendNotificationPayload) => {
		const response = await fetch('http://localhost:3001/advisor/notifications', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('advisor-token')}`,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error("Erreur lors de l'envoi de la notification");
		}

		setSuccessMessage('Notification envoyée avec succès !');
		setTimeout(() => setSuccessMessage(''), 5000);
		const updatedNotifications = await fetch('http://localhost:3001/advisor/notifications/recent', {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('advisor-token')}`,
			},
		}).then((res) => res.json());
		setRecentNotifications(updatedNotifications);
	};

	return (
		<div className="flex flex-col gap-6">
			<SectionTitle title="Envoyer une notification" subtitle="Notifiez un client en temps réel" />

			{successMessage && (
				<div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
					{successMessage}
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				<NotificationForm clients={clients} onSubmit={handleSendNotification} />

				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-white">Notifications récentes</h3>
					{recentNotifications.length === 0 ? (
						<Card>
							<p className="text-center text-white/60 text-sm">
								Aucune notification envoyée récemment
							</p>
						</Card>
					) : (
						<div className="space-y-3">
							{recentNotifications.map((notif) => (
								<Card key={notif.id}>
									<div className="flex flex-col gap-2">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-white">
												{notif.recipientName}
											</span>
											<Badge tone={notif.read ? 'neutral' : 'success'}>
												{notif.read ? 'Lu' : 'Non lu'}
											</Badge>
										</div>
										<p className="text-sm text-white/70">{notif.message}</p>
										<span className="text-xs text-white/40">
											{formatDateTime(notif.createdAt, 'fr')}
										</span>
									</div>
								</Card>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}