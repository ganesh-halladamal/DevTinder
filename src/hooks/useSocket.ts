import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import socketService from '../services/socket';
import type { Socket } from '../types/socket.io-client';

interface UseSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
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

  const sendMessage = useCallback((conversationId: string, text: string, attachments: any[] = []) => {
    if (!socketRef.current) {
      console.error('Socket not connected');
      return;
    }
    socketRef.current.emit('send_message', { conversationId, text, attachments });
  }, []);

  const sendTypingStart = useCallback((conversationId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing_start', conversationId);
  }, []);

  const sendTypingStop = useCallback((conversationId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing_stop', conversationId);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('join_conversation', conversationId);
  }, []);

  const markMessagesAsRead = useCallback((conversationId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('mark_messages_read', conversationId);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    sendTypingStart,
    sendTypingStop
  };
}; 