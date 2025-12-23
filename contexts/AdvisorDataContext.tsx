'use client';

import React, { createContext, useContext, ReactNode, useState } from 'react';
import type { ClientProfile, Activity, Conversation } from '@/lib/types-advisor';

interface AdvisorDataState {
	clients: ClientProfile[];
	activities: Activity[];
	conversations: Conversation[];
}

interface AdvisorDataContextValue {
	state: AdvisorDataState;
	setClients: (clients: ClientProfile[]) => void;
	setActivities: (activities: Activity[]) => void;
	setConversations: (conversations: Conversation[]) => void;
	addActivity: (activity: Activity) => void;
	updateConversation: (conversation: Conversation) => void;
}

const AdvisorDataContext = createContext<AdvisorDataContextValue | undefined>(undefined);

export function AdvisorDataProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AdvisorDataState>({
		clients: [],
		activities: [],
		conversations: [],
	});

	const setClients = (clients: ClientProfile[]) => {
		setState((prev) => ({ ...prev, clients }));
	};

	const setActivities = (activities: Activity[]) => {
		setState((prev) => ({ ...prev, activities }));
	};

	const setConversations = (conversations: Conversation[]) => {
		setState((prev) => ({ ...prev, conversations }));
	};

	const addActivity = (activity: Activity) => {
		setState((prev) => ({
			...prev,
			activities: [activity, ...prev.activities],
		}));
	};

	const updateConversation = (conversation: Conversation) => {
		setState((prev) => ({
			...prev,
			conversations: prev.conversations.map((conv) =>
				conv.clientId === conversation.clientId ? conversation : conv
			),
		}));
	};

	return (
		<AdvisorDataContext.Provider
			value={{
				state,
				setClients,
				setActivities,
				setConversations,
				addActivity,
				updateConversation,
			}}
		>
			{children}
		</AdvisorDataContext.Provider>
	);
}

export function useAdvisorData() {
	const context = useContext(AdvisorDataContext);
	if (!context) {
		throw new Error('useAdvisorData must be used within AdvisorDataProvider');
	}
	return context;
}