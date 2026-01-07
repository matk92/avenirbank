import React from 'react';
import Card from '@/components/atoms/Card';
import Stat from '@/components/atoms/Stat';
import SectionTitle from '@/components/atoms/SectionTitle';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { Users, MessageSquare, Bell, Newspaper, Plus } from 'lucide-react';

export default function AdvisorDashboard() {
	return (
		<div className="flex flex-col gap-10">
			<section>
				<h1 className="text-3xl font-semibold text-white mb-2">
					Tableau de bord conseiller
				</h1>
				<p className="text-white/60">
					Gérez vos clients, créez des actualités et communiquez en temps réel
				</p>
			</section>
			<section className="grid gap-4 md:grid-cols-4">
				<Stat
					label="Clients actifs"
					value="24"
					icon={<Users className="h-5 w-5" />}
					trend="up"
					trendValue="+3"
				/>
				<Stat
					label="Messages non lus"
					value="7"
					icon={<MessageSquare className="h-5 w-5" />}
					trend="neutral"
					trendValue="0"
				/>
				<Stat
					label="Notifications envoyées"
					value="12"
					icon={<Bell className="h-5 w-5" />}
					trend="up"
					trendValue="+5"
				/>
				<Stat
					label="Actualités publiées"
					value="8"
					icon={<Newspaper className="h-5 w-5" />}
					trend="up"
					trendValue="+2"
				/>
			</section>

			<section className="grid gap-6 lg:grid-cols-2">
				<Card>
					<SectionTitle title="Actions rapides" />
					<div className="grid grid-cols-2 gap-3 mt-4">
						<Link href="/advisor/activities/create">
							<div className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-xs font-semibold text-white/80 transition hover:border-white/40 hover:bg-white/10 cursor-pointer">
								<Newspaper className="h-5 w-5" />
								Créer une actualité
							</div>
						</Link>
						<Link href="/advisor/notifications">
							<div className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-xs font-semibold text-white/80 transition hover:border-white/40 hover:bg-white/10 cursor-pointer">
								<Bell className="h-5 w-5" />
								Envoyer une notification
							</div>
						</Link>
						<Link href="/advisor/messages">
							<div className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-xs font-semibold text-white/80 transition hover:border-white/40 hover:bg-white/10 cursor-pointer">
								<MessageSquare className="h-5 w-5" />
								Messages clients
							</div>
						</Link>
					</div>
				</Card>

				<Card>
					<SectionTitle title="Dernières conversations" />
					<p className="text-sm text-white/60 mt-4">
						Accédez à vos conversations depuis la section Messages clients
					</p>
					<Button asChild className="mt-4">
						<Link href="/advisor/messages" className="gap-2">
							<MessageSquare className="h-4 w-4" />
							Voir tous les messages
						</Link>
					</Button>
				</Card>
			</section>
		</div>
	);
}