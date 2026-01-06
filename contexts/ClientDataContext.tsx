'use client';

import { createContext, useContext, useMemo, useReducer, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { generateIban } from '@/lib/iban';
import { accrueSavingsBalance, calculateOrderTotal } from '@/lib/finance';
import type {
  Account,
  AccountStatus,
  AccountType,
  ActivityItem,
  ClientProfile,
  InvestmentOrder,
  InvestmentSide,
  Message,
  Notification,
  Operation,
  SavingsAccount,
  Stock,
} from '@/lib/types';

const SAVINGS_DAILY_RATE = 0.0008;
const FLAT_ORDER_FEE = 1;
const FIXED_BASE_TIMESTAMP = Date.UTC(2024, 4, 12, 9, 30, 0);

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

type ClientDataState = {
  profile: ClientProfile;
  accounts: Account[];
  operations: Operation[];
  savingsAccount: SavingsAccount | null;
  investmentOrders: InvestmentOrder[];
  stocks: Stock[];
  activity: ActivityItem[];
  notifications: Notification[];
  messages: Message[];
  savingsRate: number;
  advisorTyping: boolean;
  advisorName: string;
};

type CreateAccountPayload = {
  name: string;
  type: AccountType;
  initialDeposit: number;
};

type RenameAccountPayload = {
  id: string;
  name: string;
};

type CloseAccountPayload = {
  id: string;
};

type TransferPayload = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  reference: string;
};

type SavingsMovementPayload = {
  amount: number;
};

type PlaceOrderPayload = {
  side: InvestmentSide;
  stockSymbol: string;
  quantity: number;
  limitPrice: number;
};

type AppendMessagePayload = {
  author: Message['author'];
  content: string;
};

type ClientDataAction =
  | { type: 'CREATE_ACCOUNT'; payload: CreateAccountPayload }
  | { type: 'RENAME_ACCOUNT'; payload: RenameAccountPayload }
  | { type: 'CLOSE_ACCOUNT'; payload: CloseAccountPayload }
  | { type: 'TRANSFER'; payload: TransferPayload }
  | { type: 'OPEN_SAVINGS'; payload: SavingsMovementPayload }
  | { type: 'SAVINGS_DEPOSIT'; payload: SavingsMovementPayload }
  | { type: 'SAVINGS_WITHDRAW'; payload: SavingsMovementPayload }
  | { type: 'PLACE_ORDER'; payload: PlaceOrderPayload }
  | { type: 'SET_NOTIFICATIONS'; payload: { notifications: Notification[] } }
  | { type: 'PREPEND_NOTIFICATION'; payload: { notification: Notification } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: { id: string } }
  | { type: 'APPEND_MESSAGE'; payload: AppendMessagePayload }
  | { type: 'SET_ADVISOR_TYPING'; payload: { typing: boolean } };

function createAccountRecord(payload: CreateAccountPayload): Account {
  const id = createId('acc');
  const seed = Date.now() + Math.floor(Math.random() * 10_000);
  return {
    id,
    name: payload.name,
    iban: generateIban(seed),
    balance: payload.initialDeposit,
    currency: 'EUR',
    type: payload.type,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

function createOperationRecord(payload: TransferPayload): Operation {
  return {
    id: createId('op'),
    fromAccountId: payload.fromAccountId,
    toAccountId: payload.toAccountId,
    amount: payload.amount,
    reference: payload.reference,
    executedAt: new Date().toISOString(),
  };
}

function createOrderRecord(payload: PlaceOrderPayload): InvestmentOrder {
  const { fees } = calculateOrderTotal(payload.quantity, payload.limitPrice, FLAT_ORDER_FEE);
  return {
    id: createId('order'),
    side: payload.side,
    stockSymbol: payload.stockSymbol,
    quantity: payload.quantity,
    limitPrice: payload.limitPrice,
    fees,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

function accrueSavings(state: ClientDataState): ClientDataState {
  if (!state.savingsAccount) {
    return state;
  }
  const savings = state.accounts.find((account) => account.id === state.savingsAccount?.accountId);
  if (!savings) {
    return state;
  }

  const accrual = accrueSavingsBalance(savings.balance, state.savingsRate, state.savingsAccount.lastCapitalization);
  if (accrual.interestEarned <= 0) {
    return state;
  }

  const accounts = state.accounts.map((account) =>
    account.id === savings.id ? { ...account, balance: accrual.balance } : account,
  );

  return {
    ...state,
    accounts,
    savingsAccount: {
      ...state.savingsAccount,
      lastCapitalization: accrual.newCapitalizationDate,
    },
  };
}

function createInitialState(): ClientDataState {
  const baseTimestamp = FIXED_BASE_TIMESTAMP;
  const primaryAccount: Account = {
    id: 'acc-main',
    name: 'Compte courant Avenir',
    iban: generateIban(baseTimestamp),
    balance: 3120.5,
    currency: 'EUR',
    type: 'checking',
    status: 'active',
    createdAt: new Date(baseTimestamp - 1000 * 60 * 60 * 24 * 120).toISOString(),
  };

  const sideAccount: Account = {
    id: 'acc-project',
    name: 'Projet immobilier',
    iban: generateIban(baseTimestamp + 37),
    balance: 10850,
    currency: 'EUR',
    type: 'checking',
    status: 'active',
    createdAt: new Date(baseTimestamp - 1000 * 60 * 60 * 24 * 45).toISOString(),
  };

  const savingsAccountRecord: Account = {
    id: 'acc-savings',
    name: 'Épargne climat',
    iban: generateIban(baseTimestamp + 87),
    balance: 6200,
    currency: 'EUR',
    type: 'savings',
    status: 'active',
    createdAt: new Date(baseTimestamp - 1000 * 60 * 60 * 24 * 200).toISOString(),
  };

  const operations: Operation[] = [
    {
      id: 'op-1',
      fromAccountId: primaryAccount.id,
      toAccountId: sideAccount.id,
      amount: 750,
      reference: 'Projet maison',
      executedAt: new Date(baseTimestamp - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: 'op-2',
      fromAccountId: sideAccount.id,
      toAccountId: primaryAccount.id,
      amount: 1200,
      reference: 'Salaire',
      executedAt: new Date(baseTimestamp - 1000 * 60 * 60 * 72).toISOString(),
    },
    {
      id: 'op-3',
      fromAccountId: primaryAccount.id,
      toAccountId: savingsAccountRecord.id,
      amount: 400,
      reference: 'Versement épargne',
      executedAt: new Date(baseTimestamp - 1000 * 60 * 60 * 14).toISOString(),
    },
  ];

  const stocks: Stock[] = [
    { symbol: 'AVA', name: 'Avenir Alliance', lastPrice: 42.15, currency: 'EUR' },
    { symbol: 'NEO', name: 'Neo Energie', lastPrice: 18.4, currency: 'EUR' },
    { symbol: 'SOL', name: 'Solidarité Tech', lastPrice: 67.9, currency: 'EUR' },
  ];

  const activity: ActivityItem[] = [
    {
      id: 'act-1',
      title: 'Nouveau livret climat',
      description: 'Un compte épargne dédié au financement de projets verts est disponible.',
      publishedAt: new Date(baseTimestamp - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'act-2',
      title: 'Partenariat économie sociale',
      description: "Votre banque s'engage avec des acteurs locaux pour financer des initiatives solidaires.",
      publishedAt: new Date(baseTimestamp - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'act-3',
      title: 'Conférence investisseurs',
      description: 'Inscrivez-vous à notre prochain webinaire sur les marchés responsables.',
      publishedAt: new Date(baseTimestamp - 1000 * 60 * 60 * 30).toISOString(),
    },
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-1',
      message: 'Votre conseiller a validé votre dossier de virement permanent.',
      createdAt: new Date(baseTimestamp - 1000 * 60 * 15).toISOString(),
      read: false,
    },
    {
      id: 'notif-2',
      message: 'Le taux du compte épargne évoluera demain matin.',
      createdAt: new Date(baseTimestamp - 1000 * 60 * 60 * 5).toISOString(),
      read: true,
    },
    {
      id: 'notif-3',
      message: 'Nouveau titre disponible : Solidarité Tech (SOL).',
      createdAt: new Date(baseTimestamp - 1000 * 60 * 60 * 8).toISOString(),
      read: false,
    },
  ];

  const messages: Message[] = [
    {
      id: 'msg-1',
      author: 'client',
      content: 'Bonjour, pouvez-vous vérifier mon dernier virement ?',
      createdAt: new Date(baseTimestamp - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: 'msg-2',
      author: 'advisor',
      content: 'Bonjour ! Le virement est bien parti, il sera crédité sous 24h.',
      createdAt: new Date(baseTimestamp - 1000 * 60 * 60 * 3.5).toISOString(),
    },
    {
      id: 'msg-3',
      author: 'client',
      content: 'Pouvez-vous me confirmer le taux actuel du livret ?',
      createdAt: new Date(baseTimestamp - 1000 * 60 * 60 * 2.5).toISOString(),
    },
  ];

  const investmentOrders: InvestmentOrder[] = [
    {
      id: 'order-1',
      side: 'buy',
      stockSymbol: 'AVA',
      quantity: 25,
      limitPrice: 42,
      fees: FLAT_ORDER_FEE,
      status: 'pending',
      createdAt: new Date(baseTimestamp - 1000 * 60 * 40).toISOString(),
    },
    {
      id: 'order-2',
      side: 'sell',
      stockSymbol: 'NEO',
      quantity: 15,
      limitPrice: 18.6,
      fees: FLAT_ORDER_FEE,
      status: 'executed',
      createdAt: new Date(baseTimestamp - 1000 * 60 * 180).toISOString(),
    },
  ];

  return {
    profile: {
      id: 'client-1',
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille.martin@avenirbank.fr',
    },
    accounts: [primaryAccount, sideAccount, savingsAccountRecord],
    operations,
    savingsAccount: {
      accountId: savingsAccountRecord.id,
      dailyRate: SAVINGS_DAILY_RATE,
      lastCapitalization: new Date(baseTimestamp - 1000 * 60 * 60 * 24 * 1).toISOString(),
    },
    investmentOrders,
    stocks,
    activity,
    notifications,
    messages,
    savingsRate: SAVINGS_DAILY_RATE,
    advisorTyping: false,
    advisorName: 'Alexandre Durand',
  };
}

function clientDataReducer(state: ClientDataState, action: ClientDataAction): ClientDataState {
  switch (action.type) {
    case 'CREATE_ACCOUNT': {
      const account = createAccountRecord(action.payload);
      const updatedAccounts = [...state.accounts, account];
      let savingsAccount = state.savingsAccount;
      if (account.type === 'savings' && !savingsAccount) {
        savingsAccount = {
          accountId: account.id,
          dailyRate: state.savingsRate,
          lastCapitalization: new Date().toISOString(),
        };
      }
      return {
        ...state,
        accounts: updatedAccounts,
        savingsAccount,
      };
    }
    case 'RENAME_ACCOUNT': {
      const accounts = state.accounts.map((account) =>
        account.id === action.payload.id ? { ...account, name: action.payload.name } : account,
      );
      return { ...state, accounts };
    }
    case 'CLOSE_ACCOUNT': {
      const accounts = state.accounts.map((account) =>
        account.id === action.payload.id
          ? { ...account, status: 'closed' as AccountStatus }
          : account,
      );
      return { ...state, accounts };
    }
    case 'TRANSFER': {
      const { fromAccountId, toAccountId, amount } = action.payload;
      if (fromAccountId === toAccountId) {
        return state;
      }
      const accounts = state.accounts.map((account) => {
        if (account.id === fromAccountId) {
          return { ...account, balance: account.balance - amount };
        }
        if (account.id === toAccountId) {
          return { ...account, balance: account.balance + amount };
        }
        return account;
      });
      const operation = createOperationRecord(action.payload);
      return {
        ...state,
        accounts,
        operations: [operation, ...state.operations],
      };
    }
    case 'OPEN_SAVINGS': {
      if (state.savingsAccount) {
        return state;
      }
      const savingsAccount = createAccountRecord({
        name: 'Compte épargne AVENIR',
        type: 'savings',
        initialDeposit: action.payload.amount,
      });
      const accountRecord: SavingsAccount = {
        accountId: savingsAccount.id,
        dailyRate: state.savingsRate,
        lastCapitalization: new Date().toISOString(),
      };
      return {
        ...state,
        accounts: [...state.accounts, savingsAccount],
        savingsAccount: accountRecord,
      };
    }
    case 'SAVINGS_DEPOSIT': {
      const accrued = accrueSavings(state);
      if (!accrued.savingsAccount) {
        return accrued;
      }
      const accounts = accrued.accounts.map((account) =>
        account.id === accrued.savingsAccount?.accountId
          ? { ...account, balance: account.balance + action.payload.amount }
          : account,
      );
      return { ...accrued, accounts };
    }
    case 'SAVINGS_WITHDRAW': {
      const accrued = accrueSavings(state);
      if (!accrued.savingsAccount) {
        return accrued;
      }
      const accounts = accrued.accounts.map((account) =>
        account.id === accrued.savingsAccount?.accountId
          ? { ...account, balance: Math.max(0, account.balance - action.payload.amount) }
          : account,
      );
      return { ...accrued, accounts };
    }
    case 'PLACE_ORDER': {
      const order = createOrderRecord(action.payload);
      return {
        ...state,
        investmentOrders: [order, ...state.investmentOrders],
      };
    }
    case 'SET_NOTIFICATIONS': {
      return { ...state, notifications: action.payload.notifications };
    }
    case 'PREPEND_NOTIFICATION': {
      const incoming = action.payload.notification;
      const withoutDup = state.notifications.filter((n) => n.id !== incoming.id);
      return { ...state, notifications: [incoming, ...withoutDup] };
    }
    case 'MARK_NOTIFICATION_READ': {
      const notifications = state.notifications.map((notification) =>
        notification.id === action.payload.id ? { ...notification, read: true } : notification,
      );
      return { ...state, notifications };
    }
    case 'APPEND_MESSAGE': {
      const message: Message = {
        id: createId('msg'),
        author: action.payload.author,
        content: action.payload.content,
        createdAt: new Date().toISOString(),
      };
      return { ...state, messages: [...state.messages, message] };
    }
    case 'SET_ADVISOR_TYPING': {
      return { ...state, advisorTyping: action.payload.typing };
    }
    default:
      return state;
  }
}

type ClientDataContextValue = {
  state: ClientDataState;
  createAccount: (payload: CreateAccountPayload) => void;
  renameAccount: (payload: RenameAccountPayload) => void;
  closeAccount: (payload: CloseAccountPayload) => void;
  transfer: (payload: TransferPayload) => void;
  openSavings: (payload: SavingsMovementPayload) => void;
  depositSavings: (payload: SavingsMovementPayload) => void;
  withdrawSavings: (payload: SavingsMovementPayload) => void;
  placeOrder: (payload: PlaceOrderPayload) => void;
  markNotificationRead: (id: string) => void;
  appendMessage: (payload: AppendMessagePayload) => void;
  setAdvisorTyping: (typing: boolean) => void;
};

const ClientDataContext = createContext<ClientDataContextValue | undefined>(undefined);

export function ClientDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(clientDataReducer, undefined, createInitialState);

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    let notificationSource: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    const currentTokenRef = { current: null as string | null };

    const cleanupConnection = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      notificationSource?.close();
      notificationSource = null;
    };

    const fetchNotifications = async (token: string) => {
      try {
        const res = await fetch(`${BACKEND_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const notifications: Notification[] = Array.isArray(data)
          ? data.map((n: any) => ({
              id: String(n.id),
              message: String(n.message),
              createdAt: String(n.createdAt),
              read: Boolean(n.read),
            }))
          : [];

        dispatch({ type: 'SET_NOTIFICATIONS', payload: { notifications } });
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    const connectNotificationsSSE = (token: string) => {
      notificationSource?.close();
      notificationSource = new EventSource(`${BACKEND_URL}/sse/notifications?token=${token}`);

      notificationSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed?.type !== 'notification') return;
          const notif = parsed.data;
          if (!notif?.id) return;
          dispatch({
            type: 'PREPEND_NOTIFICATION',
            payload: {
              notification: {
                id: String(notif.id),
                message: String(notif.message ?? ''),
                createdAt: String(notif.createdAt ?? new Date().toISOString()),
                read: Boolean(notif.read),
              },
            },
          });
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      notificationSource.onerror = () => {
        notificationSource?.close();
        // Reconnect uniquement si le token n'a pas changé entre-temps
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          if (currentTokenRef.current === token) {
            connectNotificationsSSE(token);
          }
        }, 5000);
      };
    };

    const ensureConnected = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (currentTokenRef.current) {
          currentTokenRef.current = null;
          cleanupConnection();
        }
        return;
      }

      if (currentTokenRef.current === token) return;

      currentTokenRef.current = token;
      cleanupConnection();
      fetchNotifications(token);
      connectNotificationsSSE(token);
    };

    ensureConnected();
    pollInterval = setInterval(ensureConnected, 1000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      cleanupConnection();
    };
  }, []);

  const createAccount = useCallback((payload: CreateAccountPayload) => {
    dispatch({ type: 'CREATE_ACCOUNT', payload });
  }, []);

  const renameAccount = useCallback((payload: RenameAccountPayload) => {
    dispatch({ type: 'RENAME_ACCOUNT', payload });
  }, []);

  const closeAccount = useCallback((payload: CloseAccountPayload) => {
    dispatch({ type: 'CLOSE_ACCOUNT', payload });
  }, []);

  const transfer = useCallback((payload: TransferPayload) => {
    dispatch({ type: 'TRANSFER', payload });
  }, []);

  const openSavings = useCallback((payload: SavingsMovementPayload) => {
    dispatch({ type: 'OPEN_SAVINGS', payload });
  }, []);

  const depositSavings = useCallback((payload: SavingsMovementPayload) => {
    dispatch({ type: 'SAVINGS_DEPOSIT', payload });
  }, []);

  const withdrawSavings = useCallback((payload: SavingsMovementPayload) => {
    dispatch({ type: 'SAVINGS_WITHDRAW', payload });
  }, []);

  const placeOrder = useCallback((payload: PlaceOrderPayload) => {
    dispatch({ type: 'PLACE_ORDER', payload });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { id } });
  }, []);

  const appendMessage = useCallback((payload: AppendMessagePayload) => {
    dispatch({ type: 'APPEND_MESSAGE', payload });
  }, []);

  const setAdvisorTyping = useCallback((typing: boolean) => {
    dispatch({ type: 'SET_ADVISOR_TYPING', payload: { typing } });
  }, []);

  const value = useMemo<ClientDataContextValue>(
    () => ({
      state,
      createAccount,
      renameAccount,
      closeAccount,
      transfer,
      openSavings,
      depositSavings,
      withdrawSavings,
      placeOrder,
      markNotificationRead,
      appendMessage,
      setAdvisorTyping,
    }),
    [state, createAccount, renameAccount, closeAccount, transfer, openSavings, depositSavings, withdrawSavings, placeOrder, markNotificationRead, appendMessage, setAdvisorTyping],
  );

  return <ClientDataContext.Provider value={value}>{children}</ClientDataContext.Provider>;
}

export function useClientData() {
  const context = useContext(ClientDataContext);
  if (!context) {
    throw new Error('useClientData must be used within a ClientDataProvider');
  }
  return context;
}
