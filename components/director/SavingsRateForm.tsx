'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Modal from '@/components/molecules/Modal';
import { useI18n } from '@/contexts/I18nContext';

const savingsRateSchema = z.object({
  newRate: z.number().min(0, 'director.savingsRate.error.positive').max(10, 'director.savingsRate.error.max10'),
});

type SavingsRateFormData = z.infer<typeof savingsRateSchema>;

interface SavingsRateFormProps {
  currentRate: number;
  onSubmit: (newRate: number) => Promise<void>;
}

export default function SavingsRateForm({ currentRate, onSubmit }: SavingsRateFormProps) {
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : t('auth.error.generic'));
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
        <h2 className="mb-6 text-2xl font-bold text-white">{t('director.savingsRate.title')}</h2>

        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{t('director.savingsRate.currentRateLabel')} :</span>{' '}
            <span className="text-2xl font-bold text-amber-400">{currentRate.toFixed(2)}%</span>
          </p>
          <p className="mt-2 text-xs text-amber-200/80">
            {t('director.savingsRate.currentRateNotice')}
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          {/* Nouveau taux */}
          <div>
            <label htmlFor="newRate" className="mb-2 block text-sm font-medium text-zinc-300">
              {t('director.savingsRate.newRateLabel')}
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
              <p className="mt-1 text-sm text-[#ff4f70]">
                {t((errors.newRate.message ?? 'auth.error.generic') as never)}
              </p>
            )}
          </div>
          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              {t('director.savingsRate.success')}
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
            {isSubmitting ? t('director.savingsRate.submitting') : t('director.savingsRate.submit')}
          </Button>
        </form>
      </Card>

      {showConfirmModal && pendingRate !== null && (
        <Modal
          open={showConfirmModal}
          onClose={handleCancel}
          title={t('director.savingsRate.modal.title')}
        >
          <div className="space-y-4">
            <p className="text-zinc-300">
              {t('director.savingsRate.modal.question', {
                current: currentRate.toFixed(2),
                next: pendingRate.toFixed(2),
              })}
            </p>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-300">
                {t('director.savingsRate.modal.notice')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCancel} className="flex-1">
                {t('director.savingsRate.modal.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-[0_15px_35px_rgba(245,158,11,0.35)]"
              >
                {t('director.savingsRate.modal.confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}