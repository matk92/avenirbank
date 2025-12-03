'use client';

import Button from '@/components/atoms/Button';

export type NotificationItemProps = {
  message: string;
  createdAt: string;
  read: boolean;
  onMarkAsRead?: () => void;
};

export default function NotificationItem({ message, createdAt, read, onMarkAsRead }: NotificationItemProps) {
  return (
    <div
      className={`glass-panel flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 ${
        read ? 'opacity-70' : 'border-white/30'
      }`}
    >
      <div>
        <p className="text-sm text-white">{message}</p>
        <p className="text-xs text-white/50">{createdAt}</p>
      </div>
      {!read && onMarkAsRead ? (
        <Button variant="ghost" size="sm" onClick={onMarkAsRead}>
          ✓
        </Button>
      ) : null}
    </div>
  );
}
