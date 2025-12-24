'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import { Stock } from '@/lib/types-director';

const stockSchema = z.object({
  symbol: z.string().min(1, 'Le symbole est requis').max(10, 'Le symbole ne peut pas dépasser 10 caractères').toUpperCase(),
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  currentPrice: z.number({ required_error: 'Prix requis' }).min(0.01, 'Le prix doit être supérieur à 0'),
  isAvailable: z.boolean(),
});

type StockFormData = z.infer<typeof stockSchema>;

interface StockManagementFormProps {
  stock?: Stock;
  onSubmit: (data: StockFormData) => Promise<void>;
  mode: 'create' | 'edit';
}

export default function StockManagementForm({ stock, onSubmit, mode }: StockManagementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: stock
      ? {
          symbol: stock.symbol,
          name: stock.name,
          currentPrice: stock.currentPrice,
          isAvailable: stock.isAvailable,
        }
      : {
          isAvailable: true,
        },
  });

  const handleFormSubmit = async (data: StockFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await onSubmit(data);
      setSuccess(true);
      if (mode === 'create') {
        reset();
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold text-white">
        {mode === 'create' ? 'Créer une action' : 'Modifier l\'action'}
      </h2>

      {mode === 'edit' && stock && (
        <div className="mb-6 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-4">
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-zinc-300">Clients propriétaires :</span>{' '}
            <span className="text-lg font-bold text-white">{stock.ownedByClients}</span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <div>
          <label htmlFor="symbol" className="mb-2 block text-sm font-medium text-zinc-300">
            Symbole (ex: AAPL, GOOGL)
          </label>
          <Input
            id="symbol"
            type="text"
            placeholder="AAPL"
            hasError={!!errors.symbol}
            disabled={mode === 'edit'}
            {...register('symbol')}
            className="uppercase"
          />
          {errors.symbol && (
            <p className="mt-1 text-sm text-[#ff4f70]">{errors.symbol.message}</p>
          )}
          {mode === 'edit' && (
            <p className="mt-1 text-xs text-zinc-500">Le symbole ne peut pas être modifié</p>
          )}
        </div>
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-300">
            Nom de l'entreprise
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Apple Inc."
            hasError={!!errors.name}
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-[#ff4f70]">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="currentPrice" className="mb-2 block text-sm font-medium text-zinc-300">
            Prix initial (€)
          </label>
          <Input
            id="currentPrice"
            type="number"
            step="0.01"
            placeholder="150.00"
            hasError={!!errors.currentPrice}
            disabled={mode === 'edit'}
            {...register('currentPrice', { valueAsNumber: true })}
          />
          {errors.currentPrice && (
            <p className="mt-1 text-sm text-[#ff4f70]">{errors.currentPrice.message}</p>
          )}
          {mode === 'edit' && (
            <p className="mt-1 text-xs text-zinc-500">
              Le cours de l'action est géré automatiquement par le système
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            id="isAvailable"
            type="checkbox"
            className="h-5 w-5 rounded border-white/10 bg-white/5 text-amber-500 focus:ring-2 focus:ring-amber-500/40"
            {...register('isAvailable')}
          />
          <label htmlFor="isAvailable" className="text-sm font-medium text-zinc-300">
            Action disponible à l'achat pour les clients
          </label>
        </div>
        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            {mode === 'create' ? 'Action créée avec succès !' : 'Action modifiée avec succès !'}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#ff4f70]/30 bg-[#ff4f70]/10 p-3 text-sm text-[#ff4f70]">
            {error}
          </div>
        )}
        <Button
          type="submit"
          variant="primary"
          className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-[0_15px_35px_rgba(245,158,11,0.35)]"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Traitement...' : mode === 'create' ? 'Créer l\'action' : 'Enregistrer les modifications'}
        </Button>
      </form>
    </Card>
  );
}