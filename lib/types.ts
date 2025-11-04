export type AccountType = "checking" | "savings";

export type AccountStatus = "active" | "closed";

export type Account = {
  id: string;
  name: string;
  iban: string;
  balance: number;
  currency: "EUR";
  type: AccountType;
  status: AccountStatus;
  createdAt: string;
};

export type Operation = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  reference: string;
  executedAt: string;
};

export type SavingsAccount = {
  accountId: string;
  dailyRate: number;
  lastCapitalization: string;
};

export type InvestmentSide = "buy" | "sell";

export type InvestmentOrderStatus = "pending" | "executed" | "cancelled";

export type InvestmentOrder = {
  id: string;
  side: InvestmentSide;
  stockSymbol: string;
  quantity: number;
  limitPrice: number;
  fees: number;
  status: InvestmentOrderStatus;
  createdAt: string;
};

export type Stock = {
  symbol: string;
  name: string;
  lastPrice: number;
  currency: "EUR";
};

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
};

export type MessageAuthor = "client" | "advisor";

export type Message = {
  id: string;
  author: MessageAuthor;
  content: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type ClientProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};
