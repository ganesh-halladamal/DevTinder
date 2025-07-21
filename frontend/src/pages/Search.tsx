import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../services/api';

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
}

const Search: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const skillsList = ['React', 'TypeScript', 'Node.js', 'Python', 'Java', 'JavaScript', 'Vue', 'Angular', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'];
  const experienceLevels = ['all', 'beginner', 'intermediate', 'senior'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersAPI.getUsers();
      const allUsers = (response as any).data.users || [];
      
      setUsers(allUsers);
      setFilteredUsers(allUsers);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load users:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSkills.length > 0) {
      filtered = filtered.filter(user =>
        selectedSkills.some(skill => user.skills.some(s => s.name === skill))
      );
    }

    // Note: Experience filter needs to be implemented based on skills proficiency
    // For now, this filter is disabled as the User interface doesn't include experience
    // if (experienceFilter !== 'all') {
    //   filtered = filtered.filter(user => user.experience === experienceFilter);
    // }

    setFilteredUsers(filtered);
  }, [searchTerm, selectedSkills, experienceFilter, users]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
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
      <h1 className="text-3xl font-bold mb-8">Discover Developers</h1>
      
      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Skills</label>
          <div className="flex flex-wrap gap-2">
            {skillsList.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedSkills.includes(skill)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Experience Level</label>
          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {experienceLevels.map(level => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No users found matching your criteria</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user._id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <img
                  src={user.avatar || 'https://via.placeholder.com/64'}
                  alt={user.name}
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div>
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.location || 'Location not specified'}</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{user.bio || 'No bio available'}</p>
              
              <div className="mb-3">
                <span className="text-sm text-gray-600">Skills: </span>
                <span className="text-sm font-medium">
                  {user.skills.length > 0 ? user.skills[0].proficiency : 'Not specified'}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {user.skills.slice(0, 3).map((skill, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {skill.name}
                  </span>
                ))}
                {user.skills.length > 3 && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    +{user.skills.length - 3} more
                  </span>
                )}
              </div>
              
              <Link
                to={`/profile/${user._id}`}
                className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
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