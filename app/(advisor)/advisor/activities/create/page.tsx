'use client';

import { useRouter } from 'next/navigation';
import SectionTitle from '@/components/atoms/SectionTitle';
import ActivityForm from '@/components/advisor/ActivityForm';
import type { CreateActivityPayload } from '@/lib/types-advisor';

export default function CreateActivityPage() {
	const router = useRouter();

	const handleCreateActivity = async (data: CreateActivityPayload) => {
		const token = localStorage.getItem('token');
		const response = await fetch('/api/advisor/activities', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const text = await response.text().catch(() => '');
			throw new Error(text || "Erreur lors de la création de l'actualité");
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