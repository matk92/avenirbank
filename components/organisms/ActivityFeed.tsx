'use client';

import { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/SectionTitle';
import ActivityCard from '@/components/molecules/ActivityCard';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTime } from '@/lib/format';

interface Activity {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
}

export default function ActivityFeed() {
  const { t, language } = useI18n();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    let activitySource: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectActivityTimeout: ReturnType<typeof setTimeout> | null = null;
    const currentTokenRef = { current: null as string | null };

    const cleanup = () => {
      if (reconnectActivityTimeout) {
        clearTimeout(reconnectActivityTimeout);
        reconnectActivityTimeout = null;
      }

      activitySource?.close();
      activitySource = null;
    };

    const fetchInitialData = async (token: string) => {
      try {
        const activitiesRes = await fetch('/api/advisor/activities', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!activitiesRes.ok) {
          setActivities([]);
          return;
        }

        const data = await activitiesRes.json();
        setActivities(Array.isArray(data) ? (data as Activity[]) : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setActivities([]);
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