import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  skills: Array<{
    name: string;
    proficiency: string;
  }>;
  location?: string;
  jobRole?: string;
  interests?: string[];
}

const Search: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const skillsList = ['React', 'TypeScript', 'Node.js', 'Python', 'Java', 'JavaScript', 'Vue', 'Angular'];
  const interestList = ['Web Development', 'Machine Learning', 'DevOps', 'Mobile Development'];

  const formatAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return '/default-avatar.png';
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) return avatarPath;
    const path = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
    return `${API_URL.replace('/api', '')}/${path}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: '1',
        limit: '12'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedSkills.length > 0) selectedSkills.forEach(skill => params.append('skills', skill));
      if (selectedLocation) params.append('location', selectedLocation);

      const response = await axios.get(`${API_URL}/users/search?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = response.data as any;
      setUsers(data.users || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load users:', error);
      setIsLoading(false);
      
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        window.alert('Session expired. Please login again.');
        window.location.href = '/login';
      } else if (axiosError.response?.status === 404) {
        setUsers([]);
      } else {
        window.alert('Failed to search users. Please try again later.');
      }
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [searchTerm, selectedSkills, selectedLocation]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSkills([]);
    setSelectedLocation('');
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Discover Developers</h1>
        <p className="text-gray-600 dark:text-gray-400">Find your perfect dev match based on skills and location</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Search</label>
            <input
              type="text"
              placeholder="Search by name, bio, or job role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Location</label>
            <input
              type="text"
              placeholder="City, Country..."
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Skills</label>
          <div className="flex flex-wrap gap-2">
            {skillsList.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedSkills.includes(skill)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No developers found</h3>
            <p className="text-gray-500 dark:text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          users.map(user => (
            <div key={user._id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                {user.avatar ? (
                  <img
                    src={formatAvatarUrl(user.avatar)}
                    alt={user.name}
                    className="w-16 h-16 rounded-full mr-4 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {getInitials(user.name)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.jobRole || 'Developer'}</p>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm line-clamp-2">
                {user.bio || 'No bio available'}
              </p>
              
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {user.skills.slice(0, 3).map((skill, index) => (
                    <span key={index} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded text-xs">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <Link
                to={`/profile/${user._id}`}
                className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors"
              >
                View Profile
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Search;