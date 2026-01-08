'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { ConversationFull, Message } from '@/lib/types-advisor';
import { useWebSocket } from '@/lib/websocket-client';

interface MessagingContextType {
  conversations: ConversationFull[];
  pendingConversations: ConversationFull[];
  activeConversations: ConversationFull[];
  unreadTotal: number;
  refreshUnreadTotal: () => Promise<void>;
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

  const [unreadTotal, setUnreadTotal] = useState(0);
  const unreadRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingConversations = conversations.filter(c => c.status === 'pending');
  const activeConversations = conversations.filter(c => c.status === 'active');

  const refreshUnreadTotal = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUnreadTotal(0);
        return;
      }

      const response = await fetch('/api/messages/conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;
      const data: unknown = await response.json();
      if (!Array.isArray(data)) return;

      const total = data.reduce((sum, item) => {
        if (!item || typeof item !== 'object') return sum;
        const unreadCount = (item as { unreadCount?: unknown }).unreadCount;
        const value = typeof unreadCount === 'number' ? unreadCount : Number(unreadCount);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0);

      setUnreadTotal(total);
    } catch {
    }
  }, []);

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

    socket.socket.on('message-notification', ({ message }: { conversationId: string; message: string }) => {
      setToastMessage(message || 'Vous avez un message en attente');
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);

      if (unreadRefreshTimeoutRef.current) clearTimeout(unreadRefreshTimeoutRef.current);
      unreadRefreshTimeoutRef.current = setTimeout(() => {
        refreshUnreadTotal();
      }, 150);
    });

    return () => {
      if (socket.socket) {
        socket.socket.off('new-conversation');
        socket.socket.off('conversation-claimed');
        socket.socket.off('conversation-transferred');
        socket.socket.off('message-notification');
      }
    };
  }, [socket, refreshUnreadTotal]);

  useEffect(() => {
    if (!socket.isConnected) return;

    const timeout = setTimeout(() => {
      refreshUnreadTotal();
    }, 0);

    return () => clearTimeout(timeout);
  }, [socket.isConnected, refreshUnreadTotal]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'token') {
        refreshUnreadTotal();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshUnreadTotal]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }

      if (unreadRefreshTimeoutRef.current) {
        clearTimeout(unreadRefreshTimeoutRef.current);
        unreadRefreshTimeoutRef.current = null;
      }
    };
  }, []);

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
      unreadTotal,
      refreshUnreadTotal,
      setConversations,
      addMessage,
      markConversationAsRead,
      claimConversation,
      transferConversation,
    }}>
      {children}
      {toastMessage && (
        <div className="pointer-events-none fixed right-4 top-20 z-[100] w-[min(420px,calc(100vw-2rem))]">
          <div className="glass-panel pointer-events-auto rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}
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