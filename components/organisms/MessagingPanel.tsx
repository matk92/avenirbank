'use client';

import { useEffect, useState, useRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import SectionTitle from '@/components/atoms/SectionTitle';
import { useWebSocket } from '@/lib/websocket-client';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTime } from '@/lib/format';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string | Date;
  read: boolean;
}

interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  advisorId?: string;
  advisorName?: string;
  status: string;
}

const messageSchema = z.object({
  content: z.string().min(1, 'form.error.required'),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export default function MessagingPanel() {
  const { t, language } = useI18n();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [advisorTyping, setAdvisorTyping] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useWebSocket('/messaging');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub);
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }

    const fetchConversation = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/client/conversation', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setConversation(data);
          return data;
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
      return null;
    };

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/client/messages', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation().then((conv) => {
      if (conv) {
        fetchMessages();
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !conversation) return;

    socket.emit('join-conversation', { conversationId: conversation.id });

    socket.emit('mark-read', { conversationId: conversation.id });
    setMessages((prev) =>
      prev.map((m) => (m.conversationId === conversation.id && m.senderRole !== 'client' ? { ...m, read: true } : m)),
    );

    socket.on('new-message', (message: Message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) => [...prev, message]);
        if (message.senderRole !== 'client') {
          socket.emit('mark-read', { conversationId: message.conversationId });
        }
      }
    });

    socket.on('user-typing', (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversation.id) {
        setAdvisorTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => setAdvisorTyping(false), 3000);
      }
    });

    socket.on('messages-read', (data: { conversationId: string; messageIds: string[]; readerId: string }) => {
      if (data.conversationId !== conversation.id) return;
      setMessages((prev) =>
        prev.map((m) => (data.messageIds.includes(m.id) ? { ...m, read: true } : m)),
      );
    });

    return () => {
      socket.emit('leave-conversation', { conversationId: conversation.id });
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('messages-read');
    };
  }, [socket, isConnected, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submitMessage = form.handleSubmit((values: MessageFormValues) => {
    if (!socket || !isConnected || !conversation) return;

    socket.emit('send-message', {
      conversationId: conversation.id,
      content: values.content,
    });

    form.reset();
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('content', e.target.value);
    if (socket && isConnected && conversation && e.target.value) {
      socket.emit('typing', { conversationId: conversation.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <SectionTitle title={t('messages.title')} subtitle={t('messages.subtitle')} />
        <Card>
          <div className="flex h-96 items-center justify-center">
            <p className="text-zinc-400">Chargement...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={t('messages.title')} subtitle={t('messages.subtitle')} />
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}
            />
            <span className="text-xs text-zinc-400">
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          {conversation?.advisorName && (
            <span className="text-xs text-zinc-400">
              Conseiller: {conversation.advisorName}
            </span>
          )}
        </div>

        <div className="flex max-h-96 flex-col gap-4 overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-zinc-400">
              Aucun message pour le moment. Envoyez votre premier message !
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.senderRole === 'client' ? 'items-end text-right' : 'items-start text-left'}`}
              >
                <div
                  className={`max-w-sm rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    message.senderRole === 'client'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <p>{message.content}</p>
                </div>
                <span className="mt-1 text-xs text-zinc-400">
                  {formatDateTime(message.timestamp, language)}
                </span>
                {message.senderId === currentUserId && (
                  <span className="mt-0.5 text-[11px] text-zinc-500">
                    {message.read ? 'Lu' : 'Envoyé'}
                  </span>
                )}
              </div>
            ))
          )}
          {advisorTyping && (
            <p className="text-xs italic text-emerald-600">
              {t('messages.status.writing', { author: conversation?.advisorName || 'Conseiller' })}
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={submitMessage} className="mt-4 flex gap-3">
          <Input
            placeholder={t('messages.placeholder')}
            value={form.watch('content')}
            onChange={handleInputChange}
            hasError={Boolean(form.formState.errors.content)}
          />
          <Button type="submit" disabled={!isConnected}>
            {t('messages.send')}
          </Button>
        </form>
        {form.formState.errors.content && (
          <p className="mt-2 text-xs text-red-500">{t('form.error.required')}</p>
        )}
      </Card>
    </div>
  );
}