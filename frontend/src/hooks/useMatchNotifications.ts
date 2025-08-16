import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import socketService from '../services/socket';

interface MatchNotification {
  matchId: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  message: string;
  timestamp: Date;
}

interface UseMatchNotificationsReturn {
  notifications: MatchNotification[];
  dismissNotification: (matchId: string) => void;
  clearAllNotifications: () => void;
}

export const useMatchNotifications = (): UseMatchNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);

  const addNotification = useCallback((notification: Omit<MatchNotification, 'timestamp'>) => {
    const newNotification: MatchNotification = {
      ...notification,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => 
        prev.filter(n => n.matchId !== notification.matchId)
      );
    }, 5000);
  }, []);

  const dismissNotification = useCallback((matchId: string) => {
    setNotifications(prev => prev.filter(n => n.matchId !== matchId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (!user) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const handleMatchCreated = (data: {
      matchId: string;
      user: {
        _id: string;
        name: string;
        avatar?: string;
      };
      message: string;
    }) => {
      console.log('New match notification:', data);
      addNotification(data);
    };

    socket.on('matchCreated', handleMatchCreated);

    return () => {
      socket.off('matchCreated', handleMatchCreated);
    };
  }, [user, addNotification]);

  return {
    notifications,
    dismissNotification,
    clearAllNotifications
  };
};
