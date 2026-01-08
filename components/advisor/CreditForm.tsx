'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import CreditCalculator from './CreditCalculator';
import { ClientProfile } from '@/lib/types-advisor';

const creditSchema = z.object({
  clientId: z.string().min(1, 'Veuillez sélectionner un client'),
  amount: z.number({ required_error: 'Montant requis' }).min(1, 'Le montant doit être supérieur à 0'),
  annualInterestRate: z
    .number({ required_error: 'Taux requis' })
    .min(0, 'Le taux doit être positif')
    .max(20, 'Le taux ne peut pas dépasser 20%'),
  insuranceRate: z
    .number({ required_error: 'Taux d\'assurance requis' })
    .min(0, 'Le taux doit être positif')
    .max(5, 'Le taux d\'assurance ne peut pas dépasser 5%'),
  durationMonths: z
    .number({ required_error: 'Durée requise' })
    .min(12, 'Durée minimale: 12 mois')
    .max(360, 'Durée maximale: 360 mois'),
});

type CreditFormData = z.infer<typeof creditSchema>;

interface CreditFormProps {
  clients: ClientProfile[];
  onSubmit: (data: CreditFormData) => Promise<void>;
}

export default function CreditForm({ clients, onSubmit }: CreditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreditFormData>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      amount: 10000,
      annualInterestRate: 3.5,
      insuranceRate: 0.36,
      durationMonths: 120,
    },
  });

  const amount = watch('amount') || 0;
  const annualInterestRate = watch('annualInterestRate') || 0;
  const insuranceRate = watch('insuranceRate') || 0;
  const durationMonths = watch('durationMonths') || 0;

  const handleFormSubmit = async (data: CreditFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await onSubmit(data);
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Card>
          <h2 className="mb-6 text-2xl font-bold text-white">Nouveau crédit</h2>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <div>
              <label htmlFor="clientId" className="mb-2 block text-sm font-medium text-zinc-300">
                Client
              </label>
              <Select id="clientId" hasError={!!errors.clientId} {...register('clientId')}>
                <option value="">Sélectionnez un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName} ({client.email})
                  </option>
                ))}
              </Select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-[#ff4f70]">{errors.clientId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="mb-2 block text-sm font-medium text-zinc-300">
                Montant du crédit (€)
              </label>
              <Input
                id="amount"
                type="number"
                step="1"
                placeholder="10000"
                hasError={!!errors.amount}
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-[#ff4f70]">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="annualInterestRate"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Taux d'intérêt annuel (%)
              </label>
              <Input
                id="annualInterestRate"
                type="number"
                step="0.01"
                placeholder="3.5"
                hasError={!!errors.annualInterestRate}
                {...register('annualInterestRate', { valueAsNumber: true })}
              />
              {errors.annualInterestRate && (
                <p className="mt-1 text-sm text-[#ff4f70]">{errors.annualInterestRate.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="insuranceRate" className="mb-2 block text-sm font-medium text-zinc-300">
                Taux d'assurance (%)
              </label>
              <Input
                id="insuranceRate"
                type="number"
                step="0.01"
                placeholder="0.36"
                hasError={!!errors.insuranceRate}
                {...register('insuranceRate', { valueAsNumber: true })}
              />
              {errors.insuranceRate && (
                <p className="mt-1 text-sm text-[#ff4f70]">{errors.insuranceRate.message}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                L'assurance est calculée sur le montant total et prélevée mensuellement
              </p>
            </div>

            <div>
              <label htmlFor="durationMonths" className="mb-2 block text-sm font-medium text-zinc-300">
                Durée (mois)
              </label>
              <Input
                id="durationMonths"
                type="number"
                step="1"
                placeholder="120"
                hasError={!!errors.durationMonths}
                {...register('durationMonths', { valueAsNumber: true })}
              />
              {errors.durationMonths && (
                <p className="mt-1 text-sm text-[#ff4f70]">{errors.durationMonths.message}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">Entre 12 et 360 mois</p>
            </div>

            {success && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                ✓ Crédit octroyé avec succès !
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-[#ff4f70]/30 bg-[#ff4f70]/10 p-3 text-sm text-[#ff4f70]">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Traitement...' : 'Octroyer le crédit'}
            </Button>
          </form>
        </Card>
      </div>
      <div>
        <CreditCalculator
          amount={amount}
          annualInterestRate={annualInterestRate}
          insuranceRate={insuranceRate}
          durationMonths={durationMonths}
        />
      </div>
    </div>
  );
}