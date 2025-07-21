import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  owner: {
    id: string;
    name: string;
    avatar: string;
  };
  contributors: number;
  isOpen: boolean;
  githubUrl?: string;
  demoUrl?: string;
  createdAt: string;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      // For now, use the user's projects from their profile
      // In a real implementation, this would fetch all public projects
      setProjects([]);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link
          to="/projects/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
        >
          Add Project
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <img
                src={project.owner.avatar}
                alt={project.owner.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="text-sm font-medium">{project.owner.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{project.description}</p>

            <div className="flex flex-wrap gap-1 mb-4">
              {project.technologies.map(tech => (
                <span key={tech} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {tech}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{project.contributors} contributors</span>
              {project.isOpen && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  Open Source
                </span>
              )}
            </div>

            <div className="flex space-x-2">
              <Link
                to={`/projects/${project.id}`}
                className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-sm"
              >
                View Details
              </Link>
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-gray-600 hover:text-gray-800"
                >
                  GitHub
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;