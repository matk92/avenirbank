'use client';

import SectionTitle from '@/components/atoms/SectionTitle';
import ActivityCard from '@/components/molecules/ActivityCard';
import NotificationItem from '@/components/molecules/NotificationItem';
import { useClientData } from '@/contexts/ClientDataContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTime } from '@/lib/format';

export default function ActivityFeed() {
  const { state, markNotificationRead } = useClientData();
  const { t, language } = useI18n();

  return (
    <div className="flex flex-col gap-10">
      <SectionTitle title={t('dashboard.activityFeed')} subtitle={t('activity.subtitle')} />
      <div className="grid gap-4">
        {state.notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            message={notification.message}
            createdAt={formatDateTime(notification.createdAt, language)}
            read={notification.read}
            onMarkAsRead={() => markNotificationRead(notification.id)}
          />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {state.activity.map((item) => (
          <ActivityCard
            key={item.id}
            title={item.title}
            description={item.description}
            timestamp={formatDateTime(item.publishedAt, language)}
            actionLabel={t('activity.readMore')}
          />
        ))}
      </div>
    </div>
  );
}
