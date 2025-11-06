import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usersAPI } from '../services/api';
import { MapPin, Briefcase, Calendar, Github, Linkedin, Twitter, Globe, Edit3, Settings, ExternalLink, Code, Plus, AlertCircle } from 'lucide-react';

interface Skill {
  name: string;
  proficiency: string;
}

interface Project {
  _id: string;
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
  images?: string[];
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  skills: Skill[];
  location: string;
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  projects: Project[];
  matches: string[];
  createdAt: string;
  jobRole?: string; // Added jobRole to the interface
}

interface Stats {
  projects: number;
  matches: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Profile: React.FC = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    matches: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, [authUser]);

  const loadUserProfile = async () => {
    if (!authUser) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Auth user in loadUserProfile:', authUser);
      
      // Check for both _id and id properties
      const userId = authUser._id || authUser.id;
      
      if (!userId) {
        console.error('No user ID found in authUser object:', authUser);
        setError('User ID not found. Please log out and log in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Using user ID for profile fetch:', userId);
      const response = await usersAPI.getUserById(userId);
      
      // Properly type the response data
      type ApiResponse = { data: { user: UserProfile, stats: Stats } };
      const typedResponse = response as ApiResponse;
      const profile = typedResponse.data.user;
      const profileStats = typedResponse.data.stats || {
        projects: profile.projects?.length || 0,
        matches: profile.matches?.length || 0
      };
      
      console.log('Profile data received:', {
        id: profile._id,
        name: profile.name,
        jobRole: profile.jobRole,
        avatar: profile.avatar?.substring(0, 50) + (profile.avatar?.length > 50 ? '...' : ''),
        projectsCount: profile.projects?.length
      });
      
      setUser(profile);
      setStats(profileStats);
    } catch (error: any) {
      console.error('Failed to load user profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getProficiencyColor = (proficiency: string) => {
    switch(proficiency) {
      case 'beginner': return 'bg-blue-100 text-blue-700';
      case 'intermediate': return 'bg-green-100 text-green-700';
      case 'advanced': return 'bg-purple-100 text-purple-700';
      case 'expert': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getAvatarUrl = (avatarPath: string) => {
    console.log('Avatar path:', avatarPath);
    
    // If it's a full URL, use it as is
    if (avatarPath && (avatarPath.startsWith('http://') || avatarPath.startsWith('https://'))) {
      console.log('Using full URL avatar:', avatarPath);
      return avatarPath;
    }
    
    // If it's a relative path from the server, prefix with the base URL (without /api)
    if (avatarPath && avatarPath.startsWith('/uploads/')) {
      // Extract the base URL without the /api part
      const baseURL = API_URL.replace('/api', '');
      const fullPath = `${baseURL}${avatarPath}`;
      console.log('Using server avatar path:', fullPath);
      return fullPath;
    }
    
    // Default to SVG avatar directly
    console.log('Using default avatar');
    return '/default-avatar.svg';
  };
  
  // Toast notification handler
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
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

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Profile</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadUserProfile}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8">User not found</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center 
          ${toast.type === 'success' ? 'bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-800' : 'bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-800'}`}>
          <span className={`${toast.type === 'success' ? 'text-green-700 dark:text-green-100' : 'text-red-700 dark:text-red-100'}`}>
            {toast.message}
          </span>
          <button className="ml-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-6 md:p-8 mb-6 md:mb-8 text-white">
        <div className="flex flex-col items-center md:flex-row md:items-center gap-6">
          <img 
            src={getAvatarUrl(user.avatar)} 
            alt={user.name} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/20 object-cover"
            onError={(e) => {
              e.currentTarget.src = '/default-avatar.svg'; 
              e.currentTarget.onerror = null;
            }}
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.name}</h1>
            <p className="text-lg md:text-xl opacity-90">{user.jobRole || 'Developer'}</p>
            <p className="flex items-center justify-center md:justify-start mt-2">
              <MapPin className="h-4 w-4 mr-2" />
              {user.location || 'Location not specified'}
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Link to="/profile/edit">
              <button className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm md:text-base">
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            </Link>
            <Link to="/settings">
              <button className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm md:text-base">
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold mb-4 dark:text-white">About Me</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{user.bio || 'No bio provided'}</p>
            <div className="space-y-2">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Calendar className="h-5 w-5 mr-3 text-purple-500 dark:text-purple-400" />
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Briefcase className="h-5 w-5 mr-3 text-purple-500 dark:text-purple-400" />
                {user.jobRole || 'Developer'}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold mb-4 dark:text-white">Skills & Technologies</h2>
            {user.skills && user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span key={index} className={`px-3 py-1 text-sm font-medium rounded-full 
                    ${skill.proficiency === 'beginner' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 
                    skill.proficiency === 'intermediate' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' : 
                    skill.proficiency === 'advanced' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100' : 
                    'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100'}`}>
                    {skill.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No skills added yet</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold dark:text-white">Projects</h2>
            </div>

            {user.projects && user.projects.length > 0 ? (
              <div className="space-y-6">
                {user.projects.map((project) => (
                  <div key={project._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">{project.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{project.description}</p>
                    
                    {project.techStack && project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.techStack.map((tech, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-3 mt-2">
                      {project.repoUrl && (
                        <a 
                          href={project.repoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400"
                        >
                          <Github className="h-4 w-4 mr-1" />
                          Repository
                        </a>
                      )}
                      
                      {project.liveUrl && (
                        <a 
                          href={project.liveUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Code className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No projects added yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6">
            <h3 className="text-lg md:text-xl font-bold mb-4 dark:text-white">Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Projects</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{stats.projects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Matches</span>
                <span className="font-bold text-pink-600 dark:text-pink-400">{stats.matches}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6">
            <h3 className="text-lg md:text-xl font-bold mb-4 dark:text-white">Connect</h3>
            <div className="space-y-3">
              {user.socialLinks?.github && (
                <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400">
                  <Github className="h-5 w-5 mr-2" />
                  GitHub
                </a>
              )}
              {user.socialLinks?.linkedin && (
                <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400">
                  <Linkedin className="h-5 w-5 mr-2" />
                  LinkedIn
                </a>
              )}
              {user.socialLinks?.twitter && (
                <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400">
                  <Twitter className="h-5 w-5 mr-2" />
                  Twitter
                </a>
              )}
              {user.socialLinks?.portfolio && (
                <a href={user.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400">
                  <Globe className="h-5 w-5 mr-2" />
                  Portfolio
                </a>
              )}
              {!user.socialLinks?.github && !user.socialLinks?.linkedin && !user.socialLinks?.twitter && !user.socialLinks?.portfolio && (
                <p className="text-gray-500 dark:text-gray-400">No social links added</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;