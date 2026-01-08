'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import { useI18n } from '@/contexts/I18nContext';
import { BankAccount } from '@/lib/types-director';

const accountSchema = z.object({
  clientName: z.string().min(3, 'director.accountForm.error.clientNameMin3'),
  accountType: z.enum(['checking', 'savings'], { required_error: 'director.accountForm.error.accountTypeRequired' }),
  balance: z.number({ required_error: 'director.accountForm.error.balanceRequired' }).min(0, 'director.accountForm.error.balancePositive'),
  status: z.enum(['active', 'suspended', 'banned']),
  savingsRate: z.number().min(0).max(10).optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountManagementFormProps {
  account?: BankAccount;
  onSubmit: (data: AccountFormData) => Promise<void>;
  mode: 'create' | 'edit';
}

export default function AccountManagementForm({ account, onSubmit, mode }: AccountManagementFormProps) {
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
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: account
      ? {
          clientName: account.clientName,
          accountType: account.accountType,
          balance: account.balance,
          status: account.status,
          savingsRate: account.savingsRate,
        }
      : {
          accountType: 'checking',
          balance: 0,
          status: 'active',
        },
  });

  const accountType = watch('accountType');

  const handleFormSubmit = async (data: AccountFormData) => {
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
      setError(err instanceof Error ? err.message : t('auth.error.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold text-white">
        {mode === 'create' ? t('director.accountForm.title.create') : t('director.accountForm.title.edit')}
      </h2>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <div>
          <label htmlFor="clientName" className="mb-2 block text-sm font-medium text-zinc-300">
            {t('director.accountForm.clientName.label')}
          </label>
          <Input
            id="clientName"
            type="text"
            placeholder={t('director.accountForm.clientName.placeholder')}
            hasError={!!errors.clientName}
            {...register('clientName')}
          />
          {errors.clientName && (
            <p className="mt-1 text-sm text-[#ff4f70]">
              {t((errors.clientName.message ?? 'auth.error.generic') as never)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="accountType" className="mb-2 block text-sm font-medium text-zinc-300">
            {t('director.accountForm.accountType.label')}
          </label>
          <Select id="accountType" hasError={!!errors.accountType} {...register('accountType')}>
            <option value="checking">{t('accounts.type.checking')}</option>
            <option value="savings">{t('accounts.type.savings')}</option>
          </Select>
          {errors.accountType && (
            <p className="mt-1 text-sm text-[#ff4f70]">
              {t((errors.accountType.message ?? 'auth.error.generic') as never)}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="balance" className="mb-2 block text-sm font-medium text-zinc-300">
            {t('director.accountForm.balance.label')}
          </label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            placeholder="1000.00"
            hasError={!!errors.balance}
            {...register('balance', { valueAsNumber: true })}
          />
          {errors.balance && (
            <p className="mt-1 text-sm text-[#ff4f70]">
              {t((errors.balance.message ?? 'auth.error.generic') as never)}
            </p>
          )}
        </div>
        {accountType === 'savings' && (
          <div>
            <label htmlFor="savingsRate" className="mb-2 block text-sm font-medium text-zinc-300">
              {t('director.accountForm.savingsRate.label')}
            </label>
            <Input
              id="savingsRate"
              type="number"
              step="0.01"
              placeholder="2.5"
              hasError={!!errors.savingsRate}
              {...register('savingsRate', { valueAsNumber: true })}
            />
            {errors.savingsRate && (
              <p className="mt-1 text-sm text-[#ff4f70]">
                {t((errors.savingsRate.message ?? 'auth.error.generic') as never)}
              </p>
            )}
          </div>
        )}
        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-medium text-zinc-300">
            {t('director.accountForm.status.label')}
          </label>
          <Select id="status" hasError={!!errors.status} {...register('status')}>
            <option value="active">{t('director.accountForm.status.active')}</option>
            <option value="suspended">{t('director.accountForm.status.suspended')}</option>
            <option value="banned">{t('director.accountForm.status.banned')}</option>
          </Select>
          {errors.status && (
            <p className="mt-1 text-sm text-[#ff4f70]">
              {t((errors.status.message ?? 'auth.error.generic') as never)}
            </p>
          )}
        </div>
        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            {mode === 'create' ? t('director.accountForm.success.created') : t('director.accountForm.success.updated')}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#ff4f70]/30 bg-[#ff4f70]/10 p-3 text-sm text-[#ff4f70]">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-[0_15px_35px_rgba(245,158,11,0.35)]" disabled={isSubmitting}>
          {isSubmitting ? t('director.accountForm.submitting') : mode === 'create' ? t('director.accountForm.submit.create') : t('director.accountForm.submit.edit')}
        </Button>
      </form>
    </Card>
  );
}