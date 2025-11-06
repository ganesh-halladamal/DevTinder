import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usersAPI } from '../services/api';
import { Camera, Save, Plus, X, Trash2, Github, ExternalLink, Edit3, AlertCircle } from 'lucide-react';

interface Skill {
  name: string;
  proficiency: string;
}

interface Project {
  _id?: string;
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
}

const MAX_FILE_SIZE = 100 * 1024; // 100KB in bytes
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const projectsSectionRef = useRef<HTMLDivElement>(null);
  
  // Get activeTab from location state if available
  const activeTab = location.state?.activeTab;
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    jobRole: '',
    skills: [] as Skill[],
    newSkill: '',
    newSkillProficiency: 'intermediate',
    socialLinks: {
      github: '',
      linkedin: '',
      twitter: '',
      portfolio: ''
    },
    avatar: '',
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState<Project>({
    title: '',
    description: '',
    techStack: [],
    repoUrl: '',
    liveUrl: ''
  });
  const [newTechStack, setNewTechStack] = useState('');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    loadCurrentProfile();
  }, [user]);
  
  // Scroll to projects section if activeTab is 'projects'
  useEffect(() => {
    if (activeTab === 'projects' && projectsSectionRef.current && !isLoading) {
      projectsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, isLoading]);

  const loadCurrentProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('User object in loadCurrentProfile:', user);
      
      // Check for both _id and id properties to handle different API responses
      const userId = user._id || user.id;
      
      if (!userId) {
        console.error('No user ID found in user object:', user);
        setError('User ID not found. Please log out and log in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Using user ID for profile fetch:', userId);
      const response = await usersAPI.getUserById(userId);
      
      // Properly type the response data
      type ApiResponse = { data: { user: any } };
      const typedResponse = response as ApiResponse;
      const profile = typedResponse.data.user;
      
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        jobRole: profile.jobRole || '',
        skills: profile.skills || [],
        newSkill: '',
        newSkillProficiency: 'intermediate',
        socialLinks: {
          github: profile.socialLinks?.github || '',
          linkedin: profile.socialLinks?.linkedin || '',
          twitter: profile.socialLinks?.twitter || '',
          portfolio: profile.socialLinks?.portfolio || ''
        },
        avatar: profile.avatar || ''
      });
      
      setProjects(profile.projects || []);
    } catch (error) {
      console.error('Failed to load profile:', error);
      showToast('error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested socialLinks fields
    if (name.startsWith('socialLinks.')) {
      const socialLinkKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev, 
        socialLinks: {
          ...prev.socialLinks,
          [socialLinkKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillAdd = () => {
    if (formData.newSkill.trim() && !formData.skills.some(skill => skill.name === formData.newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, {
          name: prev.newSkill.trim(),
          proficiency: prev.newSkillProficiency
        }],
        newSkill: ''
      }));
    }
  };

  const handleSkillRemove = (skillName: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.name !== skillName)
    }));
  };
  
  const handleNewProjectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
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
      showToast('error', 'Project title is required');
      return;
    }
    
    if (editingProject) {
      // Update existing project
      setProjects(prev => prev.map(p => 
        p._id === editingProject ? { ...newProject, _id: editingProject } : p
      ));
      setEditingProject(null);
    } else {
      // Add new project
      setProjects(prev => [...prev, { ...newProject, _id: `temp-${Date.now()}` }]);
    }
    
    // Reset form
    setNewProject({
      title: '',
      description: '',
      techStack: [],
      repoUrl: '',
      liveUrl: ''
    });
  };
  
  const handleEditProject = (project: Project) => {
    setNewProject(project);
    setEditingProject(project._id || null);
  };
  
  const handleRemoveProject = (projectId: string | undefined) => {
    if (!projectId) return;
    
    setProjects(prev => prev.filter(p => p._id !== projectId));
    
    if (editingProject === projectId) {
      setEditingProject(null);
      setNewProject({
        title: '',
        description: '',
        techStack: [],
        repoUrl: '',
        liveUrl: ''
      });
    }
  };
  
  const getAvatarUrl = (avatarPath: string) => {
    console.log('Avatar path in EditProfile:', avatarPath);
    
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
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type (only allow JPG and PNG)
    const fileType = file.type.toLowerCase();
    if (fileType !== 'image/jpeg' && fileType !== 'image/png') {
      showToast('error', 'Only JPG and PNG images are allowed');
      return;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      showToast('error', `Image size must be less than ${MAX_FILE_SIZE / 1024}KB`);
      return;
    }
    
    console.log('Processing image upload:', file.name, 'type:', fileType, 'size:', Math.round(file.size / 1024), 'KB');
    
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        console.log('Image converted to base64 string, length:', reader.result.length);
        setFormData(prev => ({
          ...prev,
          avatar: reader.result as string
        }));
        showToast('success', 'Image uploaded successfully. Save profile to apply changes.');
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      showToast('error', 'Failed to process image. Please try again.');
    };
    reader.readAsDataURL(file);
  };
  
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const userData = {
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        jobRole: formData.jobRole,
        skills: formData.skills,
        projects: projects,
        avatar: formData.avatar,
        socialLinks: formData.socialLinks
      };
      
      console.log('Sending profile update to server:', {
        ...userData,
        avatar: userData.avatar ? userData.avatar.substring(0, 30) + '...' : null,
        jobRole: userData.jobRole // Log job role specifically
      });
      
      await usersAPI.updateProfile(userData);
      showToast('success', 'Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast('error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-purple-100 mt-1">Update your developer profile</p>
          </div>
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add error display
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setError(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Dismiss
            </button>
            <button 
              onClick={loadCurrentProfile}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center 
          ${toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <span className={`${toast.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {toast.message}
          </span>
          <button 
            onClick={() => setToast(null)} 
            className="ml-4 text-gray-400 hover:text-gray-600 dark:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-purple-100 mt-1">Update your developer profile</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={getAvatarUrl(formData.avatar)} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.svg'; 
                  e.currentTarget.onerror = null;
                }}
              />
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-1 cursor-pointer">
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
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-200">Profile Image</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Click the camera icon to upload a new profile image (JPG/PNG only)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">Max file size: 100KB</p>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-200 mb-2">Name*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-200 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Tell us about yourself"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-200 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-200 mb-2">Job Role</label>
                <input
                  type="text"
                  name="jobRole"
                  value={formData.jobRole}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="e.g., Full Stack Developer, Frontend Engineer"
                />
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Skills</h2>
            <div className="space-y-4">
              <div className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Add a Skill</label>
                  <input
                    type="text"
                    name="newSkill"
                    value={formData.newSkill}
                    onChange={handleInputChange}
                    placeholder="e.g., React, Node.js, MongoDB"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Proficiency</label>
                  <select
                    name="newSkillProficiency"
                    value={formData.newSkillProficiency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleSkillAdd}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm rounded-full flex items-center gap-1">
                    {skill.name} ({skill.proficiency})
                    <button type="button" onClick={() => handleSkillRemove(skill.name)} className="text-purple-500 hover:text-purple-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {formData.skills.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No skills added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div ref={projectsSectionRef} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {editingProject ? 'Edit Project' : 'Add a New Project'}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Project Title*</label>
                <input
                  type="text"
                  name="title"
                  value={newProject.title}
                  onChange={handleNewProjectChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Your project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Description</label>
                <textarea
                  name="description"
                  value={newProject.description}
                  onChange={handleNewProjectChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Describe your project"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Repository URL</label>
                <input
                  type="url"
                  name="repoUrl"
                  value={newProject.repoUrl || ''}
                  onChange={handleNewProjectChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="https://github.com/username/repo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Live Demo URL</label>
                <input
                  type="url"
                  name="liveUrl"
                  value={newProject.liveUrl || ''}
                  onChange={handleNewProjectChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="https://your-project.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Technologies Used</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTechStack}
                    onChange={(e) => setNewTechStack(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    placeholder="e.g., React, Node.js"
                  />
                  <button
                    type="button"
                    onClick={handleAddTechToProject}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newProject.techStack.map((tech, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full flex items-center gap-1">
                      {tech}
                      <button type="button" onClick={() => handleRemoveTechFromProject(tech)} className="text-blue-500 hover:text-blue-700">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingProject ? 'Update Project' : 'Add Project'}
                </button>
                {editingProject && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject(null);
                      setNewProject({
                        title: '',
                        description: '',
                        techStack: [],
                        repoUrl: '',
                        liveUrl: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700/50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-3 mt-6 text-gray-900 dark:text-gray-100">Your Projects</h3>
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project._id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{project.title}</h4>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditProject(project)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(project._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mt-1">{project.description}</p>
                    <div className="flex gap-2 mt-2">
                      {project.repoUrl && (
                        <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">
                          <Github className="w-3 h-3" /> Repo
                        </a>
                      )}
                      {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No projects added yet</p>
            )}
          </div>

          {/* Social Links Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Social Links</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">GitHub</label>
                <input
                  type="url"
                  name="socialLinks.github"
                  value={formData.socialLinks.github}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">LinkedIn</label>
                <input
                  type="url"
                  name="socialLinks.linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Twitter</label>
                <input
                  type="url"
                  name="socialLinks.twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="https://twitter.com/username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Portfolio</label>
                <input
                  type="url"
                  name="socialLinks.portfolio"
                  value={formData.socialLinks.portfolio}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
