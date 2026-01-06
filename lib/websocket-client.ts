'use client';

import React from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(namespace: string) {
	const [socket, setSocket] = React.useState<Socket | null>(null);
	const [isConnected, setIsConnected] = React.useState(false);

	React.useEffect(() => {
		const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
		let current: Socket | null = null;
		let pollInterval: ReturnType<typeof setInterval> | null = null;
		const currentTokenRef = { current: null as string | null };

		const cleanup = () => {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = null;
			}
			if (current) {
				current.close();
				current = null;
			}
			setSocket(null);
			setIsConnected(false);
		};

		const connect = (token: string) => {
			if (current) {
				current.close();
				current = null;
			}

			const newSocket = io(`${BACKEND_URL}${namespace}`, {
				auth: { token },
			});

			newSocket.on('connect', () => {
				setIsConnected(true);
			});

			newSocket.on('disconnect', () => {
				setIsConnected(false);
			});

			newSocket.on('connect_error', (error: Error) => {
				console.error('Erreur de connexion WebSocket:', error);
			});

			current = newSocket;
			setSocket(newSocket);
		};

		const ensureConnected = () => {
			const token = localStorage.getItem('token');
			if (!token) {
				if (currentTokenRef.current) {
					currentTokenRef.current = null;
					cleanup();
				}
				return;
			}

			if (currentTokenRef.current === token) return;

			currentTokenRef.current = token;
			connect(token);
		};

		ensureConnected();
		pollInterval = setInterval(ensureConnected, 1000);

		return () => {
			cleanup();
		};
	}, [namespace]);

	return { socket, isConnected };
}