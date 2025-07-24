import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket as SocketType } from 'socket.io-client';
import { useAuth } from './useAuth';
import socketService from '../services/socket';

interface UseSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { user } = useAuth();
  const socketRef = useRef<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Connect to socket
        socketRef.current = socketService.connect(token);

        socketRef.current.on('connect', () => {
          console.log('Socket connected');
          setIsConnected(true);
          if (options.onConnect) options.onConnect();
        });

        socketRef.current.on('disconnect', (reason: string) => {
          console.log('Socket disconnected:', reason);
          setIsConnected(false);
          if (options.onDisconnect) options.onDisconnect();
        });
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    } else if (socketRef.current) {
      socketService.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }

    return () => {
      if (socketRef.current) {
        socketService.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user, options.onConnect, options.onDisconnect]);

  const sendMessage = useCallback((matchId: string, content: string, attachments: any[] = []) => {
    if (!socketRef.current) {
      console.error('Socket not connected');
      return;
    }
    socketRef.current.emit('private_message', { matchId, content, attachments });
  }, []);

  const sendTypingStart = useCallback((matchId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing_start', matchId);
  }, []);

  const sendTypingStop = useCallback((matchId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing_stop', matchId);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    sendTypingStart,
    sendTypingStop
  };
}; 