import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usersAPI } from '../services/api';
import { Heart, X, MapPin, Briefcase } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  skills: Array<{
    name: string;
    proficiency: string;
  }>;
  location?: string;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersAPI.getPotentialMatches();
      const potentialMatches = (response as any).data.users || [];
      
      setUsers(potentialMatches);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load users:', error);
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (animating || currentIndex >= users.length) return;
    
    setAnimating(true);
    console.log(`Swiped ${direction} on user ${users[currentIndex]?.name}`);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setAnimating(false);
    }, 400);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md">
        <div className="text-center mb-8">
          <div className="h-8 w-3/4 bg-gradient-to-r from-purple-200 to-pink-200 rounded animate-pulse mx-auto mb-2"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-80 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
          <div className="p-6">
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= users.length) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">No more developers to show!</h2>
          <p className="text-gray-600 mb-6">
            Check back later for new developers or adjust your preferences.
          </p>
          <Link to="/search">
            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all">
              Browse All Developers
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <div className="container mx-auto py-8 px-4 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Find Your Dev Match
        </h1>
        <p className="text-gray-600">
          Discover talented developers to collaborate with
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
        <div className="relative">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name}
            className="w-full h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="text-2xl font-bold">{currentUser.name}</h3>
            <p className="text-sm opacity-90">
              {currentUser.skills.length > 0 ?
                `${currentUser.skills[0].proficiency} level` :
                'Developer'}
            </p>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-4 text-base leading-relaxed">{currentUser.bio}</p>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-purple-500" />
              {currentUser.location}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Briefcase className="h-4 w-4 mr-2 text-purple-500" />
              {currentUser.skills.length > 0 ?
                `${currentUser.skills[0].proficiency} level` :
                'Developer'}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {currentUser.skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
        
        <div className="px-6 pb-6 flex justify-between gap-4">
          <button 
            onClick={() => handleSwipe('left')}
            disabled={animating}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
            Pass
          </button>
          
          <button 
            onClick={() => handleSwipe('right')}
            disabled={animating}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Heart className="h-5 w-5" />
            Match
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/search">
          <button className="text-purple-600 hover:text-purple-700 font-medium">
            Browse all developers →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;