import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatAvatarUrl } from '../utils/imageUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MessageCircle, MapPin, Briefcase, Heart, Bookmark, X, RefreshCw } from 'lucide-react';

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

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/matches');
      console.log('Matches response:', response.data);
      
      const matchesData = (response.data as any)?.matches || [];
      
      // Ensure we have valid matches array
      const validMatches = Array.isArray(matchesData) ? matchesData : [];
      setMatches(validMatches);
      
      if (validMatches.length === 0) {
        console.log('No matches found - this could be due to:');
        console.log('1. No users in the database');
        console.log('2. No matches created between users');
        console.log('3. All matches have status other than "active"');
        console.log('4. Database connection issues');
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveMatch = async (matchId: string) => {
    try {
      await api.put(`/matches/${matchId}/status`, { status: 'archived' });
      setMatches(prev => prev.filter(match => match._id !== matchId));
    } catch (error) {
      console.error('Error archiving match:', error);
      alert('Failed to archive match. Please try again.');
    }
  };

  // Bookmark functionality removed as requested

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
            <h2 className="text-xl font-semibold mb-2">Error Loading Matches</h2>
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
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link to="/search">Find Matches</Link>
              </Button>
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
        <p className="text-muted-foreground">{matches.length} {matches.length === 1 ? 'match' : 'matches'} found</p>
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
                    onClick={() => handleArchiveMatch(match._id)}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
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