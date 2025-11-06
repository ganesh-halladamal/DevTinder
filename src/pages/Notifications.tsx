import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationsAPI } from '../services/api';

interface Notification {
  _id: string;
  type: 'match' | 'message' | 'like' | 'superlike' | 'project_invite' | 'system';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  sender?: {
    _id: string;
    name: string;
    avatar: string;
  };
  data?: {
    actionUrl?: string;
    conversationId?: string;
    matchId?: string;
    projectId?: string;
  };
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCountState, setUnreadCountState] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [page]);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications({ page, limit: 20 });
      const data = response.data as {
        notifications: Notification[];
        unreadCount: number;
        pagination: {
          page: number;
          pages: number;
        }
      };
      
      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      
      setUnreadCountState(data.unreadCount || 0);
      setHasMore(data.pagination.page < data.pagination.pages);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCountState(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCountState(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      match: '💕',
      message: '💬',
      like: '👍',
      superlike: '❤️',
      project_invite: '🚀'
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const displayUnreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {unreadCountState > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-indigo-600 hover:text-indigo-700 text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification._id}
              className={`bg-white shadow rounded-lg p-4 flex items-start space-x-4 ${
                !notification.read ? 'border-l-4 border-indigo-500' : ''
              }`}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {formatTime(notification.createdAt)}
                    </span>
                    
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center space-x-4">
                  {notification.sender && (
                    <div className="flex items-center space-x-2">
                      <img
                        src={notification.sender.avatar || '/default-avatar.png'}
                        alt={notification.sender.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs text-gray-600">
                        {notification.sender.name}
                      </span>
                    </div>
                  )}
                  
                  {notification.data?.actionUrl && (
                    <Link
                      to={notification.data.actionUrl}
                      onClick={() => markAsRead(notification._id)}
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      View →
                    </Link>
                  )}
                  
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="text-xs text-gray-600 hover:text-gray-700"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;