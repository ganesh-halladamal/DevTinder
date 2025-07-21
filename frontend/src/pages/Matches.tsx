import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchesAPI } from '../services/api';

interface Match {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  bio: string;
  lastMessage?: {
    text: string;
    timestamp: string;
  };
}

const Matches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadMatches = async () => {
      try {
        // Simulating API call
        // const response = await matchesAPI.getMatches();
        // setMatches(response.data);
        
        // Mock data
        setTimeout(() => {
          setMatches([
            {
              id: '1',
              userId: 'user1',
              name: 'Alex Johnson',
              avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
              bio: 'Full-stack developer with 5 years experience',
              lastMessage: {
                text: 'I think we could collaborate on that project',
                timestamp: '2023-05-20T14:30:00Z'
              }
            },
            {
              id: '2',
              userId: 'user2',
              name: 'Sarah Chen',
              avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
              bio: 'UI/UX Designer passionate about clean interfaces',
              lastMessage: {
                text: 'Your portfolio looks amazing!',
                timestamp: '2023-05-19T09:15:00Z'
              }
            }
          ]);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Failed to load matches:', error);
        setIsLoading(false);
      }
    };
    
    loadMatches();
  }, []);
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading matches...</div>;
  }
  
  if (!matches.length) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold mb-4">No matches yet</h2>
        <p className="text-gray-600 mb-4">Start swiping to find your perfect dev match!</p>
        <Link to="/" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded">
          Find Matches
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Matches</h1>
      
      <div className="bg-white shadow rounded-lg">
        {matches.map((match) => (
          <Link
            key={match.id}
            to={`/chat/${match.id}`}
            className="flex items-center p-4 border-b border-gray-200 hover:bg-gray-50"
          >
            <img
              src={match.avatar}
              alt={match.name}
              className="w-12 h-12 rounded-full mr-4"
            />
            <div className="flex-1">
              <div className="flex justify-between">
                <h2 className="font-semibold">{match.name}</h2>
                {match.lastMessage && (
                  <span className="text-sm text-gray-500">
                    {new Date(match.lastMessage.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
              {match.lastMessage && (
                <p className="text-gray-600 text-sm truncate">{match.lastMessage.text}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Matches; 