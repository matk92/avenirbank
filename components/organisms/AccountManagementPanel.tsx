'use client';

import { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import SectionTitle from '@/components/atoms/SectionTitle';
import FormField from '@/components/molecules/FormField';
import Modal from '@/components/molecules/Modal';
import AccountSummaryCard from '@/components/molecules/AccountSummaryCard';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency } from '@/lib/format';
import { getAccounts, createAccount, depositMoney, transferMoney, transferToClientMain, renameAccount, closeAccount } from '@/lib/api/accounts';
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

const internalTransferSchema = z
  .object({
    fromAccountId: z.string().min(1, 'form.error.required'),
    toAccountId: z.string().min(1, 'accounts.transfer.error.destinationRequired'),
    amount: z.coerce.number().gt(0, 'form.error.required'),
    reference: z.string().min(1, 'form.error.required'),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'accounts.transfer.error.sameAccount',
    path: ['toAccountId'],
  });

const externalTransferSchema = z.object({
  fromAccountId: z.string().min(1, 'form.error.required'),
  recipientEmail: z.string().email('accounts.transfer.error.email'),
  amount: z.coerce.number().gt(0, 'form.error.required'),
  reference: z.string().min(1, 'form.error.required'),
});

const depositSchema = z.object({
  amount: z.coerce.number().gt(0, 'form.error.required'),
});

type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
type RenameAccountFormValues = z.infer<typeof renameAccountSchema>;
type InternalTransferFormValues = z.infer<typeof internalTransferSchema>;
type ExternalTransferFormValues = z.infer<typeof externalTransferSchema>;
type DepositFormValues = z.infer<typeof depositSchema>;

type MessagingUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
};

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
  const { t, language } = useI18n();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [dragSourceAccountId, setDragSourceAccountId] = useState<string | null>(null);
  const [dragOverAccountId, setDragOverAccountId] = useState<string | null>(null);
  const [isInternalTransferModalOpen, setIsInternalTransferModalOpen] = useState(false);
  const [isExternalTransferModalOpen, setIsExternalTransferModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedAccountForDeposit, setSelectedAccountForDeposit] = useState<string | null>(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [accountToClose, setAccountToClose] = useState<Account | null>(null);
  const [selectedTransferTarget, setSelectedTransferTarget] = useState<string | null>(null);
  const [internalTransferError, setInternalTransferError] = useState<string | null>(null);
  const [externalTransferError, setExternalTransferError] = useState<string | null>(null);
  const [recipientSuggestions, setRecipientSuggestions] = useState<MessagingUser[]>([]);
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);
  const [browseClients, setBrowseClients] = useState<MessagingUser[]>([]);
  const [isBrowsingClients, setIsBrowsingClients] = useState(false);
  const [isLoadingBrowseClients, setIsLoadingBrowseClients] = useState(false);
  const [recipientSuggestionsEnabled, setRecipientSuggestionsEnabled] = useState(true);
  const [lastCreatedAccountId, setLastCreatedAccountId] = useState<string | null>(null);

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountsListRef = useRef<HTMLDivElement | null>(null);

  const getCurrentUserIdentityFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { id: null, email: null };

      const payloadPart = token.split('.')[1];
      if (!payloadPart) return { id: null, email: null };

      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const payload = JSON.parse(atob(padded)) as { sub?: string; id?: string; email?: string };

      return {
        id: payload.id ?? payload.sub ?? null,
        email: payload.email ?? null,
      };
    } catch {
      return { id: null, email: null };
    }
  };

  const isSelfUser = (u: MessagingUser) => {
    if (currentUserId && u.id === currentUserId) return true;
    if (currentUserEmail && u.email?.toLowerCase() === currentUserEmail.toLowerCase()) return true;
    return false;
  };

  const showFeedback = (key: TranslationKey) => {
    setFeedback(t(key));
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const identity = getCurrentUserIdentityFromToken();
    setCurrentUserId(identity.id);
    setCurrentUserEmail(identity.email);
  }, []);

  const loadClientListForTransfer = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setBrowseClients([]);
      setIsBrowsingClients(true);
      return;
    }

    setIsLoadingBrowseClients(true);
    setIsBrowsingClients(true);
    try {
      const response = await fetch('/api/messages/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setBrowseClients([]);
        return;
      }

      const data = await response.json().catch(() => null);
      const users = Array.isArray(data) ? (data as MessagingUser[]) : [];
      const clientsOnly = users
        .filter((u) => (u.role ?? '').toLowerCase() === 'client')
        .filter((u) => !isSelfUser(u));
      setBrowseClients(clientsOnly);
    } catch {
      setBrowseClients([]);
    } finally {
      setIsLoadingBrowseClients(false);
    }
  };

  const createAccountForm = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { name: '', type: 'checking', initialDeposit: 0 },
  });

  const renameForm = useForm<RenameAccountFormValues>({
    resolver: zodResolver(renameAccountSchema),
    defaultValues: { name: '' },
  });

  const internalTransferForm = useForm<InternalTransferFormValues>({
    resolver: zodResolver(internalTransferSchema),
    defaultValues: { fromAccountId: '', toAccountId: '', amount: 0, reference: '' },
  });

  const externalTransferForm = useForm<ExternalTransferFormValues>({
    resolver: zodResolver(externalTransferSchema),
    defaultValues: { fromAccountId: '', recipientEmail: '', amount: 0, reference: '' },
  });

  const watchedExternalRecipientEmail = externalTransferForm.watch('recipientEmail');

  const depositForm = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: 0 },
  });

  const availableAccounts = accounts;
  const activeAccounts = accounts.filter((account) => account.status === 'active');

  // Load accounts on component mount
  useEffect(() => {
    async function loadAccounts() {
      try {
        setLoading(true);
        setError(null);
        const accountsData = await getAccounts();
        setAccounts(accountsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
      } finally {
        setLoading(false);
      }
    }

    loadAccounts();
  }, []);

  // Reset transfer form when accounts change to ensure dropdowns are populated
  useEffect(() => {
    if (accounts.length > 0) {
      internalTransferForm.reset({ fromAccountId: '', toAccountId: '', amount: 0, reference: '' });
      externalTransferForm.reset({ fromAccountId: '', recipientEmail: '', amount: 0, reference: '' });
    }
  }, [accounts, internalTransferForm, externalTransferForm]);

  // Suggest recipient emails using the messaging user search (debounced)
  useEffect(() => {
    if (!isExternalTransferModalOpen) {
      setRecipientSuggestions([]);
      setIsSearchingRecipient(false);
      setBrowseClients([]);
      setIsBrowsingClients(false);
      setIsLoadingBrowseClients(false);
      setRecipientSuggestionsEnabled(true);
      setExternalTransferError(null);
      return;
    }

    if (!recipientSuggestionsEnabled) {
      setRecipientSuggestions([]);
      setIsSearchingRecipient(false);
      return;
    }

    const query = (watchedExternalRecipientEmail ?? '').trim();
    if (query.length < 3) {
      setRecipientSuggestions([]);
      setIsSearchingRecipient(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setRecipientSuggestions([]);
      setIsSearchingRecipient(false);
      return;
    }

    const controller = new AbortController();
    setIsSearchingRecipient(true);

    const timer = window.setTimeout(async () => {
      try {
        const url = new URL('/api/messages/users/search', window.location.origin);
        url.searchParams.set('email', query);
        url.searchParams.set('role', 'client');

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          setRecipientSuggestions([]);
          return;
        }

        const data = await response.json().catch(() => null);
        const normalized = Array.isArray(data) ? (data as MessagingUser[]) : [];
        const filtered = normalized.filter((u) => !isSelfUser(u));
        setRecipientSuggestions(filtered.slice(0, 6));
      } catch {
        setRecipientSuggestions([]);
      } finally {
        setIsSearchingRecipient(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isExternalTransferModalOpen, watchedExternalRecipientEmail]);

  const formatTransferError = (err: unknown) => {
    const raw = err instanceof Error ? err.message : String(err);
    const msg = raw.trim();

    if (!msg) return language === 'fr' ? 'Erreur inconnue.' : 'Unknown error.';

    // Normalize a few known backend messages for the external transfer use case.
    if (msg.toLowerCase().includes('insufficient funds')) {
      return language === 'fr' ? 'Solde insuffisant sur le compte source.' : 'Insufficient funds in the source account.';
    }
    if (msg.toLowerCase().includes('recipient not found')) {
      return language === 'fr' ? 'Bénéficiaire introuvable.' : 'Recipient not found.';
    }
    if (msg.toLowerCase().includes('cannot transfer to yourself')) {
      return language === 'fr' ? 'Impossible de faire un virement vers vous-même.' : 'Cannot transfer to yourself.';
    }
    if (msg.toLowerCase().includes('recipient has no active account')) {
      return language === 'fr' ? 'Le bénéficiaire n’a pas de compte actif.' : 'Recipient has no active account.';
    }
    if (msg.toLowerCase().includes('source account not found')) {
      return language === 'fr' ? 'Compte source introuvable.' : 'Source account not found.';
    }
    if (msg.toLowerCase().includes('source account is not active')) {
      return language === 'fr' ? 'Le compte source est fermé.' : 'Source account is not active.';
    }
    if (msg.toLowerCase().includes('transfer amount')) {
      return language === 'fr' ? `Montant invalide : ${msg}` : `Invalid amount: ${msg}`;
    }

    return msg;
  };

  const handleCreateAccount = createAccountForm.handleSubmit(async (values: CreateAccountFormValues) => {
    try {
      setError(null);
      const created = await createAccount({
        name: values.name,
        type: values.type,
        initialDeposit: values.initialDeposit,
      });
      setLastCreatedAccountId(created.id);
      showFeedback('feedback.accountCreated');
      
      // Refresh all accounts to show the new account with correct status
      const updatedAccounts = await getAccounts();
      setAccounts(updatedAccounts);

      // Smoothly scroll to the newly created account card (or at least the list).
      window.setTimeout(() => {
        const target = document.getElementById(`account-${created.id}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        accountsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
      
      createAccountForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  });

  const handleRenameSubmit = renameForm.handleSubmit(async (values: RenameAccountFormValues) => {
    if (!editingAccountId) {
      return;
    }
    try {
      setError(null);
      const updatedAccount = await renameAccount(editingAccountId, values.name);
      
      // Update account in the list
      setAccounts(prev => prev.map(account => 
        account.id === updatedAccount.id ? updatedAccount : account
      ));
      
      setEditingAccountId(null);
      renameForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename account');
    }
  });

  const handleInternalTransfer = internalTransferForm.handleSubmit(async (values: InternalTransferFormValues) => {
    try {
      setError(null);
      setInternalTransferError(null);

      const result = await transferMoney({
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount: values.amount,
        description: values.reference,
      });

      setAccounts(prev => prev.map(account => {
        if (account.id === result.fromAccount.id) return result.fromAccount;
        if (account.id === result.toAccount.id) return result.toAccount;
        return account;
      }));

      internalTransferForm.reset();
      setIsInternalTransferModalOpen(false);
      showFeedback('feedback.transferCompleted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transfer money';
      
      if (errorMessage.startsWith('INSUFFICIENT_FUNDS:')) {
        const msg = language === 'fr'
          ? 'Solde insuffisant sur le compte source.'
          : 'Insufficient funds: The source account does not have enough balance for this transfer.';
        setInternalTransferError(msg);
        setError(msg);
      } else {
        setInternalTransferError(errorMessage);
        setError(errorMessage);
      }
    }
  });

  const handleExternalTransfer = externalTransferForm.handleSubmit(async (values: ExternalTransferFormValues) => {
    try {
      setError(null);
      setExternalTransferError(null);

      const result = await transferToClientMain({
        fromAccountId: values.fromAccountId,
        recipientEmail: values.recipientEmail.trim(),
        amount: values.amount,
        description: values.reference,
      });

      // Destination account belongs to another client -> only source balance is in our list
      setAccounts((prev) => prev.map((account) => (account.id === result.fromAccount.id ? result.fromAccount : account)));

      externalTransferForm.reset();
      setIsExternalTransferModalOpen(false);
      showFeedback('feedback.transferCompleted');
    } catch (err) {
      const formatted = formatTransferError(err);
      setExternalTransferError(formatted);
      setError(formatted);
    }
  });

  const handleDeposit = depositForm.handleSubmit(async (values: DepositFormValues) => {
    if (!selectedAccountForDeposit) return;
    
    try {
      setError(null);
      const updatedAccount = await depositMoney(selectedAccountForDeposit, values.amount);
      
      // Update account with new balance
      setAccounts(prev => prev.map(account => 
        account.id === updatedAccount.id ? updatedAccount : account
      ));
      
      depositForm.reset();
      setIsDepositModalOpen(false);
      setSelectedAccountForDeposit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deposit money');
    }
  });

  const handleDragStart = (accountId: string) => (event: React.DragEvent<HTMLDivElement>) => {
    setDragSourceAccountId(accountId);
    event.dataTransfer.setData('text/plain', accountId);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (targetAccountId: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain') || dragSourceAccountId;
    if (!sourceId || sourceId === targetAccountId) {
      return;
    }
    internalTransferForm.setValue('fromAccountId', sourceId);
    internalTransferForm.setValue('toAccountId', targetAccountId);
    internalTransferForm.setValue('amount', 0);
    internalTransferForm.setValue('reference', '');
    setIsInternalTransferModalOpen(true);
    setDragSourceAccountId(null);
    setDragOverAccountId(null);
    // Focus amount after the modal renders.
    setTimeout(() => internalTransferForm.setFocus('amount'), 0);
  };

  const handleDragEnter = (targetAccountId: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOverAccountId(targetAccountId);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOverAccountId(null);
  };

  const formatBalance = (amount: number, locale: Language) => formatCurrency(amount, locale);

  const beginRename = (account: Account) => {
    setEditingAccountId(account.id);
    renameForm.reset({ name: account.name });
  };

  const openDepositModal = (accountId: string) => {
    setSelectedAccountForDeposit(accountId);
    setIsDepositModalOpen(true);
    depositForm.reset();
  };

  const handleCloseAccount = async (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    if (account.balance > 0) {
      // Account has balance - show modal for transfer target selection
      setAccountToClose(account);
      setSelectedTransferTarget(null);
      setIsCloseModalOpen(true);
    } else {
      // Account has no balance - close directly
      try {
        setError(null);
        await closeAccount(accountId);
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to close account');
      }
    }
  };

  const confirmCloseAccount = async () => {
    if (!accountToClose) return;
    
    try {
      setError(null);
      await closeAccount(accountToClose.id, selectedTransferTarget || undefined);
      
      // Refresh all accounts to show updated balances
      const updatedAccounts = await getAccounts();
      setAccounts(updatedAccounts);
      
      setIsCloseModalOpen(false);
      setAccountToClose(null);
      setSelectedTransferTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {feedback && (
        <div className="fixed right-4 top-4 z-50 w-[min(420px,calc(100vw-2rem))]">
          <Card className="border-white/10 bg-white/5">
            <div className="flex items-start justify-between gap-4" role="status" aria-live="polite">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">{language === 'fr' ? 'Succès' : 'Success'}</p>
                <p className="mt-1 text-sm text-white/80">{feedback}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFeedback(null)}>
                {t('actions.cancel')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </Card>
      )}

      <Modal
        open={isDepositModalOpen}
        title="Deposit Money"
        onClose={() => setIsDepositModalOpen(false)}
      >
        <Card className="border-white/15 bg-black/70 p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Deposit Money</p>
              <p className="mt-1 text-sm text-white/70">
                {language === 'fr'
                  ? 'Renseignez le montant à déposer.'
                  : 'Enter the amount to deposit.'}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsDepositModalOpen(false)}>
              {t('actions.cancel')}
            </Button>
          </div>

          <form onSubmit={handleDeposit} className="grid gap-5">
            <FormField label="Amount" htmlFor="deposit-amount">
              <Input
                id="deposit-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...depositForm.register('amount', { valueAsNumber: true })}
                hasError={Boolean(depositForm.formState.errors.amount)}
              />
              {depositForm.formState.errors.amount && (
                <p className="text-xs text-[#ff4f70]">
                  {t(
                    (depositForm.formState.errors.amount.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              )}
            </FormField>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsDepositModalOpen(false)}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit">Deposit</Button>
            </div>
          </form>
        </Card>
      </Modal>

      <Modal
        open={isInternalTransferModalOpen}
        title={t('accounts.transferTitle')}
        onClose={() => setIsInternalTransferModalOpen(false)}
      >
        <Card className="border-white/15 bg-black/70 p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">{t('accounts.transferTitle')}</p>
              <p className="mt-1 text-sm text-white/70">
                {language === 'fr'
                  ? 'Renseignez le montant et le libellé, puis validez.'
                  : 'Enter the amount and reference, then confirm.'}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsTransferModalOpen(false)}>
              {t('actions.cancel')}
            </Button>
          </div>

          {internalTransferError ? (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{language === 'fr' ? 'Erreur' : 'Error'}</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{internalTransferError}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setInternalTransferError(null)}>
                  {t('actions.cancel')}
                </Button>
              </div>
            </Card>
          ) : null}

          <form onSubmit={handleInternalTransfer} className="grid gap-5">
            <FormField label={t('accounts.transfer.from')} htmlFor="transfer-modal-from">
              <Select
                id="transfer-modal-from"
                {...internalTransferForm.register('fromAccountId')}
                hasError={Boolean(internalTransferForm.formState.errors.fromAccountId)}
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
              {internalTransferForm.formState.errors.fromAccountId ? (
                <p className="text-xs text-[#ff4f70]">
                  {t(
                    (internalTransferForm.formState.errors.fromAccountId.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>

            <FormField label={t('accounts.transfer.to')} htmlFor="transfer-modal-to">
              <Select
                id="transfer-modal-to"
                {...internalTransferForm.register('toAccountId')}
                hasError={Boolean(internalTransferForm.formState.errors.toAccountId)}
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
              {internalTransferForm.formState.errors.toAccountId ? (
                <p className="text-xs text-[#ff4f70]">
                  {t(
                    (internalTransferForm.formState.errors.toAccountId.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>

            <FormField label={t('accounts.transfer.amount')} htmlFor="transfer-modal-amount">
              <Input
                id="transfer-modal-amount"
                type="number"
                step="0.01"
                {...internalTransferForm.register('amount', { valueAsNumber: true })}
                hasError={Boolean(internalTransferForm.formState.errors.amount)}
              />
              {internalTransferForm.formState.errors.amount ? (
                <p className="text-xs text-[#ff4f70]">
                  {t(
                    (internalTransferForm.formState.errors.amount.message as TranslationKey | undefined) ?? 'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>

            <FormField label={t('accounts.transfer.reference')} htmlFor="transfer-modal-reference">
              <Input
                id="transfer-modal-reference"
                placeholder={language === 'fr' ? 'Libellé' : 'Reference'}
                {...internalTransferForm.register('reference')}
                hasError={Boolean(internalTransferForm.formState.errors.reference)}
              />
              {internalTransferForm.formState.errors.reference ? (
                <p className="text-xs text-[#ff4f70]">
                  {t(
                    (internalTransferForm.formState.errors.reference.message as TranslationKey | undefined) ?? 'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsInternalTransferModalOpen(false)}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit">{t('accounts.transfer.submit')}</Button>
            </div>
          </form>
        </Card>
      </Modal>

      <Modal
        open={isExternalTransferModalOpen}
        title={language === 'fr' ? 'Virement vers un client' : 'Transfer to a client'}
        onClose={() => setIsExternalTransferModalOpen(false)}
      >
        <Card className="border-white/15 bg-black/70 p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                {language === 'fr' ? 'Virement externe' : 'External transfer'}
              </p>
              <p className="mt-1 text-sm text-white/70">
                {language === 'fr'
                  ? 'Envoyez de l’argent vers le compte principal d’un autre client.'
                  : "Send money to another client's main account."}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsExternalTransferModalOpen(false)}>
              {t('actions.cancel')}
            </Button>
          </div>

          {externalTransferError ? (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{language === 'fr' ? 'Erreur' : 'Error'}</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{externalTransferError}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setExternalTransferError(null)}>
                  {t('actions.cancel')}
                </Button>
              </div>
            </Card>
          ) : null}

          <form onSubmit={handleExternalTransfer} className="grid gap-5">
            <FormField label={t('accounts.transfer.from')} htmlFor="external-transfer-from">
              <Select
                id="external-transfer-from"
                {...externalTransferForm.register('fromAccountId')}
                hasError={Boolean(externalTransferForm.formState.errors.fromAccountId)}
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
              {externalTransferForm.formState.errors.fromAccountId ? (
                <p className="text-xs text-[#ff4f70]">
                  {t(
                    (externalTransferForm.formState.errors.fromAccountId.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>

            <FormField label={t('accounts.transfer.recipientEmail')} htmlFor="external-transfer-recipient-email">
              {(() => {
                const register = externalTransferForm.register('recipientEmail');
                return (
                  <Input
                    id="external-transfer-recipient-email"
                    type="email"
                    placeholder={language === 'fr' ? 'email@exemple.com' : 'email@example.com'}
                    {...register}
                    onChange={(e) => {
                      register.onChange(e);
                      setRecipientSuggestionsEnabled(true);
                      setIsBrowsingClients(false);
                    }}
                    hasError={Boolean(externalTransferForm.formState.errors.recipientEmail)}
                  />
                );
              })()}
              {externalTransferForm.formState.errors.recipientEmail ? (
                <p className="text-xs text-[#ff4f70]">
                  {t(
                    (externalTransferForm.formState.errors.recipientEmail.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/60">
                  {language === 'fr'
                    ? 'Tapez pour rechercher, ou affichez la liste des clients.'
                    : 'Type to search, or show the client list.'}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isBrowsingClients) {
                      setIsBrowsingClients(false);
                      return;
                    }
                    setRecipientSuggestionsEnabled(true);
                    setRecipientSuggestions([]);
                    void loadClientListForTransfer();
                  }}
                >
                  {isBrowsingClients
                    ? language === 'fr'
                      ? 'Masquer la liste'
                      : 'Hide list'
                    : language === 'fr'
                      ? 'Voir les clients'
                      : 'Show clients'}
                </Button>
              </div>

              {isSearchingRecipient ? (
                <p className="text-xs text-white/60">{language === 'fr' ? 'Recherche…' : 'Searching…'}</p>
              ) : null}

              {isLoadingBrowseClients ? (
                <p className="text-xs text-white/60">{language === 'fr' ? 'Chargement des clients…' : 'Loading clients…'}</p>
              ) : null}

              {recipientSuggestions.length > 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  <p className="mb-2 text-xs text-white/60">
                    {language === 'fr' ? 'Suggestions (depuis Messages)' : 'Suggestions (from Messages)'}
                  </p>
                  <div className="space-y-1">
                    {recipientSuggestions.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          externalTransferForm.setValue('recipientEmail', u.email, { shouldValidate: true, shouldDirty: true });
                          setRecipientSuggestions([]);
                          setIsSearchingRecipient(false);
                          setRecipientSuggestionsEnabled(false);
                          setIsBrowsingClients(false);
                        }}
                        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                      >
                        <span className="truncate">
                          {u.firstName} {u.lastName}
                        </span>
                        <span className="ml-3 truncate text-xs text-white/60">{u.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {isBrowsingClients && browseClients.length > 0 ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-2">
                  <p className="mb-2 text-xs text-white/60">
                    {language === 'fr' ? 'Clients' : 'Clients'}
                  </p>
                  <div className="max-h-56 space-y-1 overflow-auto">
                    {browseClients.slice(0, 20).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          externalTransferForm.setValue('recipientEmail', u.email, { shouldValidate: true, shouldDirty: true });
                          setRecipientSuggestions([]);
                          setIsSearchingRecipient(false);
                          setRecipientSuggestionsEnabled(false);
                          setIsBrowsingClients(false);
                        }}
                        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                      >
                        <span className="truncate">
                          {u.firstName} {u.lastName}
                        </span>
                        <span className="ml-3 truncate text-xs text-white/60">{u.email}</span>
                      </button>
                    ))}
                  </div>
                  {browseClients.length > 20 ? (
                    <p className="mt-2 text-xs text-white/60">
                      {language === 'fr'
                        ? 'Affichage limité à 20 clients. Utilisez la recherche pour trouver plus vite.'
                        : 'Showing first 20 clients. Use search to find more.'}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </FormField>

            <FormField label={t('accounts.transfer.amount')} htmlFor="external-transfer-amount">
              <Input
                id="external-transfer-amount"
                type="number"
                step="0.01"
                {...externalTransferForm.register('amount', { valueAsNumber: true })}
                hasError={Boolean(externalTransferForm.formState.errors.amount)}
              />
              {externalTransferForm.formState.errors.amount ? (
                <p className="text-xs text-[#ff4f70]">
                  {t(
                    (externalTransferForm.formState.errors.amount.message as TranslationKey | undefined) ?? 'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>

            <FormField label={t('accounts.transfer.reference')} htmlFor="external-transfer-reference">
              <Input
                id="external-transfer-reference"
                placeholder={language === 'fr' ? 'Libellé' : 'Reference'}
                {...externalTransferForm.register('reference')}
                hasError={Boolean(externalTransferForm.formState.errors.reference)}
              />
              {externalTransferForm.formState.errors.reference ? (
                <p className="text-xs text-[#ff4f70]">
                  {t(
                    (externalTransferForm.formState.errors.reference.message as TranslationKey | undefined) ?? 'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsExternalTransferModalOpen(false)}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit">{t('accounts.transfer.submit')}</Button>
            </div>
          </form>
        </Card>
      </Modal>

      <Modal open={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)}>
        <Card className="w-full max-w-md">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Close Account</p>
              <p className="mt-1 text-sm text-white/70">
                {accountToClose && accountToClose.balance > 0
                  ? language === 'fr'
                    ? `Ce compte contient ${formatCurrency(accountToClose.balance)}. Veuillez sélectionner un compte de destination pour le solde.`
                    : `This account contains ${formatCurrency(accountToClose.balance)}. Please select a target account for the balance.`
                  : language === 'fr'
                  ? 'Êtes-vous sûr de vouloir fermer ce compte ?'
                  : 'Are you sure you want to close this account?'}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCloseModalOpen(false)}>
              {t('actions.cancel')}
            </Button>
          </div>

          {accountToClose && accountToClose.balance > 0 && (
            <FormField label={t('accounts.transfer.to')} htmlFor="close-transfer-target">
              <Select
                id="close-transfer-target"
                value={selectedTransferTarget || ''}
                onChange={(e) => setSelectedTransferTarget(e.target.value)}
              >
                <option value="">{language === 'fr' ? 'Sélectionner un compte' : 'Select an account'}</option>
                {accounts
                  .filter(acc => acc.id !== accountToClose.id && acc.status === 'active')
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
              </Select>
            </FormField>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsCloseModalOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={confirmCloseAccount}
              disabled={accountToClose !== null && accountToClose.balance > 0 && !selectedTransferTarget}
            >
              {language === 'fr' ? 'Fermer le compte' : 'Close Account'}
            </Button>
          </div>
        </Card>
      </Modal>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <SectionTitle title={t('accounts.createTitle')} subtitle={t('accounts.subtitle')} />
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#6c5cff]/30 blur-3xl" />
            <form onSubmit={handleCreateAccount} className="grid gap-6 md:grid-cols-2">
              <FormField label={t('accounts.name.label')} htmlFor="account-name">
                <Input
                  id="account-name"
                  placeholder={t('accounts.name.placeholder')}
                  {...createAccountForm.register('name')}
                  hasError={Boolean(createAccountForm.formState.errors.name)}
                />
                {createAccountForm.formState.errors.name ? (
                  <p className="text-xs text-[#ff4f70]">
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
              <div className="md:col-span-2">
                <FormField label={t('accounts.initialDeposit.label')} htmlFor="account-initial-deposit">
                  <Input
                    id="account-initial-deposit"
                    type="number"
                    step="0.01"
                    {...createAccountForm.register('initialDeposit', { valueAsNumber: true })}
                    hasError={Boolean(createAccountForm.formState.errors.initialDeposit)}
                  />
                  {createAccountForm.formState.errors.initialDeposit ? (
                    <p className="text-xs text-[#ff4f70]">
                      {t(
                        (createAccountForm.formState.errors.initialDeposit.message as TranslationKey | undefined) ??
                          'form.error.required',
                      )}
                    </p>
                  ) : null}
                </FormField>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full" disabled={createAccountForm.formState.isSubmitting}>
                  {t('accounts.submit')}
                </Button>
                {lastCreatedAccountId ? (
                  <p className="mt-3 text-xs text-white/60">
                    {language === 'fr'
                      ? 'Le compte a été créé. La liste a été mise à jour.'
                      : 'Account created. The list has been refreshed.'}
                  </p>
                ) : null}
              </div>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle title={t('accounts.transferTitle')} />
          <Card>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              {language === 'fr'
                ? 'Astuce : glissez un compte sur un autre pour pré-remplir le virement.'
                : 'Tip: drag one account onto another to prefill the transfer.'}
            </p>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {language === 'fr'
                  ? 'Virement vers un autre client : utilisez le bouton ci-dessous.'
                  : 'Transfer to another client: use the button below.'}
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  externalTransferForm.reset({ fromAccountId: '', recipientEmail: '', amount: 0, reference: '' });
                  setRecipientSuggestions([]);
                  setIsExternalTransferModalOpen(true);
                  setTimeout(() => externalTransferForm.setFocus('recipientEmail'), 0);
                }}
              >
                {language === 'fr' ? 'Virement vers un client' : 'Transfer to a client'}
              </Button>
            </div>

            <form onSubmit={handleInternalTransfer} className="grid gap-5">
              <FormField label={t('accounts.transfer.from')} htmlFor="transfer-from">
                <Select
                  id="transfer-from"
                  {...internalTransferForm.register('fromAccountId')}
                  hasError={Boolean(internalTransferForm.formState.errors.fromAccountId)}
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
                {internalTransferForm.formState.errors.fromAccountId ? (
                  <p className="text-xs text-[#ff4f70]">
                    {t(
                      (internalTransferForm.formState.errors.fromAccountId.message as TranslationKey | undefined) ??
                        'form.error.required',
                    )}
                  </p>
                ) : null}
              </FormField>
              <FormField label={t('accounts.transfer.to')} htmlFor="transfer-to">
                <Select
                  id="transfer-to"
                  {...internalTransferForm.register('toAccountId')}
                  hasError={Boolean(internalTransferForm.formState.errors.toAccountId)}
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
                {internalTransferForm.formState.errors.toAccountId ? (
                  <p className="text-xs text-[#ff4f70]">
                    {t(
                      (internalTransferForm.formState.errors.toAccountId.message as TranslationKey | undefined) ??
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
                  {...internalTransferForm.register('amount', { valueAsNumber: true })}
                  hasError={Boolean(internalTransferForm.formState.errors.amount)}
                />
                {internalTransferForm.formState.errors.amount ? (
                  <p className="text-xs text-[#ff4f70]">
                    {t(
                      (internalTransferForm.formState.errors.amount.message as TranslationKey | undefined) ??
                        'form.error.required',
                    )}
                  </p>
                ) : null}
              </FormField>
              <FormField label={t('accounts.transfer.reference')} htmlFor="transfer-reference">
                <Input
                  id="transfer-reference"
                  placeholder="Référence"
                  {...internalTransferForm.register('reference')}
                  hasError={Boolean(internalTransferForm.formState.errors.reference)}
                />
                {internalTransferForm.formState.errors.reference ? (
                  <p className="text-xs text-[#ff4f70]">
                    {t(
                      (internalTransferForm.formState.errors.reference.message as TranslationKey | undefined) ??
                        'form.error.required',
                    )}
                  </p>
                ) : null}
              </FormField>
              <Button type="submit" variant="secondary">
                {t('accounts.transfer.submit')}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      <section ref={accountsListRef}>
        <SectionTitle title={t('accounts.listTitle')} />
        <div className="grid gap-6 lg:grid-cols-2">
          {availableAccounts.map((account) => (
            <div
              key={account.id}
              id={`account-${account.id}`}
              className={`space-y-4 rounded-2xl transition outline-offset-4 ${
                dragOverAccountId === account.id ? 'outline outline-2 outline-emerald-400/70' : ''
              }`}
              draggable
              onDragStart={handleDragStart(account.id)}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter(account.id)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(account.id)}
            >
              <AccountSummaryCard
                name={account.name}
                iban={account.iban}
                balance={formatBalance(account.balance, language)}
                statusLabel={account.status === 'active' ? t('status.active') : t('status.closed')}
                statusTone={getAccountStatusTone(account)}
                actions={
                  account.status === 'active' ? (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openDepositModal(account.id)}>
                        Deposit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => beginRename(account)}>
                        {t('accounts.rename')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleCloseAccount(account.id)}>
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
                        <p className="text-xs text-[#ff4f70]">
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
    </div>
  );
}
