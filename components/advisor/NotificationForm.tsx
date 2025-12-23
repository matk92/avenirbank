'use client';

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import type { ClientProfile } from '@/lib/types-advisor';

const notificationSchema = z.object({
	clientId: z.string().min(1, 'Veuillez sélectionner un client'),
	message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface NotificationFormProps {
	clients: ClientProfile[];
	onSubmit: (data: NotificationFormValues) => Promise<void>;
}

export default function NotificationForm({ clients, onSubmit }: NotificationFormProps) {
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const form = useForm<NotificationFormValues>({
		resolver: zodResolver(notificationSchema),
		defaultValues: {
			clientId: '',
			message: '',
		},
	});

	const handleSubmit = async (values: NotificationFormValues) => {
		setIsSubmitting(true);
		try {
			await onSubmit(values);
			form.reset();
		} catch (error) {
			console.error("Erreur lors de l'envoi:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-2 text-white">
						Client destinataire
					</label>
					<select
						{...form.register('clientId')}
						className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
					>
						<option value="">-- Sélectionnez un client --</option>
						{clients.map((client) => (
							<option key={client.id} value={client.id} className="bg-zinc-800">
								{client.firstName} {client.lastName} ({client.email})
							</option>
						))}
					</select>
					{form.formState.errors.clientId && (
						<p className="mt-1 text-xs text-red-500">
							{form.formState.errors.clientId.message}
						</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium mb-2 text-white">
						Message de notification
					</label>
					<textarea
						{...form.register('message')}
						className="w-full min-h-24 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-500 focus:outline-none"
						placeholder="Votre dossier de crédit a été validé..."
					/>
					{form.formState.errors.message && (
						<p className="mt-1 text-xs text-red-500">
							{form.formState.errors.message.message}
						</p>
					)}
				</div>

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Envoi en cours...' : 'Envoyer la notification'}
				</Button>
			</form>
		</Card>
	);
}
