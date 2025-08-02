import React, { useState, useEffect } from 'react';
import { X, MapPin, Briefcase, BookOpen, ExternalLink, Github, Linkedin, Globe, Twitter, Calendar } from 'lucide-react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatAvatarUrl } from '../utils/imageUtils';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  jobRole?: string;
  skills?: Array<{ name: string; proficiency: string }>;
  projects?: Array<{
    title: string;
    description: string;
    techStack: string[];
    liveUrl?: string;
    repoUrl?: string;
  }>;
  experience?: string;
  education?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  createdAt?: string;
}

interface ProfileViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

const ProfileViewModal: React.FC<ProfileViewModalProps> = ({ isOpen, onClose, userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (isOpen && userId) fetchUserProfile();
    else if (isOpen && currentUser && !userId) fetchCurrentUserProfile();
  }, [isOpen, userId, currentUser]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    setLoading(true); setError(null);
    try {
      const response = await usersAPI.getUserById(userId);
      const userData = response.data as { user: User } | User;
      setUser('user' in userData ? userData.user : userData);
    } catch (error: any) {
      setError('Failed to load user profile');
    } finally { setLoading(false); }
  };

  const fetchCurrentUserProfile = async () => {
    if (!currentUser) return;
    setLoading(true); setError(null);
    try {
      const response = await usersAPI.getUserById(currentUser._id);
      const userData = response.data as { user: User } | User;
      setUser('user' in userData ? userData.user : userData);
    } catch (error: any) {
      setError('Failed to load profile');
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.name || 'Profile'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : error ? (
            <div className="text-center p-8"><p className="text-red-500">{error}</p></div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={formatAvatarUrl(user?.avatar)}
                    alt={user?.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.name}</h3>
                  
                  {(user?.jobRole || user?.location) && (
                    <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300 mt-1">
                      {user?.jobRole && (
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          <span>{user.jobRole}</span>
                        </div>
                      )}
                      {user?.jobRole && user?.location && (
                        <span className="text-gray-400"></span>
                      )}
                      {user?.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{user.location}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Connect</h4>
                    <div className="flex flex-wrap gap-3">
                      {user?.socialLinks?.github && (
                        <a
                          href={user.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          title="GitHub"
                        >
                          <Github className="w-4 h-4" />
                          <span className="text-gray-700 dark:text-gray-300">GitHub</span>
                        </a>
                      )}
                      {user?.socialLinks?.linkedin && (
                        <a
                          href={user.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-700 dark:text-blue-300">LinkedIn</span>
                        </a>
                      )}
                      {user?.socialLinks?.twitter && (
                        <a
                          href={user.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-900/30 rounded-lg text-sm hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                          title="Twitter"
                        >
                          <Twitter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span className="text-sky-700 dark:text-sky-300">Twitter</span>
                        </a>
                      )}
                      {user?.socialLinks?.portfolio && (
                        <a
                          href={user.socialLinks.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                          title="Portfolio"
                        >
                          <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-700 dark:text-green-300">Portfolio</span>
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {user?.bio && <p className="mt-3 text-gray-700 dark:text-gray-300">{user.bio}</p>}
                  
                  {user?.createdAt && (
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills Section */}
              {user?.skills && user.skills.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm"
                      >
                        {typeof skill === 'string' ? skill : skill.name}
                        {typeof skill !== 'string' && skill.proficiency && (
                          <span className="ml-1 text-xs opacity-75">({skill.proficiency})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience Section */}
              {user?.experience && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Experience</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{user.experience}</p>
                  </div>
                </div>
              )}

              {/* Education Section */}
              {user?.education && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Education</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{user.education}</p>
                  </div>
                </div>
              )}

              {/* Projects Section */}
              {user?.projects && user.projects.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Projects</h4>
                  <div className="space-y-4">
                    {user.projects.map((project, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100">{project.title}</h5>
                          <div className="flex gap-2">
                            {project.liveUrl && (
                              <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                title="View Project"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {project.repoUrl && (
                              <a
                                href={project.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
                                title="View Code"
                              >
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">{project.description}</p>
                        {project.techStack && project.techStack.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {project.techStack.map((tech, techIndex) => (
                              <span
                                key={techIndex}
                                className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links removed as requested */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileViewModal;