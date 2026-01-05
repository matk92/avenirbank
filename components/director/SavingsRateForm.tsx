'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Modal from '@/components/molecules/Modal';

const savingsRateSchema = z.object({
  newRate: z.number().min(0, 'Le taux doit être positif').max(10, 'Le taux ne peut pas dépasser 10%'),
});

type SavingsRateFormData = z.infer<typeof savingsRateSchema>;

interface SavingsRateFormProps {
  currentRate: number;
  onSubmit: (newRate: number) => Promise<void>;
}

export default function SavingsRateForm({ currentRate, onSubmit }: SavingsRateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRate, setPendingRate] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SavingsRateFormData>({
    resolver: zodResolver(savingsRateSchema),
    defaultValues: {
      newRate: currentRate,
    },
  });

  const handleFormSubmit = (data: SavingsRateFormData) => {
    setPendingRate(data.newRate);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (pendingRate === null) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    setShowConfirmModal(false);

    try {
      await onSubmit(pendingRate);
      setSuccess(true);
      reset({ newRate: pendingRate });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
      setPendingRate(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setPendingRate(null);
  };

  return (
    <>
      <Card className="max-w-xl">
        <h2 className="mb-6 text-2xl font-bold text-white">Modifier le taux d'épargne</h2>

        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-300">
            <span className="font-semibold">Taux actuel :</span>{' '}
            <span className="text-2xl font-bold text-amber-400">{currentRate.toFixed(2)}%</span>
          </p>
          <p className="mt-2 text-xs text-amber-200/80">
            Tous les clients ayant un compte épargne seront notifiés du changement.
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          {/* Nouveau taux */}
          <div>
            <label htmlFor="newRate" className="mb-2 block text-sm font-medium text-zinc-300">
              Nouveau taux d'épargne (%)
            </label>
            <Input
              id="newRate"
              type="number"
              step="0.01"
              placeholder="2.5"
              hasError={!!errors.newRate}
              {...register('newRate', { valueAsNumber: true })}
            />
            {errors.newRate && (
              <p className="mt-1 text-sm text-[#ff4f70]">{errors.newRate.message}</p>
            )}
          </div>
          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              ✓ Taux d'épargne modifié avec succès ! Tous les clients concernés ont été notifiés.
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
            {isSubmitting ? 'Modification en cours...' : 'Modifier le taux'}
          </Button>
        </form>
      </Card>

      {showConfirmModal && pendingRate !== null && (
        <Modal
          open={showConfirmModal}
          onClose={handleCancel}
          title="Confirmer la modification"
        >
          <div className="space-y-4">
            <p className="text-zinc-300">
              Êtes-vous sûr de vouloir modifier le taux d'épargne de{' '}
              <span className="font-semibold text-white">{currentRate.toFixed(2)}%</span> à{' '}
              <span className="font-semibold text-amber-400">{pendingRate.toFixed(2)}%</span> ?
            </p>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-300">
                 Tous les clients ayant un compte épargne recevront une notification en temps
                réel de ce changement.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCancel} className="flex-1">
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-[0_15px_35px_rgba(245,158,11,0.35)]"
              >
                Confirmer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}