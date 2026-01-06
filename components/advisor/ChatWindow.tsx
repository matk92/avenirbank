'use client';

import { useState, useEffect, useRef } from 'react';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import { Message } from '@/lib/types-advisor';
import { useWebSocket } from '@/lib/websocket-client';
import { Send, ArrowLeftRight } from 'lucide-react';

interface ChatWindowProps {
  conversationId: string;
  clientId: string;
  clientName: string;
  currentAdvisorId: string;
  onTransfer?: () => void;
}

export default function ChatWindow({
  conversationId,
  clientId,
  clientName,
  currentAdvisorId,
  onTransfer,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useWebSocket('/messaging');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const lastTypingSentAtRef = useRef<number>(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.sub);
    } catch (e) {
      console.error('Error parsing token:', e);
    }
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/advisor/conversations/${conversationId}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!socket.socket || !socket.isConnected) return;

    socket.socket.emit('join-conversation', { conversationId });
    socket.socket.emit('mark-read', { conversationId });
    setMessages((prev) => prev.map((m) => (m.senderRole === 'client' ? { ...m, read: true } : m)));

    socket.socket.on('new-message', (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);

        if (message.senderRole === 'client') {
          socket.socket?.emit('mark-read', { conversationId: message.conversationId });
        }
      }
    });

    socket.socket.on('messages-read', (data: { conversationId: string; messageIds: string[]; readerId: string }) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (data.messageIds.includes(m.id) ? { ...m, read: true } : m)),
      );
    });

    return () => {
      if (socket.socket) {
        socket.socket.emit('leave-conversation', { conversationId });
        socket.socket.off('new-message');
        socket.socket.off('messages-read');
      }
    };
  }, [socket, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket.socket || !socket.isConnected) return;

    const message: Omit<Message, 'id'> = {
      conversationId,
      senderId: currentAdvisorId,
      senderName: 'Conseiller',
      senderRole: 'advisor',
      content: newMessage.trim(),
      timestamp: new Date(),
      read: false,
    };

    socket.socket.emit('send-message', message);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex h-96 items-center justify-center">
          <div className="text-zinc-400">Chargement des messages...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-[600px] flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{clientName}</h3>
          <p className="text-xs text-zinc-400">Conversation</p>
        </div>
        {onTransfer && (
          <Button variant="secondary" size="sm" onClick={onTransfer}>
            <ArrowLeftRight className="h-4 w-4" />
            Transférer
          </Button>
        )}
      </div>

      <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-zinc-400">
            Aucun message pour le moment
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderRole === 'advisor' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  message.senderRole === 'advisor'
                    ? 'bg-emerald-500/20 text-emerald-50'
                    : 'bg-white/10 text-white'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold opacity-80">
                    {message.senderName}
                  </span>
                  <span className="text-xs opacity-60">{formatTime(message.timestamp)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                {message.senderId === currentUserId && (
                  <div className="mt-1 text-right text-[11px] opacity-70">
                    {message.read ? 'Lu' : 'Envoyé'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Tapez votre message..."
          value={newMessage}
          onChange={(e) => {
            const value = e.target.value;
            setNewMessage(value);

            if (socket.socket && socket.isConnected && value) {
              const now = Date.now();
              if (now - lastTypingSentAtRef.current > 800) {
                lastTypingSentAtRef.current = now;
                socket.socket.emit('typing', { conversationId });
              }
            }
          }}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button
          variant="primary"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
