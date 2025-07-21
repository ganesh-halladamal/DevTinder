import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import socketService from '../services/socket';

export const useSocket = (): Socket | null => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Connect to socket
        socketRef.current = socketService.connect(token);
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    } else if (socketRef.current) {
      socketService.disconnect();
      socketRef.current = null;
    }

    return () => {
      if (socketRef.current) {
        socketService.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return socketRef.current;
}; 