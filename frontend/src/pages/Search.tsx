import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Heart, X, MapPin, Briefcase, BookOpen, RefreshCw, User, Sparkles, Star, Zap } from 'lucide-react';
import { formatAvatarUrl } from '../utils/imageUtils';
import api from '../services/api';
import ProfileViewModal from '../components/ProfileViewModal';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  jobRole?: string;
  skills?: Array<{
    name: string;
    proficiency: string;
  }>;
  projects?: Array<{
    title: string;
    description: string;
    techStack: string[];
  }>;
}

const Search: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setNetworkError(null);

      console.log('Fetching potential matches...');
      const response = await api.get('/users/matches/potential');
      console.log('Potential matches response:', response.data);

      // Handle different response formats
      let usersData: any[] = [];
      const data = response.data as any;
      if (Array.isArray(data)) {
        usersData = data;
      } else if (data?.users && Array.isArray(data.users)) {
        usersData = data.users;
      } else if (data?.data && Array.isArray(data.data)) {
        usersData = data.data;
      } else {
        usersData = Array.isArray(data) ? data : (data?.users || data?.data || []);
      }

      setUsers(usersData as User[]);

    } catch (error: any) {
      console.error('Error fetching users:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMessage = 'Failed to load users';

      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - check server at http://localhost:5000';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please login to view users';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied - please login';
      } else if (error.response?.status === 404) {
        errorMessage = 'No potential matches found';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error - please try again later';
      } else if (error.response?.status === 503) {
        errorMessage = 'Service unavailable - server may be starting';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timeout - server may be slow';
      }

      setNetworkError(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetUserId: string) => {
    try {
      setConnecting(targetUserId);
      console.log('Sending like to user:', targetUserId);

      const response = await api.post(`/users/matches/like/${targetUserId}`);
      const responseData = response.data as { message: string; isMatch?: boolean };

      console.log('Like response:', responseData);

      if (responseData.isMatch) {
        alert('It\'s a match! You can now chat with each other.');
      } else {
        alert('Connection request sent!');
      }

      setUsers(users.filter(u => u._id !== targetUserId));

    } catch (error: any) {
      console.error('Error connecting:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMessage = 'Connection failed';

      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - check connection';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Already connected';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please login to continue';
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error - please try again';
      } else if (error.response?.status === 503) {
        errorMessage = 'Service unavailable - please try again';
      }

      alert(errorMessage);

    } finally {
      setConnecting(null);
    }
  };

  const handleSkip = async (targetUserId: string) => {
    try {
      console.log('Skipping user:', targetUserId);
      await api.post(`/users/matches/dislike/${targetUserId}`);
      setUsers(users.filter(u => u._id !== targetUserId));
    } catch (error: any) {
      console.error('Error skipping user:', error);
      // Even if the API call fails, remove from UI for better UX
      setUsers(users.filter(u => u._id !== targetUserId));
      
      // Optional: Show a subtle error message instead of alert
      console.warn('Skip action completed locally, but server sync failed');
    }
  };

  const handleRetry = () => {
    fetchUsers();
  };

  const handleViewProfile = (userId?: string) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-200 dark:border-indigo-800 opacity-30"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-b-2 border-indigo-600 dark:border-indigo-400 border-r-2 border-transparent"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading potential matches...</p>
        </div>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
            <p className="font-bold">Network Error</p>
            <p>{networkError}</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>Server should be running at:</p>
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">http://localhost:5000</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No users found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {networkError || 'No new users to connect with right now. Check back later!'}
            </p>
            <div className="space-y-4">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Tip: If you just started the app, try running:</p>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                  npm run seed
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 animate-fade-in">
            Find Your Perfect Match
          </h1>
          <p className="text-gray-600 dark:text-gray-400 animate-fade-in delay-100">
            Discover talented developers to collaborate with
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user._id}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700">
                <img
                  src={formatAvatarUrl(user.avatar)}
                  alt={user.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.png';
                  }}
                />
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {user.name}
                </h3>

                {user.jobRole && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mt-1">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {user.jobRole}
                  </div>
                )}
                

                {user.location && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {user.location}
                  </div>
                )}

                {user.bio && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                    {user.bio.substring(0, 100)}...
                  </p>
                )}

                {user.skills && user.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {user.skills.slice(0, 3).map((skill, index) => (
                      <motion.span
                        key={index}
                        className="inline-block bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 text-indigo-800 dark:text-indigo-200 text-xs px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-700"
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {typeof skill === 'string' ? skill : skill.name}
                      </motion.span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  <motion.button
                    onClick={() => handleConnect(user._id)}
                    disabled={connecting === user._id}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2.5 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {connecting === user._id ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                        </motion.div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Heart className="w-4 h-4 mr-2" fill="currentColor" />
                        </motion.div>
                        Connect
                      </>
                    )}
                  </motion.button>
                  
                  <button
                    onClick={() => handleSkip(user._id)}
                    disabled={connecting === user._id}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-rose-700 dark:from-red-600 dark:to-rose-700 dark:hover:from-red-700 dark:hover:to-rose-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg group-hover:shadow-lg"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Skip
                  </button>
                </div>

                <button
                  onClick={() => handleViewProfile(user._id)}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition-all duration-300 text-sm shadow-md hover:shadow-lg"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <ProfileViewModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={selectedUserId}
      />
    </div>
  );
};

export default Search;