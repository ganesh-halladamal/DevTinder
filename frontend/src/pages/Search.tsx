import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, X, MapPin, Briefcase, BookOpen, RefreshCw } from 'lucide-react';
import { formatAvatarUrl } from '../utils/imageUtils';
import api from '../services/api';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
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
              No new users to connect with right now. Check back later!
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Find Your Perfect Match
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover developers who share your interests
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
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
                  <div className="mt-2 flex flex-wrap gap-1">
                    {user.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded"
                      >
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleConnect(user._id)}
                    disabled={connecting === user._id}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    {connecting === user._id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        Connect
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleSkip(user._id)}
                    disabled={connecting === user._id}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Skip
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;