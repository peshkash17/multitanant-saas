import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';
import { useNotificationStore } from '../stores/notification.store';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = io(`${WS_URL}/ws`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('notification', (payload) => {
      addNotification(payload);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  return socketRef.current;
}
