import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Camera, Plus, X } from 'lucide-react';

const MAX_FILE_SIZE = 100 * 1024; // 100KB

interface Project {
  title: string;
  description: string;
  techStack: string[];
}

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [error, setError] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState<Project>({
    title: '',
    description: '',
    techStack: []
  });
  const [newTechStack, setNewTechStack] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register(email, password, name, avatar, projects);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type (only allow JPG and PNG)
    const fileType = file.type.toLowerCase();
    if (fileType !== 'image/jpeg' && fileType !== 'image/png') {
      setError('Only JPG and PNG images are allowed');
      return;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`Image size must be less than ${MAX_FILE_SIZE / 1024}KB`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.onerror = () => {
      setError('Failed to process image');
    };
    reader.readAsDataURL(file);
  };

  const handleAddTechToProject = () => {
    if (newTechStack.trim() && !newProject.techStack.includes(newTechStack.trim())) {
      setNewProject(prev => ({
        ...prev,
        techStack: [...prev.techStack, newTechStack.trim()]
      }));
      setNewTechStack('');
    }
  };
  
  const handleRemoveTechFromProject = (tech: string) => {
    setNewProject(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  };

  const handleAddProject = () => {
    if (!newProject.title.trim()) {
      setError('Project title is required');
      return;
    }
    
    setProjects(prev => [...prev, { ...newProject }]);
    setNewProject({
      title: '',
      description: '',
      techStack: []
    });
    setShowProjectForm(false);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Avatar upload */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <img 
                src={avatar || '/default-avatar.svg'} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover"
              />
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-indigo-600 rounded-full p-1 cursor-pointer">
                <Camera size={16} className="text-white" />
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="hidden" 
                  accept="image/jpeg,image/png"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Profile Image</p>
              <p className="text-xs text-gray-500">Optional: Upload a profile picture</p>
            </div>
          </div>

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Projects section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Projects (Optional)</h3>
            
            {/* Project list */}
            {projects.length > 0 && (
              <div className="space-y-3 mb-4">
                {projects.map((project, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{project.title}</h4>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveProject(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                      {project.description}
                    </p>
                    {project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.techStack.map((tech, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Add project button or form */}
            {!showProjectForm ? (
              <button
                type="button"
                onClick={() => setShowProjectForm(true)}
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
              >
                <Plus size={16} className="mr-1" />
                Add a project
              </button>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title*</label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Your project name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Describe your project"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technologies Used</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTechStack}
                      onChange={(e) => setNewTechStack(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., React, Node.js"
                    />
                    <button
                      type="button"
                      onClick={handleAddTechToProject}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {newProject.techStack.map((tech, i) => (
                      <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center gap-1">
                        {tech}
                        <button type="button" onClick={() => handleRemoveTechFromProject(tech)} className="text-indigo-500 hover:text-indigo-700">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                  >
                    Add Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProjectForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign up
            </button>
          </div>
          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 