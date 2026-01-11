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
import { useI18n } from '@/contexts/I18nContext';

const creditSchema = z.object({
  clientId: z.string().min(1, 'advisor.creditForm.error.clientRequired'),
  amount: z.number({ required_error: 'advisor.creditForm.error.amountRequired' }).min(1, 'advisor.creditForm.error.amountMin'),
  annualInterestRate: z
    .number({ required_error: 'advisor.creditForm.error.annualRateRequired' })
    .min(0, 'advisor.creditForm.error.ratePositive')
    .max(20, 'advisor.creditForm.error.annualRateMax20'),
  insuranceRate: z
    .number({ required_error: 'advisor.creditForm.error.insuranceRateRequired' })
    .min(0, 'advisor.creditForm.error.ratePositive')
    .max(5, 'advisor.creditForm.error.insuranceRateMax5'),
  durationMonths: z
    .number({ required_error: 'advisor.creditForm.error.durationRequired' })
    .min(12, 'advisor.creditForm.error.durationMin12')
    .max(360, 'advisor.creditForm.error.durationMax360'),
});

type CreditFormData = z.infer<typeof creditSchema>;

interface CreditFormProps {
  clients: ClientProfile[];
  onSubmit: (data: CreditFormData) => Promise<void>;
}

export default function CreditForm({ clients, onSubmit }: CreditFormProps) {
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : t('auth.error.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Card>
          <h2 className="mb-6 text-2xl font-bold text-white">{t('advisor.creditForm.title')}</h2>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <div>
              <label htmlFor="clientId" className="mb-2 block text-sm font-medium text-zinc-300">
                {t('advisor.creditForm.client.label')}
              </label>
              <Select id="clientId" hasError={!!errors.clientId} {...register('clientId')}>
                <option value="">{t('advisor.creditForm.client.placeholder')}</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName} ({client.email})
                  </option>
                ))}
              </Select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-[#ff4f70]">
                  {t((errors.clientId.message ?? 'auth.error.generic') as never)}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="mb-2 block text-sm font-medium text-zinc-300">
                {t('advisor.creditForm.amount.label')}
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
                <p className="mt-1 text-sm text-[#ff4f70]">
                  {t((errors.amount.message ?? 'auth.error.generic') as never)}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="annualInterestRate"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                {t('advisor.creditForm.annualRate.label')}
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
                <p className="mt-1 text-sm text-[#ff4f70]">
                  {t((errors.annualInterestRate.message ?? 'auth.error.generic') as never)}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="insuranceRate" className="mb-2 block text-sm font-medium text-zinc-300">
                {t('advisor.creditForm.insuranceRate.label')}
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
                <p className="mt-1 text-sm text-[#ff4f70]">
                  {t((errors.insuranceRate.message ?? 'auth.error.generic') as never)}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                {t('advisor.creditForm.insuranceRate.help')}
              </p>
            </div>

            <div>
              <label htmlFor="durationMonths" className="mb-2 block text-sm font-medium text-zinc-300">
                {t('advisor.creditForm.duration.label')}
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
                <p className="mt-1 text-sm text-[#ff4f70]">
                  {t((errors.durationMonths.message ?? 'auth.error.generic') as never)}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">Entre 12 et 360 mois</p>
            </div>

            {success && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                {t('advisor.creditForm.success')}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-[#ff4f70]/30 bg-[#ff4f70]/10 p-3 text-sm text-[#ff4f70]">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('advisor.creditForm.submitting') : t('advisor.creditForm.submit')}
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