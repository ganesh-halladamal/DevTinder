import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatAvatarUrl } from '../utils/imageUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MessageCircle, MapPin, Briefcase, Heart, Bookmark, RefreshCw, Bookmark as BookmarkIcon } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

interface Match {
  _id: string;
  displayUser: {
    _id: string;
    name: string;
    avatar: string;
    bio: string;
    jobRole: string;
    location: string;
  };
  matchScore: number;
  isBookmarked: boolean;
}



const Matches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    fetchMatches();
  }, []);

  // Set up real-time match listener
  useEffect(() => {
    if (!socket) return;

    const handleMatchCreated = async (data: {
      matchId: string;
      user: {
        _id: string;
        name: string;
        avatar?: string;
        bio?: string;
        jobRole?: string;
        location?: string;
        skills?: Array<{
          name: string;
          proficiency: string;
        }>;
      };
      message: string;
    }) => {
      console.log('New match received on Matches page:', data);
      
      // Use the complete profile data from socket (no need to fetch from API)
      const newMatch: Match = {
        _id: data.matchId,
        displayUser: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar || '',
          bio: data.user.bio || '',
          jobRole: data.user.jobRole || 'Developer',
          location: data.user.location || ''
        },
        matchScore: 0, // Default score for real-time matches
        isBookmarked: false // Default bookmark status
      };

      // Add the new match to the beginning of the list
      setMatches(prevMatches => {
        // Check if match already exists to avoid duplicates
        const exists = prevMatches.some(match => match._id === newMatch._id);
        if (exists) {
          console.log('Match already exists in list, skipping duplicate');
          return prevMatches;
        }
        console.log('Adding new match to list:', newMatch.displayUser.name);
        return [newMatch, ...prevMatches];
      });

      // Clear any "no matches" error state
      if (error && error.includes('No matches found')) {
        setError(null);
      }
    };

    console.log('Setting up matchCreated listener on Matches page');
    socket.on('matchCreated', handleMatchCreated);

    return () => {
      console.log('Cleaning up matchCreated listener on Matches page');
      socket.off('matchCreated', handleMatchCreated);
    };
  }, [socket, error]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching matches...');
      console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
      
      const response = await api.get('/matches/my-matches');
      console.log('Raw matches response:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      const matchesData = response.data;
      console.log('Matches data type:', typeof matchesData);
      console.log('Matches data:', JSON.stringify(matchesData, null, 2));
      
      if (!Array.isArray(matchesData)) {
        console.error('Expected array but got:', typeof matchesData);
        throw new Error(`Invalid matches data format: expected array but got ${typeof matchesData}`);
      }
      
      console.log(`Processing ${matchesData.length} matches...`);
      
      const validMatches = matchesData.filter((match, index) => {
        console.log(`Processing match ${index + 1}:`, match);
        
        if (!match.displayUser) {
          console.warn(`Match ${index + 1}: Missing displayUser`, match);
          return false;
        }
        
        if (!match.displayUser._id) {
          console.warn(`Match ${index + 1}: Missing displayUser._id`, match.displayUser);
          return false;
        }
        
        console.log(`Match ${index + 1}: Valid - ${match.displayUser.name}`);
        return true;
      });
      
      console.log(`Found ${validMatches.length} valid matches out of ${matchesData.length} total`);
      setMatches(validMatches);
      
      if (validMatches.length === 0) {
        if (matchesData.length === 0) {
          setError('No matches found yet. Keep swiping to find your perfect match!');
          console.log('Debug: No data returned from server - user has no matches');
        } else {
          setError('Error: Found matches in database but they have invalid format. Please check console for details.');
          console.error('Debug: Found matches but all are invalid format:');
          matchesData.forEach((match, index) => {
            console.error(`Invalid match ${index + 1}:`, match);
          });
        }
      } else {
        setError(null);
      }
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      let errorMessage = 'Failed to load matches. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (matchId: string) => {
    try {
      const response = await api.put(`/matches/${matchId}/bookmark`);
      console.log('Bookmark toggle response:', response.data);
      
      // Update the local state
      setMatches(prevMatches =>
        prevMatches.map(match =>
          match._id === matchId
            ? { ...match, isBookmarked: (response.data as any).isBookmarked }
            : match
        )
      );
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Matches</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-300 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-300 animate-pulse"></div>
                    <div className="h-3 w-24 bg-gray-300 animate-pulse"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-20 w-full bg-gray-300 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Matches</h1>
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold mb-2"></h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchMatches} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Matches</h1>
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No matches yet</h2>
            <div className="text-muted-foreground mb-4 space-y-2">
              <p>Start swiping to find your perfect developer match!</p>
              <div className="text-sm text-muted-foreground/80 mt-4">
                <p className="font-medium mb-2">Troubleshooting:</p>
                <ul className="text-left max-w-md mx-auto space-y-1">
                  <li>• Ensure backend server is running on port 5000</li>
                  <li>• Verify database connection is working</li>
                  <li>• Run database setup script if needed</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-4 justify-center">

              <Button
                variant="outline"
                onClick={fetchMatches}
                className="flex items-center gap-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Matches</h1>
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">{matches.length} {matches.length === 1 ? 'match' : 'matches'} found</p>
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Connecting...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <Card key={match._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <img
                      src={formatAvatarUrl(match.displayUser?.avatar)}
                      alt={match.displayUser?.name || 'User'}
                      className="h-full w-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.png';
                      }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{match.displayUser?.name || 'Unknown User'}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3" />
                      {match.displayUser?.jobRole || 'Developer'}
                    </CardDescription>
                    {match.displayUser?.location && (
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3" />
                        {match.displayUser.location}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleBookmark(match._id)}
                    className="p-1 h-8 w-8"
                  >
                    {match.isBookmarked ? (
                      <Bookmark className="h-4 w-4 text-yellow-500 fill-current" />
                    ) : (
                      <BookmarkIcon className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {match.displayUser?.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{match.displayUser.bio}</p>
              )}

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                  <Link to={`/chat/${match._id}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1 border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700" asChild>
                  <Link to={`/profile/${match.displayUser?._id}`}>
                    View Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Matches;