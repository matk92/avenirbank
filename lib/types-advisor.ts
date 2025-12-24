export type UserRole = 'client' | 'advisor' | 'director';

export type Activity = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  authorId: string;
  authorName: string;
};

export type CreateActivityPayload = {
  title: string;
  description: string;
};

export type Notification = {
  id: string;
  recipientId: string;
  recipientName: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type SendNotificationPayload = {
  clientId: string;
  message: string;
};

export type PrivateMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  content: string;
  createdAt: string;
};

export type Conversation = {
  clientId: string;
  clientName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type GroupMessage = {
  id: string;
  author: {
    id: string;
    name: string;
    role: UserRole;
  };
  content: string;
  createdAt: string;
};

export type ClientProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export interface Credit {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  annualInterestRate: number;
  insuranceRate: number;
  durationMonths: number;
  monthlyPayment: number;
  monthlyInsurance: number;
  totalAmount: number;
  remainingAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  advisorId: string;
  createdAt: Date;
  approvedAt?: Date;
}

export interface CreditCalculation {
  monthlyPayment: number;
  monthlyInsurance: number;
  totalAmount: number;
  totalInterest: number;
  totalInsurance: number;
  amortizationSchedule: {
    month: number;
    principal: number;
    interest: number;
    insurance: number;
    remainingBalance: number;
  }[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface ConversationFull {
  id: string;
  clientId: string;
  clientName: string;
  advisorId?: string;
  advisorName?: string;
  status: 'pending' | 'active' | 'closed';
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  transferredAt?: Date;
}

export interface ConversationTransfer {
  conversationId: string;
  fromAdvisorId: string;
  fromAdvisorName: string;
  toAdvisorId: string;
  toAdvisorName: string;
  reason: string;
  timestamp: Date;
}