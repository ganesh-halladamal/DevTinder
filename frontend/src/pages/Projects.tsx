import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { projectsAPI, usersAPI } from '../services/api';
import { Plus, Github, ExternalLink, Code } from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
  images?: string[];
}

const Projects: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('User object in loadProjects:', user);
      
      // Check for both _id and id properties
      const userId = user._id || user.id;
      
      if (!userId) {
        console.error('No user ID found in user object:', user);
        setError('User ID not found. Please log out and log in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Using user ID for projects fetch:', userId);
      
      // Get user profile to access projects
      const response = await usersAPI.getUserById(userId);
      
      // Type the response properly
      type ApiResponse = { data: { user: any } };
      const typedResponse = response as ApiResponse;
      const userData = typedResponse.data.user;
      
      setProjects(userData.projects || []);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-100 rounded"></div>
              <div className="h-32 bg-gray-100 rounded"></div>
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
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Projects</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadProjects}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
          <Link 
            to="/profile/edit" 
            state={{ activeTab: 'projects' }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add Project
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold mb-2">{project.title}</h2>
                <p className="text-gray-600 mb-4">{project.description}</p>
                
                {project.techStack && project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.techStack.map((tech, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-4">
                  {project.repoUrl && (
                    <a 
                      href={project.repoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      <Github size={18} />
                      Repository
                    </a>
                  )}
                  
                  {project.liveUrl && (
                    <a 
                      href={project.liveUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      <ExternalLink size={18} />
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <Code className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-medium text-gray-700 mb-2">No Projects Yet</h2>
            <p className="text-gray-500 mb-6">Showcase your work by adding projects to your profile</p>
            <Link 
              to="/profile/edit" 
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Add Your First Project
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;