'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import { useWebSocket } from '@/lib/websocket-client';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  Send,
  ArrowLeftRight,
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

interface ConversationFull {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  advisorId?: string;
  advisorName?: string;
  status: 'pending' | 'active' | 'closed';
  unreadCount: number;
  createdAt: Date;
  transferredAt?: Date;
}

type TabType = 'conversations' | 'search' | 'advisors';

export default function FullMessagingPanel() {

  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [conversationFilter, setConversationFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  

  const [conversations, setConversations] = useState<ConversationFull[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationFull | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRoleFilter, setSearchRoleFilter] = useState<'client' | 'all'>('client');
  
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [isLoadingAdvisors, setIsLoadingAdvisors] = useState(false);
  

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const [selectedTransferAdvisor, setSelectedTransferAdvisor] = useState<string>('');
  
  const { socket, isConnected } = useWebSocket('/messaging');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const lastTypingSentAtRef = useRef<number>(0);
  const [newIncomingIndicator, setNewIncomingIndicator] = useState(false);
  const newIncomingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (newIncomingTimeoutRef.current) clearTimeout(newIncomingTimeoutRef.current);
    };
  }, []);

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

  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/advisor/conversations', {
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
      const response = await fetch(`/api/advisor/conversations/${conversationId}/messages`, {
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


  const fetchAdvisors = useCallback(async () => {
    setIsLoadingAdvisors(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/advisor/advisors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAdvisors(data);
      }
    } catch (error) {
      console.error('Error fetching advisors:', error);
    } finally {
      setIsLoadingAdvisors(false);
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
      const role = searchRoleFilter === 'all' ? '' : searchRoleFilter;
      const response = await fetch(
        `/api/advisor/users/search?email=${encodeURIComponent(query)}&role=${role}`,
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
  }, [searchRoleFilter]);

  const startConversation = async (clientId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/advisor/conversations/start', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
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

  const claimConversation = async (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('claim-conversation', { conversationId });
    }
  };

  const transferConversation = async () => {
    if (!selectedConversation || !selectedTransferAdvisor || !transferReason.trim()) return;

    const advisor = advisors.find(a => a.id === selectedTransferAdvisor);
    if (!advisor) return;

    if (socket && isConnected) {
      socket.emit('transfer-conversation', {
        conversationId: selectedConversation.id,
        toAdvisorId: selectedTransferAdvisor,
        toAdvisorName: `${advisor.firstName} ${advisor.lastName}`,
        reason: transferReason,
      });
    }

    setShowTransferModal(false);
    setTransferReason('');
    setSelectedTransferAdvisor('');
    setSelectedConversation(null);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !isConnected || !selectedConversation) return;

    socket.emit('send-message', {
      conversationId: selectedConversation.id,
      content: newMessage.trim(),
    });

    setNewMessage('');
  };

  useEffect(() => {
    fetchConversations();
    fetchAdvisors();
  }, [fetchConversations, fetchAdvisors]);

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
        setMessages(prev => [...prev, message]);

        if (message.senderRole === 'client') {
          setNewIncomingIndicator(true);
          if (newIncomingTimeoutRef.current) clearTimeout(newIncomingTimeoutRef.current);
          newIncomingTimeoutRef.current = setTimeout(() => setNewIncomingIndicator(false), 2000);
          socket.emit('mark-read', { conversationId: message.conversationId });
          setConversations((prev) =>
            prev.map((c) => (c.id === message.conversationId ? { ...c, unreadCount: 0 } : c)),
          );
          return;
        }
      }

      setConversations(prev => prev.map(c => {
        if (c.id !== message.conversationId) return c;
        if (message.senderRole !== 'client') return c;
        if (selectedConversation && selectedConversation.id === message.conversationId) {
          return { ...c, unreadCount: 0 };
        }
        return { ...c, unreadCount: c.unreadCount + 1 };
      }));
    });

    socket.on('message-deleted', ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      if (selectedConversation && selectedConversation.id === conversationId) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    });

    socket.on('conversation-deleted', ({ conversationId }: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    });

    socket.on('conversation-claimed', ({ conversationId, advisorId, advisorName }) => {
      setConversations(prev => prev.map(c =>
        c.id === conversationId
          ? { ...c, status: 'active' as const, advisorId, advisorName }
          : c
      ));
    });

    socket.on('conversation-transferred', ({ conversationId, toAdvisorId, toAdvisorName }) => {
      setConversations(prev => prev.map(c =>
        c.id === conversationId
          ? { ...c, advisorId: toAdvisorId, advisorName: toAdvisorName }
          : c
      ));
    });

    socket.on('user-typing', ({ conversationId }) => {
      if (selectedConversation && conversationId === selectedConversation.id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socket.on('messages-read', (data: { conversationId: string; messageIds: string[]; readerId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.conversationId === data.conversationId && data.messageIds.includes(m.id) ? { ...m, read: true } : m)),
      );
    });

    return () => {
      socket.off('new-message');
      socket.off('conversation-claimed');
      socket.off('conversation-transferred');
      socket.off('user-typing');
      socket.off('messages-read');
      socket.off('message-deleted');
      socket.off('conversation-deleted');
    };
  }, [socket, isConnected, selectedConversation]);

  useEffect(() => {
    if (!socket || !isConnected || !selectedConversation) return;

    socket.emit('join-conversation', { conversationId: selectedConversation.id });

    socket.emit('mark-read', { conversationId: selectedConversation.id });
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c)),
    );
    setMessages((prev) =>
      prev.map((m) => (m.conversationId === selectedConversation.id && m.senderRole === 'client' ? { ...m, read: true } : m)),
    );

    return () => {
      socket.emit('leave-conversation', { conversationId: selectedConversation.id });
    };
  }, [socket, isConnected, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = conversations.filter(c => {
    if (conversationFilter === 'pending') return c.status === 'pending';
    if (conversationFilter === 'active') return c.status === 'active';
    return true;
  });

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

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Messagerie</h1>
        <p className="text-zinc-400">Gérez vos conversations avec les clients</p>
      </div>

      <div className="flex h-full gap-4">
        {/* Left Panel - Tabs and Lists */}
        <div className="flex w-96 flex-col">
          {/* Tab Navigation */}
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
                onClick={() => setActiveTab('advisors')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeTab === 'advisors'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                Conseillers
              </button>
            </div>
          </Card>

          <Card className="flex-1 overflow-hidden">
            {activeTab === 'conversations' && (
              <div className="flex h-full flex-col">
                {/* Filter tabs */}
                <div className="mb-4 flex gap-2 border-b border-white/10 pb-4">
                  <button
                    onClick={() => setConversationFilter('all')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      conversationFilter === 'all'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Toutes ({conversations.length})
                  </button>
                  <button
                    onClick={() => setConversationFilter('pending')}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      conversationFilter === 'pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    En attente ({conversations.filter(c => c.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setConversationFilter('active')}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      conversationFilter === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle className="h-3 w-3" />
                    Actives ({conversations.filter(c => c.status === 'active').length})
                  </button>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {isLoadingConversations ? (
                    <p className="text-center text-zinc-400">Chargement...</p>
                  ) : filteredConversations.length === 0 ? (
                    <p className="text-center text-zinc-400">Aucune conversation</p>
                  ) : (
                    filteredConversations.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => conv.status === 'active' ? setSelectedConversation(conv) : undefined}
                        className={`cursor-pointer rounded-xl border p-3 transition ${
                          selectedConversation?.id === conv.id
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white">{conv.clientName}</h3>
                              {conv.unreadCount > 0 && (
                                <Badge tone="success">{conv.unreadCount}</Badge>
                              )}
                            </div>
                            {conv.clientEmail && (
                              <p className="text-xs text-zinc-500">{conv.clientEmail}</p>
                            )}
                            <div className="mt-1 flex items-center gap-2 text-xs">
                              {conv.status === 'pending' ? (
                                <Badge tone="warning">
                                  <Clock className="mr-1 h-3 w-3" />
                                  En attente
                                </Badge>
                              ) : (
                                <Badge tone="success">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Active
                                </Badge>
                              )}
                              <span className="text-zinc-500">{formatDate(conv.createdAt)}</span>
                            </div>
                          </div>

                          {conv.status === 'pending' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                claimConversation(conv.id);
                              }}
                            >
                              Prendre
                            </Button>
                          )}
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
                  <div className="mb-2 flex gap-2">
                    <button
                      onClick={() => setSearchRoleFilter('client')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        searchRoleFilter === 'client'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Clients uniquement
                    </button>
                    <button
                      onClick={() => setSearchRoleFilter('all')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        searchRoleFilter === 'all'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Tous
                    </button>
                  </div>
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
                    <p className="text-center text-zinc-500 text-sm">
                      Entrez au moins 2 caractères pour rechercher
                    </p>
                  ) : (
                    searchResults.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 p-3 hover:border-white/20 hover:bg-white/5"
                      >
                        <div>
                          <h3 className="font-semibold text-white">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-zinc-400">{user.email}</p>
                          {user.role && (
                            <Badge tone={user.role === 'client' ? 'neutral' : 'success'} className="mt-1">
                              {user.role === 'client' ? 'Client' : user.role === 'advisor' ? 'Conseiller' : 'Directeur'}
                            </Badge>
                          )}
                        </div>
                        {user.role === 'client' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => startConversation(user.id)}
                          >
                            <UserPlus className="mr-1 h-4 w-4" />
                            Contacter
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'advisors' && (
              <div className="flex h-full flex-col">
                <h3 className="mb-4 text-lg font-semibold text-white">Liste des conseillers</h3>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {isLoadingAdvisors ? (
                    <p className="text-center text-zinc-400">Chargement...</p>
                  ) : advisors.length === 0 ? (
                    <p className="text-center text-zinc-400">Aucun conseiller</p>
                  ) : (
                    advisors.map(advisor => (
                      <div
                        key={advisor.id}
                        className="rounded-xl border border-white/10 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                            {advisor.firstName[0]}{advisor.lastName[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {advisor.firstName} {advisor.lastName}
                            </h3>
                            <p className="text-sm text-zinc-400">{advisor.email}</p>
                            <Badge tone={advisor.role === 'director' ? 'warning' : 'success'} className="mt-1">
                              {advisor.role === 'director' ? 'Directeur' : 'Conseiller'}
                            </Badge>
                          </div>
                        </div>
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
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white lg:hidden"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">
                        {selectedConversation.clientName}
                      </h3>
                      {newIncomingIndicator && (
                        <Badge tone="success">+1</Badge>
                      )}
                    </div>
                    {selectedConversation.clientEmail && (
                      <p className="text-sm text-zinc-400">{selectedConversation.clientEmail}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    fetchAdvisors();
                    setShowTransferModal(true);
                  }}
                >
                  <ArrowLeftRight className="mr-1 h-4 w-4" />
                  Transférer
                </Button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto py-4">
                {isLoadingMessages ? (
                  <p className="text-center text-zinc-400">Chargement des messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-zinc-500">
                    Aucun message. Envoyez le premier message !
                  </p>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderRole !== 'client' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.senderRole !== 'client'
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewMessage(value);

                    if (socket && isConnected && selectedConversation && value) {
                      const now = Date.now();
                      if (now - lastTypingSentAtRef.current > 800) {
                        lastTypingSentAtRef.current = now;
                        socket.emit('typing', { conversationId: selectedConversation.id });
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                >
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


      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Transférer la conversation</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Conseiller destinataire
                </label>
                <select
                  value={selectedTransferAdvisor}
                  onChange={(e) => setSelectedTransferAdvisor(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Sélectionnez un conseiller</option>
                  {advisors.map(advisor => (
                    <option key={advisor.id} value={advisor.id}>
                      {advisor.firstName} {advisor.lastName} ({advisor.role === 'director' ? 'Directeur' : 'Conseiller'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Raison du transfert
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Expliquez la raison du transfert..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowTransferModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={transferConversation}
                  disabled={!selectedTransferAdvisor || !transferReason.trim()}
                >
                  Transférer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}