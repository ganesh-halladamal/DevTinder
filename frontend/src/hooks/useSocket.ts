import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';

interface UseSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Connect to socket
        socketRef.current = socketService.connect(token);

        // Set up event listeners
        socketRef.current.on('connect', () => {
          console.log('Socket connected');
          options.onConnect?.();
        });

        socketRef.current.on('disconnect', () => {
          console.log('Socket disconnected');
          options.onDisconnect?.();
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          options.onError?.(error);
        });
      } catch (error) {
        console.error('Socket initialization error:', error);
        options.onError?.(error as Error);
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, options]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    
    // Message handling
    sendMessage: (matchId: string, content: string, attachments: any[] = []) => {
      socketService.sendMessage(matchId, content, attachments);
    },

    // Typing indicators
    sendTypingStart: (matchId: string) => {
      socketService.sendTypingStart(matchId);
    },

    sendTypingStop: (matchId: string) => {
      socketService.sendTypingStop(matchId);
    },

    // Read receipts
    markMessageAsRead: (messageId: string) => {
      socketService.markMessageAsRead(messageId);
    },

    // Match notifications
    sendMatchNotification: (matchedUserId: string) => {
      socketService.sendMatchNotification(matchedUserId);
    }
  };
}; 