'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import SectionTitle from '@/components/atoms/SectionTitle';
import FormField from '@/components/molecules/FormField';
import NotificationItem from '@/components/molecules/NotificationItem';
import { useClientData } from '@/contexts/ClientDataContext';
import { useI18n } from '@/contexts/I18nContext';
import { projectSavingsBalance } from '@/lib/finance';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { TranslationKey } from '@/lib/i18n';
import { useEffect, useRef } from 'react';

const amountSchema = z.object({
  amount: z.coerce.number().gt(0, 'form.error.required'),
});

type AmountFormValues = z.infer<typeof amountSchema>;

export default function SavingsPanel() {
  const { state, openSavings, depositSavings, withdrawSavings, markNotificationRead } = useClientData();
  const { t, language } = useI18n();

  const markedRef = useRef<Set<string>>(new Set());

  const normalizeText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u2019/g, "'")
      .toLowerCase();

  const isSavingsRateNotification = (message: string) => {
    const normalized = normalizeText(message);
    return normalized.includes('taux') && normalized.includes('epargne');
  };

  const savingsRateNotifications = state.notifications
    .filter((notification) => isSavingsRateNotification(notification.message))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // Le badge "Épargne" doit rester tant que l'utilisateur n'a pas visité cette page.
  // Dès que la page Épargne est visitée, on marque les notifs de taux comme lues.
  useEffect(() => {
    for (const notification of savingsRateNotifications) {
      if (notification.read) continue;
      if (markedRef.current.has(notification.id)) continue;
      markedRef.current.add(notification.id);
      markNotificationRead(notification.id);
    }
  }, [savingsRateNotifications, markNotificationRead]);

  const openForm = useForm<AmountFormValues>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: 500 },
  });

  const depositForm = useForm<AmountFormValues>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: 200 },
  });

  const withdrawForm = useForm<AmountFormValues>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: 100 },
  });

  const savingsAccount = state.accounts.find((account) => account.id === state.savingsAccount?.accountId);

  const projection = savingsAccount
    ? projectSavingsBalance(savingsAccount.balance, state.savingsRate, 30)
    : { projectedBalance: 0, accruedInterest: 0, days: 30 };

  return (
    <div className="flex flex-col gap-10">
      <SectionTitle title={t('savings.title')} subtitle={t('savings.subtitle')} />

      {savingsRateNotifications.length > 0 ? (
        <div className="grid gap-4">
          {savingsRateNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              message={notification.message}
              createdAt={formatDateTime(notification.createdAt, language)}
              read={notification.read}
              onMarkAsRead={notification.read ? undefined : () => markNotificationRead(notification.id)}
            />
          ))}
        </div>
      ) : null}

      {!savingsAccount ? (
        <Card className="max-w-xl">
          <p className="mb-4 text-sm text-zinc-600">{t('savings.noAccount')}</p>
          <form
            onSubmit={openForm.handleSubmit((values: AmountFormValues) => {
              openSavings({ amount: values.amount });
            })}
            className="flex flex-col gap-4"
          >
            <FormField label={t('savings.amount.label')} htmlFor="savings-open-amount">
              <Input
                id="savings-open-amount"
                type="number"
                step="0.01"
                placeholder={t('savings.amount.placeholder')}
                {...openForm.register('amount', { valueAsNumber: true })}
                hasError={Boolean(openForm.formState.errors.amount)}
              />
              {openForm.formState.errors.amount ? (
                <p className="text-xs text-red-500">
                  {t((openForm.formState.errors.amount.message as TranslationKey | undefined) ?? 'form.error.required')}
                </p>
              ) : null}
            </FormField>
            <Button type="submit">{t('savings.submit')}</Button>
          </form>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{t('savings.balance')}</h3>
                <p className="text-4xl font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(savingsAccount.balance, language)}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50/60 p-4 dark:bg-emerald-900/30">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('savings.currentRate')}</p>
                  <p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-200">
                    {state.savingsRate.toFixed(2)}% / an
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {((state.savingsRate / 365) * 100).toFixed(4)}% / jour
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50/40 p-4 dark:bg-emerald-900/30">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('savings.projection')}</p>
                  <p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-200">
                    {formatCurrency(projection.projectedBalance, language)}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">+{formatCurrency(projection.accruedInterest, language)} / 30 j</p>
                </div>
              </div>
            </div>
          </Card>
          <div className="space-y-6">
            <Card>
              <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">{t('savings.depositTitle')}</h3>
              <form
                onSubmit={depositForm.handleSubmit((values: AmountFormValues) => {
                  depositSavings({ amount: values.amount });
                  depositForm.reset();
                })}
                className="flex flex-col gap-4"
              >
                <Input
                  type="number"
                  step="0.01"
                  placeholder={t('savings.amount.placeholder')}
                  {...depositForm.register('amount', { valueAsNumber: true })}
                  hasError={Boolean(depositForm.formState.errors.amount)}
                />
                {depositForm.formState.errors.amount ? (
                  <p className="text-xs text-red-500">
                    {t((depositForm.formState.errors.amount.message as TranslationKey | undefined) ?? 'form.error.required')}
                  </p>
                ) : null}
                <Button type="submit" size="sm">
                  {t('savings.deposit')}
                </Button>
              </form>
            </Card>
            <Card>
              <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">{t('savings.withdrawTitle')}</h3>
              <form
                onSubmit={withdrawForm.handleSubmit((values: AmountFormValues) => {
                  withdrawSavings({ amount: values.amount });
                  withdrawForm.reset();
                })}
                className="flex flex-col gap-4"
              >
                <Input
                  type="number"
                  step="0.01"
                  placeholder={t('savings.amount.placeholder')}
                  {...withdrawForm.register('amount', { valueAsNumber: true })}
                  hasError={Boolean(withdrawForm.formState.errors.amount)}
                />
                {withdrawForm.formState.errors.amount ? (
                  <p className="text-xs text-red-500">
                    {t((withdrawForm.formState.errors.amount.message as TranslationKey | undefined) ?? 'form.error.required')}
                  </p>
                ) : null}
                <Button type="submit" size="sm" variant="secondary">
                  {t('savings.withdraw')}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
