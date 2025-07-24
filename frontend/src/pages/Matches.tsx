import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { matchesAPI, API_URL } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../hooks/useAuth';

// Function to format avatar URL correctly
const formatAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return '/default-avatar.png';
  
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  const path = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
  return `${API_URL.replace('/api', '')}/${path}`;
};

interface MatchUser {
  _id: string;
  name: string;
  avatar: string;
  bio: string;
}

interface Match {
  _id: string;
  users: MatchUser[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  matchScore?: number;
  commonInterests?: string[];
  commonSkills?: string[];
  updatedAt: string;
}

interface MatchEvent {
  matchId: string;
  users: MatchUser[];
  matchScore?: number;
  commonInterests?: string[];
  commonSkills?: string[];
}

interface MessageEvent {
  match: string;
  content: string;
  createdAt: string;
  sender: string;
  _id: string;
}

const Matches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const loadMatches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching matches from API...');
      const response = await matchesAPI.getMatches() as { data: { matches: Match[] } };
      console.log('Matches fetched:', response.data.matches);
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Failed to load matches:', error);
      setError('Failed to load your matches. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Refresh matches periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      loadMatches();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadMatches]);

  // Real-time updates for new matches and messages
  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (socket) {
      console.log('Setting up socket listeners for matches');
      
      const handleNewMatch = (data: any) => {
        console.log('New match received:', data);
        loadMatches();
      };

      const handleMessageReceived = (data: any) => {
        console.log('New message received:', data);
        setMatches(prevMatches => 
          prevMatches.map(match => 
            match._id === data.match 
              ? { ...match, lastMessage: { content: data.content, createdAt: data.createdAt } }
              : match
          )
        );
      };
      
      socket.on('new_match', handleNewMatch);
      socket.on('message_received', handleMessageReceived);
      
      return () => {
        console.log('Cleaning up socket listeners');
        socket.off('new_match', handleNewMatch);
        socket.off('message_received', handleMessageReceived);
      };
    }
  }, [loadMatches]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading your matches...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button 
            onClick={loadMatches}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!matches || !matches.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">No matches yet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Start swiping to find your perfect dev match!
          </p>
          <Link 
            to="/" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Find Matches
          </Link>
        </div>
      </div>
    );
  }
  
  const getMatchUser = (match: Match) => {
    const currentUserId = user?.id || localStorage.getItem('userId');
    return match.users.find(u => u._id !== currentUserId) || match.users[0];
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Matches</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {matches.length} {matches.length === 1 ? 'developer' : 'developers'} are ready to chat
        </p>
      </div>
      
      <div className="grid gap-4">
        {matches.map((match) => {
          const otherUser = getMatchUser(match);
          
          return (
            <Link
              key={match._id}
              to={`/chat/${match._id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-4 flex items-center space-x-4"
            >
              <div className="relative">
                {otherUser.avatar ? (
                  <img
                    src={formatAvatarUrl(otherUser.avatar)}
                    alt={otherUser.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(otherUser.name)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {otherUser.name}
                  </h3>
                  {match.lastMessage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(match.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                
                {match.commonInterests && match.commonInterests.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {match.commonInterests.slice(0, 3).map((interest, idx) => (
                      <span key={idx} className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full">
                        {interest}
                      </span>
                    ))}
                    {match.commonInterests.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{match.commonInterests.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                {match.lastMessage ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                    {match.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic mt-1">
                    Say hello to start the conversation!
                  </p>
                )}
              </div>
              
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Matches;