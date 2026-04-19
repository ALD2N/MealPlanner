/// <reference types="vite/client" />
import { useEffect, useRef, useCallback, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    // Create socket connection
    socketRef.current = io(WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  const on = useCallback((eventName: string, handler: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(eventName, handler);
    }
  }, []);

  const off = useCallback((eventName: string, handler?: (data: any) => void) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(eventName, handler);
      } else {
        socketRef.current.off(eventName);
      }
    }
  }, []);

  const emit = useCallback((eventName: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(eventName, data);
    }
  }, []);

  return { isConnected, on, off, emit, socket: socketRef.current };
}
