'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import type { GroupMessage } from '@/lib/types-advisor';

interface GroupChatState {
	messages: GroupMessage[];
	isTyping: string | null;
	participants: number;
}

interface GroupChatContextValue {
	state: GroupChatState;
	addMessage: (message: GroupMessage) => void;
	setMessages: (messages: GroupMessage[]) => void;
	setIsTyping: (userName: string | null) => void;
	setParticipants: (count: number) => void;
}

const GroupChatContext = createContext<GroupChatContextValue | undefined>(undefined);

export function GroupChatProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<GroupChatState>({
		messages: [],
		isTyping: null,
		participants: 0,
	});

	const addMessage = (message: GroupMessage) => {
		setState((prev) => ({
			...prev,
			messages: [...prev.messages, message],
		}));
	};

	const setMessages = (messages: GroupMessage[]) => {
		setState((prev) => ({ ...prev, messages }));
	};

	const setIsTyping = (userName: string | null) => {
		setState((prev) => ({ ...prev, isTyping: userName }));
	};

	const setParticipants = (count: number) => {
		setState((prev) => ({ ...prev, participants: count }));
	};

	return (
		<GroupChatContext.Provider
			value={{
				state,
				addMessage,
				setMessages,
				setIsTyping,
				setParticipants,
			}}
		>
			{children}
		</GroupChatContext.Provider>
	);
}

export function useGroupChat() {
	const context = useContext(GroupChatContext);
	if (!context) {
		throw new Error('useGroupChat must be used within GroupChatProvider');
	}
	return context;
}