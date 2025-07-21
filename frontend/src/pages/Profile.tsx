import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usersAPI } from '../services/api';
import { MapPin, Briefcase, Calendar, Github, Linkedin, Edit3, Settings } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  skills: string[];
  experience: string;
  location: string;
  github: string;
  linkedin: string;
  projects: number;
  matches: number;
  joinedDate: string;
}

const Profile: React.FC = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [authUser]);

  const loadUserProfile = async () => {
    if (!authUser) return;
    
    try {
      setIsLoading(true);
      // Use _id from the user object
      const userId = authUser._id;
      const response = await usersAPI.getUserById(userId);
      const profile = (response as any).data.user;
      
      setUser({
        id: profile._id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar || 'https://via.placeholder.com/150',
        bio: profile.bio || 'No bio provided',
        skills: profile.skills?.map((s: any) => s.name) || [],
        experience: profile.skills?.[0]?.proficiency || 'intermediate',
        location: profile.location || 'Location not provided',
        github: profile.socialLinks?.github || '',
        linkedin: profile.socialLinks?.linkedin || '',
        projects: profile.projects?.length || 0,
        matches: profile.matches?.length || 0,
        joinedDate: profile.createdAt || new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center space-x-6">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8">User not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-32 h-32 rounded-full border-4 border-white/20 object-cover"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
            <p className="text-xl opacity-90">{user.experience}</p>
            <p className="flex items-center justify-center md:justify-start mt-2">
              <MapPin className="h-4 w-4 mr-2" />
              {user.location}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/profile/edit">
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            </Link>
            <Link to="/settings">
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">About Me</h2>
            <p className="text-gray-700 mb-4">{user.bio}</p>
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-3 text-purple-500" />
                Member since {new Date(user.joinedDate).toLocaleDateString()}
              </div>
              <div className="flex items-center text-gray-600">
                <Briefcase className="h-5 w-5 mr-3 text-purple-500" />
                {user.experience}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Skills & Technologies</h2>
            <div className="flex flex-wrap gap-2">
              {user.skills.map(skill => (
                <span key={skill} className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Projects</span>
                <span className="font-bold text-purple-600">{user.projects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Matches</span>
                <span className="font-bold text-pink-600">{user.matches}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Connect</h3>
            <div className="space-y-3">
              <a href={user.github} className="flex items-center text-gray-700 hover:text-purple-600">
                <Github className="h-5 w-5 mr-2" />
                GitHub
              </a>
              <a href={user.linkedin} className="flex items-center text-gray-700 hover:text-purple-600">
                <Linkedin className="h-5 w-5 mr-2" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile