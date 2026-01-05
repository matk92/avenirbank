'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SectionTitle from '@/components/atoms/SectionTitle';
import ActivityForm from '@/components/advisor/ActivityForm';
import type { CreateActivityPayload } from '@/lib/types-advisor';

export default function CreateActivityPage() {
	const router = useRouter();

	const handleCreateActivity = async (data: CreateActivityPayload) => {
		const response = await fetch('http://localhost:3001/activities', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error("Erreur lors de la création de l'actualité");
		}
		router.push('/advisor/activities');
	};

	return (
		<div className="flex flex-col gap-6">
			<SectionTitle
				title="Créer une actualité"
				subtitle="Publiez une nouvelle actualité visible par tous les clients"
			/>
			<ActivityForm onSubmit={handleCreateActivity} />
		</div>
	);
}