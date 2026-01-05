'use client';

import { useState } from 'react';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { Stock } from '@/lib/types-director';
import { TrendingUp, Users, Eye, EyeOff, Trash2 } from 'lucide-react';

interface StockListProps {
  stocks: Stock[];
  onToggleAvailability: (stockId: string, currentAvailability: boolean) => Promise<void>;
  onDelete: (stockId: string) => Promise<void>;
}

export default function StockList({ stocks, onToggleAvailability, onDelete }: StockListProps) {
  const [loadingStockId, setLoadingStockId] = useState<string | null>(null);

  const handleToggle = async (stockId: string, currentAvailability: boolean) => {
    setLoadingStockId(stockId);
    try {
      await onToggleAvailability(stockId, currentAvailability);
    } finally {
      setLoadingStockId(null);
    }
  };

  const handleDelete = async (stockId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) return;
    
    setLoadingStockId(stockId);
    try {
      await onDelete(stockId);
    } finally {
      setLoadingStockId(null);
    }
  };

  if (stocks.length === 0) {
    return (
      <Card className="text-center">
        <div className="py-12">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <h3 className="mb-2 text-lg font-semibold text-white">Aucune action</h3>
          <p className="text-sm text-zinc-400">Créez votre première action pour commencer</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stocks.map((stock) => (
        <Card key={stock.id} hover className="relative">
          <div className="mb-3">
            <Badge tone={stock.isAvailable ? 'success' : 'neutral'}>
              {stock.isAvailable ? 'Disponible' : 'Indisponible'}
            </Badge>
          </div>

          <div className="mb-4">
            <h3 className="text-2xl font-bold text-white">{stock.symbol}</h3>
            <p className="text-sm text-zinc-400">{stock.name}</p>
          </div>

          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">
              {stock.currentPrice.toFixed(2)}€
            </span>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-3">
            <Users className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">
              <span className="font-semibold text-white">{stock.ownedByClients}</span>{' '}
              {stock.ownedByClients > 1 ? 'clients propriétaires' : 'client propriétaire'}
            </span>
          </div>

          <p className="mb-4 text-xs text-zinc-500">
            Le cours de l'action est géré automatiquement
          </p>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleToggle(stock.id, stock.isAvailable)}
              disabled={loadingStockId === stock.id}
              className="flex-1"
            >
              {stock.isAvailable ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Masquer
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Afficher
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(stock.id)}
              disabled={loadingStockId === stock.id || stock.ownedByClients > 0}
              title={
                stock.ownedByClients > 0
                  ? 'Impossible de supprimer : des clients possèdent cette action'
                  : 'Supprimer l\'action'
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {stock.ownedByClients > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
            Suppression impossible : des clients possèdent cette action
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}