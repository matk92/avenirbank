'use client';

import { useState, useEffect, useCallback } from 'react';
import SectionTitle from '@/components/atoms/SectionTitle';
import ActivityCard from '@/components/molecules/ActivityCard';
import NotificationItem from '@/components/molecules/NotificationItem';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTime } from '@/lib/format';

interface Activity {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
}

interface Notification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function ActivityFeed() {
  const { t, language } = useI18n();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const [activitiesRes, notificationsRes] = await Promise.all([
        fetch('http://localhost:3001/activities', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data);
      }

      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let activitySource: EventSource | null = null;
    let notificationSource: EventSource | null = null;

    const connectActivitySSE = () => {
      activitySource = new EventSource(`http://localhost:3001/sse/activities?token=${token}`);

      activitySource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'activity') {
            setActivities((prev) => [data.data, ...prev]);
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      activitySource.onerror = () => {
        activitySource?.close();
        setTimeout(connectActivitySSE, 5000);
      };
    };

    const connectNotificationSSE = () => {
      notificationSource = new EventSource(`http://localhost:3001/sse/notifications?token=${token}`);

      notificationSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            setNotifications((prev) => [data.data, ...prev]);
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      notificationSource.onerror = () => {
        notificationSource?.close();
        setTimeout(connectNotificationSSE, 5000);
      };
    };

    connectActivitySSE();
    connectNotificationSSE();

    return () => {
      activitySource?.close();
      notificationSource?.close();
    };
  }, []);

  const markNotificationRead = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`http://localhost:3001/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-10">
        <SectionTitle title={t('dashboard.activityFeed')} subtitle={t('activity.subtitle')} />
        <div className="text-center text-zinc-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <SectionTitle title={t('dashboard.activityFeed')} subtitle={t('activity.subtitle')} />
      <div className="grid gap-4">
        {notifications.map((notification) => (
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
        {activities.map((item) => (
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