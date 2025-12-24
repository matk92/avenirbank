'use client';

import { useState } from 'react';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { ConversationFull } from '@/lib/types-advisor';
import { MessageSquare, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface ConversationListProps {
  pendingConversations: ConversationFull[];
  activeConversations: ConversationFull[];
  currentAdvisorId: string;
  onClaim: (conversationId: string, advisorId: string, advisorName: string) => void;
}

export default function ConversationList({
  pendingConversations,
  activeConversations,
  currentAdvisorId,
  onClaim,
}: ConversationListProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (conversationId: string) => {
    setClaimingId(conversationId);
    try {
      onClaim(conversationId, currentAdvisorId, 'Conseiller');
    } finally {
      setClaimingId(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  const renderConversation = (conversation: ConversationFull, isPending: boolean) => (
    <Card
      key={conversation.id}
      hover
      className="flex items-center justify-between gap-4"
    >
      <div className="flex flex-1 items-start gap-4">
        <div className="rounded-full bg-emerald-500/20 p-3">
          <MessageSquare className="h-5 w-5 text-emerald-400" />
        </div>

        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-semibold text-white">{conversation.clientName}</h3>
            {conversation.unreadCount > 0 && (
              <Badge tone="warning">{conversation.unreadCount}</Badge>
            )}
          </div>

          {conversation.lastMessage && (
            <p className="mb-2 line-clamp-2 text-sm text-zinc-400">
              {conversation.lastMessage.content}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            {conversation.lastMessage && (
              <>
                <span>{formatDate(conversation.lastMessage.timestamp)}</span>
                <span>•</span>
              </>
            )}
            {isPending ? (
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
          </div>
        </div>
      </div>

      <div>
        {isPending ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleClaim(conversation.id)}
            disabled={claimingId === conversation.id}
          >
            {claimingId === conversation.id ? 'Prise en charge...' : 'Prendre en charge'}
          </Button>
        ) : (
          <Link href={`/advisor/messaging/${conversation.id}`}>
            <Button variant="secondary" size="sm">
              Ouvrir
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              En attente
              {pendingConversations.length > 0 && (
                <Badge tone="warning">{pendingConversations.length}</Badge>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'active'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Mes conversations
              {activeConversations.length > 0 && (
                <Badge tone="neutral">{activeConversations.length}</Badge>
              )}
            </div>
          </button>
        </div>
      </Card>

      <div className="space-y-3">
        {activeTab === 'pending' ? (
          pendingConversations.length === 0 ? (
            <Card className="text-center">
              <div className="py-12">
                <Clock className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
                <h3 className="mb-2 text-lg font-semibold text-white">Aucune conversation en attente</h3>
                <p className="text-sm text-zinc-400">
                  Toutes les conversations ont été prises en charge
                </p>
              </div>
            </Card>
          ) : (
            pendingConversations.map((conv) => renderConversation(conv, true))
          )
        ) : activeConversations.length === 0 ? (
          <Card className="text-center">
            <div className="py-12">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
              <h3 className="mb-2 text-lg font-semibold text-white">Aucune conversation active</h3>
              <p className="text-sm text-zinc-400">
                Prenez en charge une conversation en attente pour commencer
              </p>
            </div>
          </Card>
        ) : (
          activeConversations.map((conv) => renderConversation(conv, false))
        )}
      </div>
    </div>
  );
}