'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface SSEEvent<T = unknown> {
  type: string;
  data: T;
}

interface UseSSEOptions {
  onMessage?: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
}

export function useSSE<T = unknown>(url: string, options: UseSSEOptions = {}) {
  const [lastEvent, setLastEvent] = useState<SSEEvent<T> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fullUrl = url.includes('?')
      ? `${url}&token=${token}`
      : `${url}?token=${token}`;

    const eventSource = new EventSource(fullUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      options.onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as SSEEvent<T>;
        setLastEvent(parsed);
        options.onMessage?.(parsed);
      } catch (e) {
        console.error('Failed to parse SSE event:', e);
      }
    };

    eventSource.onerror = (err) => {
      setError(err);
      setIsConnected(false);
      options.onError?.(err);
      eventSource.close();
      setTimeout(() => connect(), 5000);
    };
  }, [url, options]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { lastEvent, isConnected, error, reconnect: connect };
}

export function useSSEWithAuth(endpoint: string) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const baseUrl = 'http://localhost:3001';
    const url = `${baseUrl}${endpoint}`;

    const eventSource = new EventSource(url, {
      withCredentials: false,
    });

    const originalOpen = eventSource.onopen;
    eventSource.onopen = (e) => {
      setIsConnected(true);
      originalOpen?.call(eventSource, e);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'connected') {
          setEvents((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      reconnectTimeoutRef.current = setTimeout(() => connect(), 5000);
    };

    eventSourceRef.current = eventSource;
  }, [endpoint]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return { events, isConnected, clearEvents };
}