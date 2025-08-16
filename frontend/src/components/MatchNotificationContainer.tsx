import React from 'react';
import { useMatchNotifications } from '../hooks/useMatchNotifications';
import MatchNotification from './MatchNotification';

const MatchNotificationContainer: React.FC = () => {
  const { notifications, dismissNotification } = useMatchNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification, index) => (
        <div
          key={notification.matchId}
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index
          }}
        >
          <MatchNotification
            matchId={notification.matchId}
            user={notification.user}
            message={notification.message}
            onDismiss={dismissNotification}
          />
        </div>
      ))}
    </div>
  );
};

export default MatchNotificationContainer;
