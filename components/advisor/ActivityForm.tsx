'use client';

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';

const activitySchema = z.object({
	title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères'),
	description: z.string().min(20, 'La description doit contenir au moins 20 caractères'),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface ActivityFormProps {
	onSubmit: (data: ActivityFormValues) => Promise<void>;
}

export default function ActivityForm({ onSubmit }: ActivityFormProps) {
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const form = useForm<ActivityFormValues>({
		resolver: zodResolver(activitySchema),
		defaultValues: {
			title: '',
			description: '',
		},
	});

	const handleSubmit = async (values: ActivityFormValues) => {
		setIsSubmitting(true);
		try {
			await onSubmit(values);
			form.reset();
		} catch (error) {
			console.error('Erreur lors de la création:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-2 text-white">
						Titre de l'actualité
					</label>
					<Input
						{...form.register('title')}
						placeholder="Nouveau partenariat éco-responsable"
						hasError={Boolean(form.formState.errors.title)}
					/>
					{form.formState.errors.title && (
						<p className="mt-1 text-xs text-red-500">
							{form.formState.errors.title.message}
						</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium mb-2 text-white">
						Description
					</label>
					<textarea
						{...form.register('description')}
						className="w-full min-h-32 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-500 focus:outline-none"
						placeholder="Décrivez l'actualité en détail..."
					/>
					{form.formState.errors.description && (
						<p className="mt-1 text-xs text-red-500">
							{form.formState.errors.description.message}
						</p>
					)}
				</div>

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Publication en cours...' : "Publier l'actualité"}
				</Button>
			</form>
		</Card>
	);
}