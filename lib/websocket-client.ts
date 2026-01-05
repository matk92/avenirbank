'use client';

import React from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(namespace: string) {
	const [socket, setSocket] = React.useState<Socket | null>(null);
	const [isConnected, setIsConnected] = React.useState(false);

	React.useEffect(() => {
		const newSocket = io(`http://localhost:3001${namespace}`, {
			auth: {
				token: localStorage.getItem('token'),
			},
		});

		newSocket.on('connect', () => {
			console.log('WebSocket connecté');
			setIsConnected(true);
		});

		newSocket.on('disconnect', () => {
			console.log('WebSocket déconnecté');
			setIsConnected(false);
		});

		newSocket.on('connect_error', (error: Error) => {
			console.error('Erreur de connexion WebSocket:', error);
		});

		setSocket(newSocket);

		return () => {
			newSocket.close();
		};
	}, [namespace]);

	return { socket, isConnected };
}