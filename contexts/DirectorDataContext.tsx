'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BankAccount, Stock, DirectorStats } from '@/lib/types-director';

interface DirectorDataState {
  accounts: BankAccount[];
  stocks: Stock[];
  stats: DirectorStats;
  currentSavingsRate: number;
}

interface DirectorDataContextType extends DirectorDataState {
  setAccounts: (accounts: BankAccount[]) => void;
  setStocks: (stocks: Stock[]) => void;
  setStats: (stats: DirectorStats) => void;
  updateSavingsRate: (newRate: number) => void;
  addAccount: (account: BankAccount) => void;
  updateAccount: (account: BankAccount) => void;
  deleteAccount: (accountId: string) => void;
  addStock: (stock: Stock) => void;
  updateStock: (stock: Stock) => void;
  deleteStock: (stockId: string) => void;
}

const DirectorDataContext = createContext<DirectorDataContextType | undefined>(undefined);

export function DirectorDataProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stats, setStats] = useState<DirectorStats>({
    totalAccounts: 0,
    activeAccounts: 0,
    suspendedAccounts: 0,
    bannedAccounts: 0,
    totalStocks: 0,
    availableStocks: 0,
    currentSavingsRate: 2.5,
  });
  const [currentSavingsRate, setCurrentSavingsRate] = useState(2.5);

  useEffect(() => {
    const fetchSavingsRate = async () => {
      try {
        const response = await fetch('/api/savings-rate');
        if (response.ok) {
          const data = await response.json();
          const rate = data.rate || 2.5;
          setCurrentSavingsRate(rate);
          setStats(prev => ({ ...prev, currentSavingsRate: rate }));
        }
      } catch (error) {
        console.error('Error fetching savings rate:', error);
      }
    };
    fetchSavingsRate();
  }, []);

  const updateSavingsRate = (newRate: number) => {
    setCurrentSavingsRate(newRate);
    setStats(prev => ({ ...prev, currentSavingsRate: newRate }));
  };

  const addAccount = (account: BankAccount) => {
    setAccounts(prev => [...prev, account]);
  };

  const updateAccount = (updatedAccount: BankAccount) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === updatedAccount.id ? updatedAccount : acc
    ));
  };

  const deleteAccount = (accountId: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  const addStock = (stock: Stock) => {
    setStocks(prev => [...prev, stock]);
  };

  const updateStock = (updatedStock: Stock) => {
    setStocks(prev => prev.map(stock => 
      stock.id === updatedStock.id ? updatedStock : stock
    ));
  };

  const deleteStock = (stockId: string) => {
    setStocks(prev => prev.filter(stock => stock.id !== stockId));
  };

  return (
    <DirectorDataContext.Provider value={{
      accounts,
      stocks,
      stats,
      currentSavingsRate,
      setAccounts,
      setStocks,
      setStats,
      updateSavingsRate,
      addAccount,
      updateAccount,
      deleteAccount,
      addStock,
      updateStock,
      deleteStock,
    }}>
      {children}
    </DirectorDataContext.Provider>
  );
}

export function useDirectorData() {
  const context = useContext(DirectorDataContext);
  if (!context) {
    throw new Error('useDirectorData must be used within DirectorDataProvider');
  }
  return context;
}