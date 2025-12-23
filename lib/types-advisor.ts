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

// Notifications
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