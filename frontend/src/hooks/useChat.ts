import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { messagesAPI } from '../services/api';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  attachments: Array<{
    type: 'image' | 'link' | 'code';
    url: string;
    preview?: string;
    language?: string;
  }>;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

interface MessageResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useChat = (matchId: string) => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: true,
    error: null,
    hasMore: true,
    page: 1
  });

  const { socket, sendMessage: socketSendMessage } = useSocket({
    onConnect: () => {
      // Re-fetch messages when socket reconnects
      fetchMessages(1);
    }
  });

  // Fetch messages
  const fetchMessages = useCallback(async (page: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await messagesAPI.getMessages(matchId);
      const { messages, pagination } = response.data as MessageResponse;
      
      setState(prev => ({
        messages: page === 1 ? messages : [...prev.messages, ...messages],
        isLoading: false,
        error: null,
        hasMore: page < pagination.pages,
        page
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load messages'
      }));
      console.error('Error fetching messages:', error);
    }
  }, [matchId]);

  // Load more messages
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading) {
      fetchMessages(state.page + 1);
    }
  }, [state.hasMore, state.isLoading, state.page, fetchMessages]);

  // Send a message
  const sendMessage = useCallback(async (content: string, attachments: Message['attachments'] = []) => {
    try {
      // Optimistically add message to state
      const tempId = Date.now().toString();
      const tempMessage: Message = {
        id: tempId,
        content,
        sender: {
          id: 'currentUser', // This will be replaced with actual user ID
          name: 'You'
        },
        attachments,
        createdAt: new Date().toISOString(),
        status: 'sent'
      };

      setState(prev => ({
        ...prev,
        messages: [tempMessage, ...prev.messages]
      }));

      // Send message through socket
      socketSendMessage(matchId, content, attachments);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== 'temp')
      }));
    }
  }, [matchId, socketSendMessage]);

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setState(prev => ({
        ...prev,
        messages: [message, ...prev.messages]
      }));
    };

    const handleMessageStatus = (data: { messageId: string; status: Message['status'] }) => {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(message =>
          message.id === data.messageId
            ? { ...message, status: data.status }
            : message
        )
      }));
    };

    socket.on('message_received', handleNewMessage);
    socket.on('message_status', handleMessageStatus);

    return () => {
      socket.off('message_received', handleNewMessage);
      socket.off('message_status', handleMessageStatus);
    };
  }, [socket]);

  // Initial fetch
  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    sendMessage
  };
}; 