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
    <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 ${read ? 'border-zinc-100 bg-white dark:border-zinc-700 dark:bg-zinc-800' : 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-900/30'}`}>
      <div>
        <p className="text-sm text-zinc-700 dark:text-zinc-200">{message}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{createdAt}</p>
      </div>
      {!read && onMarkAsRead ? (
        <Button variant="ghost" size="sm" onClick={onMarkAsRead}>
          ✓
        </Button>
      ) : null}
    </div>
  );
}
