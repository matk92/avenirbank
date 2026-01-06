'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    let activitySource: EventSource | null = null;
    let notificationSource: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectActivityTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectNotificationTimeout: ReturnType<typeof setTimeout> | null = null;
    const currentTokenRef = { current: null as string | null };

    const cleanup = () => {
      if (reconnectActivityTimeout) {
        clearTimeout(reconnectActivityTimeout);
        reconnectActivityTimeout = null;
      }
      if (reconnectNotificationTimeout) {
        clearTimeout(reconnectNotificationTimeout);
        reconnectNotificationTimeout = null;
      }

      activitySource?.close();
      notificationSource?.close();
      activitySource = null;
      notificationSource = null;
    };

    const fetchInitialData = async (token: string) => {
      try {
        const [activitiesRes, notificationsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/activities`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BACKEND_URL}/notifications`, {
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
      }
    };

    const connectActivitySSE = (token: string) => {
      activitySource?.close();
      activitySource = new EventSource(`${BACKEND_URL}/sse/activities?token=${token}`);

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
        if (reconnectActivityTimeout) clearTimeout(reconnectActivityTimeout);
        reconnectActivityTimeout = setTimeout(() => {
          if (currentTokenRef.current === token) {
            connectActivitySSE(token);
          }
        }, 5000);
      };
    };

    const connectNotificationSSE = (token: string) => {
      notificationSource?.close();
      notificationSource = new EventSource(`${BACKEND_URL}/sse/notifications?token=${token}`);

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
        if (reconnectNotificationTimeout) clearTimeout(reconnectNotificationTimeout);
        reconnectNotificationTimeout = setTimeout(() => {
          if (currentTokenRef.current === token) {
            connectNotificationSSE(token);
          }
        }, 5000);
      };
    };

    const ensureConnected = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (currentTokenRef.current) {
          currentTokenRef.current = null;
          cleanup();
        }
        setIsLoading(false);
        return;
      }

      if (currentTokenRef.current === token) return;

      currentTokenRef.current = token;
      cleanup();
      setIsLoading(true);
      await fetchInitialData(token);
      connectActivitySSE(token);
      connectNotificationSSE(token);
      setIsLoading(false);
    };

    void ensureConnected();
    pollInterval = setInterval(() => {
      void ensureConnected();
    }, 1000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      cleanup();
    };
  }, []);

  const markNotificationRead = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    try {
      await fetch(`${BACKEND_URL}/notifications/${id}/read`, {
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