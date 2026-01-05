'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import { useWebSocket } from '@/lib/websocket-client';
import {
  MessageSquare,
  Send,
  Search,
  Users,
  UserPlus,
  X,
  ChevronLeft,
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientRole?: string;
  status: string;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

type TabType = 'conversations' | 'search' | 'users';

export default function UniversalMessagingPanel() {

  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { socket, isConnected } = useWebSocket('/messaging');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);


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
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/messages/users/search?email=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const startConversation = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const conversation = await response.json();
        await fetchConversations();
        setSelectedConversation(conversation);
        setActiveTab('conversations');
        await fetchMessages(conversation.id);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    if (socket && isConnected) {
      socket.emit('send-message', {
        conversationId: selectedConversation.id,
        content: newMessage.trim(),
      });
    } else {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/messages/conversations/${selectedConversation.id}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newMessage.trim() }),
        });

        if (response.ok) {
          const message = await response.json();
          setMessages((prev) => [...prev, message]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }

    setNewMessage('');
  };

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, [fetchConversations, fetchUsers]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, searchUsers]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('new-message', (message: Message) => {
      if (selectedConversation && message.conversationId === selectedConversation.id) {
        setMessages((prev) => [...prev, message]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === message.conversationId && message.senderId !== currentUserId
            ? { ...c, unreadCount: c.unreadCount + 1 }
            : c
        )
      );
    });

    socket.on('user-typing', ({ conversationId }: { conversationId: string }) => {
      if (selectedConversation && conversationId === selectedConversation.id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
      socket.off('new-message');
      socket.off('user-typing');
    };
  }, [socket, isConnected, selectedConversation, currentUserId]);

  useEffect(() => {
    if (!socket || !isConnected || !selectedConversation) return;

    socket.emit('join-conversation', { conversationId: selectedConversation.id });

    return () => {
      socket.emit('leave-conversation', { conversationId: selectedConversation.id });
    };
  }, [socket, isConnected, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return d.toLocaleDateString('fr-FR');
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    const colors: Record<string, 'success' | 'warning' | 'neutral'> = {
      client: 'neutral',
      advisor: 'success',
      director: 'warning',
    };
    const labels: Record<string, string> = {
      client: 'Client',
      advisor: 'Conseiller',
      director: 'Directeur',
    };
    return <Badge tone={colors[role] || 'neutral'}>{labels[role] || role}</Badge>;
  };

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Messages</h1>
        <p className="text-zinc-400">Échangez avec n&apos;importe quel utilisateur</p>
      </div>

      <div className="flex h-full gap-4">
        <div className="flex w-96 flex-col">
          <Card className="mb-4">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeTab === 'conversations'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Conversations
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeTab === 'search'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Search className="h-4 w-4" />
                Recherche
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeTab === 'users'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                Utilisateurs
              </button>
            </div>
          </Card>

          <Card className="flex-1 overflow-hidden">
            {activeTab === 'conversations' && (
              <div className="flex h-full flex-col">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Mes conversations ({conversations.length})
                </h3>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {isLoadingConversations ? (
                    <p className="text-center text-zinc-400">Chargement...</p>
                  ) : conversations.length === 0 ? (
                    <div className="text-center text-zinc-500">
                      <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>Aucune conversation</p>
                      <p className="text-sm">Commencez par rechercher un utilisateur</p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`cursor-pointer rounded-xl border p-3 transition ${
                          selectedConversation?.id === conv.id
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white">{conv.recipientName}</h3>
                              {conv.unreadCount > 0 && (
                                <Badge tone="success">{conv.unreadCount}</Badge>
                              )}
                            </div>
                            {conv.recipientEmail && (
                              <p className="text-xs text-zinc-500">{conv.recipientEmail}</p>
                            )}
                            <div className="mt-1 flex items-center gap-2">
                              {getRoleBadge(conv.recipientRole)}
                              <span className="text-xs text-zinc-500">
                                {formatDate(conv.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="flex h-full flex-col">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="Rechercher par email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {isSearching ? (
                    <p className="text-center text-zinc-400">Recherche...</p>
                  ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                    <p className="text-center text-zinc-400">Aucun résultat</p>
                  ) : searchQuery.length < 2 ? (
                    <p className="text-center text-sm text-zinc-500">
                      Entrez au moins 2 caractères pour rechercher
                    </p>
                  ) : (
                    searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 p-3 hover:border-white/20 hover:bg-white/5"
                      >
                        <div>
                          <h3 className="font-semibold text-white">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-zinc-400">{user.email}</p>
                          <div className="mt-1">{getRoleBadge(user.role)}</div>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => startConversation(user.id)}>
                          <UserPlus className="mr-1 h-4 w-4" />
                          Contacter
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="flex h-full flex-col">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Tous les utilisateurs ({users.length})
                </h3>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {isLoadingUsers ? (
                    <p className="text-center text-zinc-400">Chargement...</p>
                  ) : users.length === 0 ? (
                    <p className="text-center text-zinc-400">Aucun utilisateur</p>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 p-3 hover:border-white/20 hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-zinc-400">{user.email}</p>
                            <div className="mt-1">{getRoleBadge(user.role)}</div>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => startConversation(user.id)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card className="flex flex-1 flex-col">
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white lg:hidden"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {selectedConversation.recipientName}
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedConversation.recipientEmail && (
                        <p className="text-sm text-zinc-400">{selectedConversation.recipientEmail}</p>
                      )}
                      {getRoleBadge(selectedConversation.recipientRole)}
                    </div>
                  </div>
                </div>
                {!isConnected && (
                  <Badge tone="warning">Hors ligne</Badge>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto py-4">
                {isLoadingMessages ? (
                  <p className="text-center text-zinc-400">Chargement des messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-zinc-500">
                    Aucun message. Envoyez le premier message !
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.senderId === currentUserId
                            ? 'bg-emerald-500/20 text-emerald-50'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-semibold opacity-80">{message.senderName}</span>
                          <span className="text-xs opacity-60">{formatTime(message.timestamp)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-zinc-400">
                      En train d&apos;écrire...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2 border-t border-white/10 pt-4">
                <Input
                  type="text"
                  placeholder="Tapez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button variant="primary" onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}