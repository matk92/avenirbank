'use client';

import { createContext, useContext, useMemo, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import { generateIban } from '@/lib/iban';
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
  return {
    id: createId('order'),
    side: payload.side,
    stockSymbol: payload.stockSymbol,
    quantity: payload.quantity,
    limitPrice: payload.limitPrice,
    fees: FLAT_ORDER_FEE,
    status: 'pending',
    createdAt: new Date().toISOString(),
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
  ];

  return {
    profile: {
      id: 'client-1',
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille.martin@avenirbank.fr',
    },
    accounts: [primaryAccount, sideAccount],
    operations,
    savingsAccount: null,
    investmentOrders: [],
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
      if (!state.savingsAccount) {
        return state;
      }
      const accounts = state.accounts.map((account) =>
        account.id === state.savingsAccount?.accountId
          ? { ...account, balance: account.balance + action.payload.amount }
          : account,
      );
      return { ...state, accounts };
    }
    case 'SAVINGS_WITHDRAW': {
      if (!state.savingsAccount) {
        return state;
      }
      const accounts = state.accounts.map((account) =>
        account.id === state.savingsAccount?.accountId
          ? { ...account, balance: Math.max(0, account.balance - action.payload.amount) }
          : account,
      );
      return { ...state, accounts };
    }
    case 'PLACE_ORDER': {
      const order = createOrderRecord(action.payload);
      return {
        ...state,
        investmentOrders: [order, ...state.investmentOrders],
      };
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
