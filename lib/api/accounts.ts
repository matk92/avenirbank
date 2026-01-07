import type { Account } from '@/lib/types';

const API_BASE_URL = '/api/client';

// Create headers for API requests
function createHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// API Response types matching backend
export interface AccountResponse {
  success: boolean;
  message: string;
  data: {
    account: {
      id: string;
      name: string;
      iban: string;
      balance: number;
      type: 'CHECKING' | 'SAVINGS';
      status: 'ACTIVE' | 'CLOSED';
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface AccountsListResponse {
  success: boolean;
  message: string;
  data: {
    accounts: Array<{
      id: string;
      name: string;
      iban: string;
      balance: number;
      type: 'CHECKING' | 'SAVINGS';
      status: 'ACTIVE' | 'CLOSED';
      createdAt: string;
      updatedAt: string;
    }>;
    totalAccounts: number;
    totalBalance: number;
  };
}

export interface DepositResponse {
  success: boolean;
  message: string;
  data: {
    account: {
      id: string;
      name: string;
      iban: string;
      balance: number;
      type: 'CHECKING' | 'SAVINGS';
      status: 'ACTIVE' | 'CLOSED';
      createdAt: string;
      updatedAt: string;
    };
    transaction: {
      id: string;
      amount: number;
      type: 'DEPOSIT';
      createdAt: string;
    };
  };
}

export interface TransferResponse {
  success: boolean;
  message: string;
  data: {
    fromAccount: {
      id: string;
      name: string;
      iban: string;
      balance: number;
      type: 'CHECKING' | 'SAVINGS';
      status: 'ACTIVE' | 'CLOSED';
      createdAt: string;
      updatedAt: string;
    };
    toAccount: {
      id: string;
      name: string;
      iban: string;
      balance: number;
      type: 'CHECKING' | 'SAVINGS';
      status: 'ACTIVE' | 'CLOSED';
      createdAt: string;
      updatedAt: string;
    };
    transaction: {
      id: string;
      amount: number;
      description: string;
      type: 'TRANSFER';
      createdAt: string;
    };
  };
}

// Convert backend account format to frontend format
function convertAccount(backendAccount: any): Account {
  if (!backendAccount) {
    throw new Error('Invalid account data: account is null or undefined');
  }

  return {
    id: backendAccount.id || '',
    name: backendAccount.name || 'Unnamed Account',
    iban: backendAccount.iban || '',
    balance: parseFloat(backendAccount.balance?.toString() || '0') || 0,
    currency: backendAccount.currency || 'EUR',
    type: (backendAccount.type && typeof backendAccount.type === 'string' 
      ? backendAccount.type.toLowerCase() 
      : 'checking') as 'checking' | 'savings',
    status: backendAccount.isActive === true ? 'active' : 'closed',
    createdAt: backendAccount.createdAt || new Date().toISOString(),
  };
}

// Get all user accounts
export async function getAccounts(): Promise<Account[]> {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'GET',
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch accounts: ${response.statusText}`);
  }

  const data: AccountsListResponse = await response.json();
  return data.data.accounts.map(convertAccount);
}

// Create a new account
export async function createAccount(accountData: {
  name: string;
  type: 'checking' | 'savings';
  initialDeposit: number;
}): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify({
      name: accountData.name,
      type: accountData.type.toUpperCase(),
      initialDeposit: accountData.initialDeposit,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create account: ${response.statusText}`);
  }

  const data: AccountResponse = await response.json();
  return convertAccount(data.data.account);
}

// Deposit money to an account
export async function depositMoney(accountId: string, amount: number): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/deposit`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to deposit money: ${response.statusText}`);
  }

  const data: DepositResponse = await response.json();
  return convertAccount(data.data.account);
}

// Rename an account
export async function renameAccount(accountId: string, newName: string): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/rename`, {
    method: 'PATCH',
    headers: createHeaders(),
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to rename account: ${response.statusText}`);
  }

  const data: AccountResponse = await response.json();
  return convertAccount(data.data.account);
}

// Transfer money between accounts
export async function transferMoney(transferData: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
}): Promise<{ fromAccount: Account; toAccount: Account }> {
  // Convert description to reference for backend compatibility
  const backendData = {
    fromAccountId: transferData.fromAccountId,
    toAccountId: transferData.toAccountId,
    amount: transferData.amount,
    reference: transferData.description,
  };

  const response = await fetch(`${API_BASE_URL}/accounts/transfer`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(backendData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // NestJS BadRequestException returns message property, not error
    const errorMessage = errorData.message || errorData.error || `Failed to transfer money: ${response.statusText}`;
    
    // Check if it's an insufficient funds error
    const isInsufficientFunds = response.status === 400 && errorMessage.toLowerCase().includes('insufficient funds');
    
    // Create a custom error with a message that includes the type information
    let finalErrorMessage = errorMessage;
    if (isInsufficientFunds) {
      finalErrorMessage = 'INSUFFICIENT_FUNDS:' + errorMessage;
    }
    
    const error = new Error(finalErrorMessage);
    throw error;
  }

  const data: TransferResponse = await response.json();
  
  // Backend returns simplified account objects, need to convert them properly
  const fromAccountConverted: Account = {
    id: data.data.fromAccount.id,
    name: data.data.fromAccount.name,
    iban: data.data.fromAccount.iban,
    balance: parseFloat(data.data.fromAccount.balance?.toString() || '0'),
    currency: data.data.fromAccount.currency || 'EUR',
    type: 'checking', // Default since backend doesn't return type in transfer response
    status: 'active', // Default since backend doesn't return status in transfer response
    createdAt: new Date().toISOString(),
  };

  const toAccountConverted: Account = {
    id: data.data.toAccount.id,
    name: data.data.toAccount.name,
    iban: data.data.toAccount.iban,
    balance: parseFloat(data.data.toAccount.balance?.toString() || '0'),
    currency: data.data.toAccount.currency || 'EUR',
    type: 'checking', // Default since backend doesn't return type in transfer response
    status: 'active', // Default since backend doesn't return status in transfer response
    createdAt: new Date().toISOString(),
  };

  return {
    fromAccount: fromAccountConverted,
    toAccount: toAccountConverted,
  };
}

export async function closeAccount(accountId: string, transferToAccountId?: string): Promise<{ accountId: string; status: string; balanceTransferred?: number }> {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/close`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify({
      transferToAccountId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.message || `Failed to close account: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.data;
}
