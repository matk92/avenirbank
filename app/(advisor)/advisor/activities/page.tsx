'use client';

import React from 'react';
import Card from '@/components/atoms/Card';
import SectionTitle from '@/components/atoms/SectionTitle';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import type { Activity } from '@/lib/types-advisor';

export default function ActivitiesListPage() {
	const [activities, setActivities] = React.useState<Activity[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);

	React.useEffect(() => {
		// Charger les actualités
		fetch('http://localhost:3001/activities', {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('advisor-token')}`,
			},
		})
			.then((res) => res.json())
			.then((data) => {
				setActivities(data);
				setIsLoading(false);
			})
			.catch((error) => {
				console.error('Erreur lors du chargement:', error);
				setIsLoading(false);
			});
	}, []);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<SectionTitle title="Actualités publiées" subtitle="Gérez vos actualités" />
				<Button asChild>
					<Link href="/advisor/activities/create" className="gap-2">
						<Plus className="h-4 w-4" />
						Nouvelle actualité
					</Link>
				</Button>
			</div>

			{isLoading ? (
				<Card>
					<p className="text-center text-white/60">Chargement...</p>
				</Card>
			) : activities.length === 0 ? (
				<Card>
					<p className="text-center text-white/60">Aucune actualité publiée pour le moment</p>
				</Card>
			) : (
				<div className="space-y-4">
					{activities.map((activity) => (
						<Card key={activity.id} hover>
							<div className="flex flex-col gap-3">
								<div className="flex items-start justify-between">
									<h3 className="text-lg font-semibold text-white">{activity.title}</h3>
									<Badge tone="success">Publié</Badge>
								</div>
								<p className="text-sm text-white/70">{activity.description}</p>
								<div className="flex items-center gap-2 text-xs text-white/40">
									<span>Par {activity.authorName}</span>
									<span>•</span>
									<span>{formatDateTime(activity.publishedAt, 'fr')}</span>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}