export type UserRole = 'client' | 'advisor' | 'director';

export interface BankAccount {
  id: string;
  clientId: string;
  clientName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  balance: number;
  status: 'active' | 'suspended' | 'banned';
  createdAt: Date;
  savingsRate?: number;
}

export interface SavingsRateUpdate {
  oldRate: number;
  newRate: number;
  updatedAt: Date;
  updatedBy: string;
  affectedAccounts: number;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  isAvailable: boolean;
  createdAt: Date;
  lastModified: Date;
  ownedByClients: number;
}

export interface DirectorStats {
  totalAccounts: number;
  activeAccounts: number;
  suspendedAccounts: number;
  bannedAccounts: number;
  totalStocks: number;
  availableStocks: number;
  currentSavingsRate: number;
}