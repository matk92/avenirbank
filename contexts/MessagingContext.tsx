'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConversationFull, Message } from '@/lib/types-advisor';
import { useWebSocket } from '@/lib/websocket-client';

interface MessagingContextType {
  conversations: ConversationFull[];
  pendingConversations: ConversationFull[];
  activeConversations: ConversationFull[];
  setConversations: (conversations: ConversationFull[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  markConversationAsRead: (conversationId: string) => void;
  claimConversation: (conversationId: string, advisorId: string, advisorName: string) => void;
  transferConversation: (conversationId: string, toAdvisorId: string, toAdvisorName: string, reason: string) => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ConversationFull[]>([]);
  const socket = useWebSocket('/messaging');

  const pendingConversations = conversations.filter(c => c.status === 'pending');
  const activeConversations = conversations.filter(c => c.status === 'active');

  useEffect(() => {
    if (!socket.socket || !socket.isConnected) return;

    socket.socket.on('new-conversation', (conversation: ConversationFull) => {
      setConversations(prev => [...prev, conversation]);
    });

    socket.socket.on('conversation-claimed', ({ conversationId, advisorId, advisorName }: { conversationId: string; advisorId: string; advisorName: string }) => {
      setConversations(prev => prev.map(c =>
        c.id === conversationId
          ? { ...c, status: 'active' as const, advisorId, advisorName }
          : c
      ));
    });

    socket.socket.on('conversation-transferred', ({ conversationId, toAdvisorId, toAdvisorName }: { conversationId: string; toAdvisorId: string; toAdvisorName: string }) => {
      setConversations(prev => prev.map(c =>
        c.id === conversationId
          ? { ...c, advisorId: toAdvisorId, advisorName: toAdvisorName, transferredAt: new Date() }
          : c
      ));
    });

    return () => {
      if (socket.socket) {
        socket.socket.off('new-conversation');
        socket.socket.off('conversation-claimed');
        socket.socket.off('conversation-transferred');
      }
    };
  }, [socket]);

  const addMessage = (conversationId: string, message: Message) => {
    setConversations(prev => prev.map(c =>
      c.id === conversationId
        ? { ...c, lastMessage: message, unreadCount: c.unreadCount + 1 }
        : c
    ));
  };

  const markConversationAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ));
  };

  const claimConversation = (conversationId: string, advisorId: string, advisorName: string) => {
    if (socket.socket && socket.isConnected) {
      socket.socket.emit('claim-conversation', { conversationId, advisorId, advisorName });
    }
  };

  const transferConversation = (conversationId: string, toAdvisorId: string, toAdvisorName: string, reason: string) => {
    if (socket.socket && socket.isConnected) {
      socket.socket.emit('transfer-conversation', { conversationId, toAdvisorId, toAdvisorName, reason });
    }
  };

  return (
    <MessagingContext.Provider value={{
      conversations,
      pendingConversations,
      activeConversations,
      setConversations,
      addMessage,
      markConversationAsRead,
      claimConversation,
      transferConversation,
    }}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within MessagingProvider');
  }
  return context;
}