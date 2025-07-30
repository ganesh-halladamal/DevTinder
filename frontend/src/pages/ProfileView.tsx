import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usersAPI } from '../services/api';
import { formatAvatarUrl } from '../utils/imageUtils';

const ProfileView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await usersAPI.getUserById(userId);
      setUser((response as any).data.user);
    } catch (error: any) {
      console.error('Failed to load user profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="flex items-center space-x-6">
            <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Error Loading Profile</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8 dark:text-gray-300">User not found</div>;
  }

  const isOwnProfile = authUser && (authUser._id === user._id || authUser.id === user._id);

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-6 md:p-8 mb-6 md:mb-8 text-white">
        <div className="flex flex-col items-center md:flex-row md:items-center gap-6">
          <img 
            src={formatAvatarUrl(user.avatar)} 
            alt={user.name} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/20 object-cover"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.name}</h1>
            <p className="text-lg md:text-xl opacity-90">{user.jobRole || 'Developer'}</p>
            <p className="text-sm opacity-80 mt-1">{user.location || 'Location not specified'}</p>
          </div>
          {isOwnProfile && (
            <div className="flex gap-2 mt-4 md:mt-0">
              <Link to="/profile/edit">
                <button className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm">
                  Edit Profile
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h2 className="text-xl font-bold mb-4 dark:text-white">About Me</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{user.bio || 'No bio provided'}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Skills</h2>
          {user.skills && user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill: any, index: number) => (
                <span key={index} className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                  {skill.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No skills added yet</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Projects</h2>
          {user.projects && user.projects.length > 0 ? (
            <div className="space-y-4">
              {user.projects.map((project: any) => (
                <div key={project._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">{project.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{project.description}</p>
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {project.techStack.map((tech: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded dark:bg-gray-700 dark:text-gray-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {project.repoUrl && (
                      <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                        GitHub Repo
                      </a>
                    )}
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No projects added yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;