import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, X } from 'lucide-react';
import { formatAvatarUrl } from '../utils/imageUtils';

interface MatchNotificationProps {
  matchId: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  message: string;
  onDismiss: (matchId: string) => void;
}

const MatchNotification: React.FC<MatchNotificationProps> = ({
  matchId,
  user,
  message,
  onDismiss
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-in-right">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Heart className="h-8 w-8 text-pink-500 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                It's a Match!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={() => onDismiss(matchId)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={formatAvatarUrl(user.avatar)}
            alt={user.name}
            className="h-12 w-12 rounded-full object-cover border-2 border-pink-500"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {user.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You can now chat!
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link
            to={`/chat/${matchId}`}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 text-center"
          >
            Send Message
          </Link>
          <Link
            to="/matches"
            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-4 rounded-lg transition-colors text-center"
          >
            View Matches
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MatchNotification;
