'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import SectionTitle from '@/components/atoms/SectionTitle';
import FormField from '@/components/molecules/FormField';
import AccountSummaryCard from '@/components/molecules/AccountSummaryCard';
import { useClientData } from '@/contexts/ClientDataContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency } from '@/lib/format';
import type { Language, TranslationKey } from '@/lib/i18n';
import type { Account } from '@/lib/types';

const createAccountSchema = z.object({
  name: z.string().min(1, 'form.error.required'),
  type: z.enum(['checking', 'savings']),
  initialDeposit: z.coerce.number().min(0, 'form.error.required'),
});

const renameAccountSchema = z.object({
  name: z.string().min(1, 'form.error.required'),
});

const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, 'form.error.required'),
    toAccountId: z.string().min(1, 'form.error.required'),
    amount: z.coerce.number().gt(0, 'form.error.required'),
    reference: z.string().min(1, 'form.error.required'),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
  message: 'accounts.transfer.error.sameAccount',
    path: ['toAccountId'],
  });

type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
type RenameAccountFormValues = z.infer<typeof renameAccountSchema>;
type TransferFormValues = z.infer<typeof transferSchema>;

function getAccountStatusTone(account: Account): 'success' | 'warning' | 'neutral' {
  if (account.status === 'closed') {
    return 'warning';
  }
  if (account.type === 'savings') {
    return 'neutral';
  }
  return 'success';
}

export default function AccountManagementPanel() {
  const { state, createAccount, renameAccount, closeAccount, transfer } = useClientData();
  const { t, language } = useI18n();
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const createAccountForm = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { name: '', type: 'checking', initialDeposit: 0 },
  });

  const renameForm = useForm<RenameAccountFormValues>({
    resolver: zodResolver(renameAccountSchema),
    defaultValues: { name: '' },
  });

  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { fromAccountId: '', toAccountId: '', amount: 0, reference: '' },
  });

  const availableAccounts = state.accounts;
  const activeAccounts = availableAccounts.filter((account) => account.status === 'active');

  const handleCreateAccount = createAccountForm.handleSubmit((values: CreateAccountFormValues) => {
    createAccount({
      name: values.name,
      type: values.type,
      initialDeposit: values.initialDeposit,
    });
    createAccountForm.reset();
  });

  const handleRenameSubmit = renameForm.handleSubmit((values: RenameAccountFormValues) => {
    if (!editingAccountId) {
      return;
    }
    renameAccount({ id: editingAccountId, name: values.name });
    setEditingAccountId(null);
  });

  const handleTransfer = transferForm.handleSubmit((values: TransferFormValues) => {
    transfer({
      fromAccountId: values.fromAccountId,
      toAccountId: values.toAccountId,
      amount: values.amount,
      reference: values.reference,
    });
    transferForm.reset();
  });

  const formatBalance = (amount: number, locale: Language) => formatCurrency(amount, locale);

  const beginRename = (account: Account) => {
    setEditingAccountId(account.id);
    renameForm.reset({ name: account.name });
  };

  return (
    <div className="flex flex-col gap-12">
      <section>
        <SectionTitle title={t('accounts.createTitle')} subtitle={t('accounts.subtitle')} />
        <Card>
          <form onSubmit={handleCreateAccount} className="grid gap-6 md:grid-cols-3">
            <FormField label={t('accounts.name.label')} htmlFor="account-name">
              <Input
                id="account-name"
                placeholder={t('accounts.name.placeholder')}
                {...createAccountForm.register('name')}
                hasError={Boolean(createAccountForm.formState.errors.name)}
              />
              {createAccountForm.formState.errors.name ? (
                <p className="text-xs text-red-500">
                  {t(
                    (createAccountForm.formState.errors.name.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>
            <FormField label={t('accounts.type.label')} htmlFor="account-type">
              <Select
                id="account-type"
                {...createAccountForm.register('type')}
                hasError={Boolean(createAccountForm.formState.errors.type)}
              >
                <option value="checking">{t('accounts.type.checking')}</option>
                <option value="savings">{t('accounts.type.savings')}</option>
              </Select>
            </FormField>
            <FormField label={t('accounts.initialDeposit.label')} htmlFor="account-initial-deposit">
              <Input
                id="account-initial-deposit"
                type="number"
                step="0.01"
                {...createAccountForm.register('initialDeposit', { valueAsNumber: true })}
                hasError={Boolean(createAccountForm.formState.errors.initialDeposit)}
              />
              {createAccountForm.formState.errors.initialDeposit ? (
                <p className="text-xs text-red-500">
                  {t(
                    (createAccountForm.formState.errors.initialDeposit.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>
            <div className="md:col-span-3">
              <Button type="submit">{t('accounts.submit')}</Button>
            </div>
          </form>
        </Card>
      </section>

      <section>
        <SectionTitle title={t('accounts.listTitle')} />
        <div className="grid gap-6 lg:grid-cols-2">
          {availableAccounts.map((account) => (
            <div key={account.id} className="space-y-4">
              <AccountSummaryCard
                name={account.name}
                iban={account.iban}
                balance={formatBalance(account.balance, language)}
                statusLabel={account.status === 'active' ? t('status.active') : t('status.closed')}
                statusTone={getAccountStatusTone(account)}
                actions={
                  account.status === 'active' ? (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => beginRename(account)}>
                        {t('accounts.rename')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => closeAccount({ id: account.id })}>
                        {t('accounts.delete')}
                      </Button>
                    </div>
                  ) : undefined
                }
              />
              {editingAccountId === account.id ? (
                <Card>
                  <form onSubmit={handleRenameSubmit} className="flex flex-col gap-4">
                    <FormField label={t('accounts.rename')} htmlFor="rename-account">
                      <Input
                        id="rename-account"
                        placeholder={t('accounts.rename.placeholder')}
                        {...renameForm.register('name')}
                        hasError={Boolean(renameForm.formState.errors.name)}
                      />
                      {renameForm.formState.errors.name ? (
                        <p className="text-xs text-red-500">
                          {t(
                            (renameForm.formState.errors.name.message as TranslationKey | undefined) ??
                              'form.error.required',
                          )}
                        </p>
                      ) : null}
                    </FormField>
                    <div className="flex items-center gap-3">
                      <Button type="submit" size="sm">
                        {t('accounts.rename')}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingAccountId(null)}>
                        {t('actions.cancel')}
                      </Button>
                    </div>
                  </form>
                </Card>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title={t('accounts.transferTitle')} />
        <Card>
          <form onSubmit={handleTransfer} className="grid gap-6 md:grid-cols-2">
            <FormField label={t('accounts.transfer.from')} htmlFor="transfer-from">
              <Select
                id="transfer-from"
                {...transferForm.register('fromAccountId')}
                hasError={Boolean(transferForm.formState.errors.fromAccountId)}
              >
                <option value="" disabled>
                  --
                </option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
              {transferForm.formState.errors.fromAccountId ? (
                <p className="text-xs text-red-500">
                  {t(
                    (transferForm.formState.errors.fromAccountId.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>
            <FormField label={t('accounts.transfer.to')} htmlFor="transfer-to">
              <Select
                id="transfer-to"
                {...transferForm.register('toAccountId')}
                hasError={Boolean(transferForm.formState.errors.toAccountId)}
              >
                <option value="" disabled>
                  --
                </option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
              {transferForm.formState.errors.toAccountId ? (
                <p className="text-xs text-red-500">
                  {t(
                    (transferForm.formState.errors.toAccountId.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>
            <FormField label={t('accounts.transfer.amount')} htmlFor="transfer-amount">
              <Input
                id="transfer-amount"
                type="number"
                step="0.01"
                {...transferForm.register('amount', { valueAsNumber: true })}
                hasError={Boolean(transferForm.formState.errors.amount)}
              />
              {transferForm.formState.errors.amount ? (
                <p className="text-xs text-red-500">
                  {t(
                    (transferForm.formState.errors.amount.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>
            <FormField label={t('accounts.transfer.reference')} htmlFor="transfer-reference">
              <Input
                id="transfer-reference"
                placeholder="Référence"
                {...transferForm.register('reference')}
                hasError={Boolean(transferForm.formState.errors.reference)}
              />
              {transferForm.formState.errors.reference ? (
                <p className="text-xs text-red-500">
                  {t(
                    (transferForm.formState.errors.reference.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>
            <div className="md:col-span-2">
              <Button type="submit">{t('accounts.transfer.submit')}</Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
