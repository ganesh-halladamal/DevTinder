import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ProfileCard from './ProfileCard';

interface User {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  skills: Array<{
    name: string;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
  projects: Array<{
    title: string;
    description: string;
    techStack: string[];
    repoUrl?: string;
    liveUrl?: string;
  }>;
  interests: string[];
}

const SwipeContainer: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch potential matches
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/users/matches/potential');
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to load potential matches');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle swipe action
  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentUser = users[currentIndex];
    if (!currentUser) return;

    try {
      if (direction === 'right') {
        const response = await axios.post(`/api/users/matches/like/${currentUser.id}`);
        if (response.data.isMatch) {
          // Show match notification
          // You can implement a toast or modal here
          console.log('It\'s a match!');
        }
      } else {
        await axios.post(`/api/users/matches/dislike/${currentUser.id}`);
      }

      // Move to next user
      setCurrentIndex(prev => prev + 1);

      // Fetch more users when running low
      if (currentIndex >= users.length - 3) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Error handling swipe:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (users.length === 0 || currentIndex >= users.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">
          No More Profiles
        </h2>
        <p className="text-muted-foreground mb-4">
          Check back later for more potential matches!
        </p>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-[600px]">
      <AnimatePresence>
        <ProfileCard
          key={users[currentIndex].id}
          user={users[currentIndex]}
          onSwipe={handleSwipe}
        />
      </AnimatePresence>
    </div>
  );
};

export default SwipeContainer; 