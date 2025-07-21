import axios from 'axios';

// Define ImportMeta with env property
declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('API URL:', API_URL); // Log the API URL for debugging

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout
  timeout: 10000,
  // Add withCredentials for cookies if needed
  withCredentials: true
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      
      // Customize error message based on status code
      if (error.response.status === 401) {
        error.message = 'Unauthorized: Please log in again';
      } else if (error.response.status === 403) {
        error.message = 'Forbidden: You do not have permission to access this resource';
      } else if (error.response.data && error.response.data.message) {
        error.message = error.response.data.message;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      error.message = 'No response from server. Please check your connection and try again.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
const authAPI = {
  login: async (email: string, password: string) => {
    return api.post('/auth/login', { email, password });
  },
  register: async (userData: any) => {
    return api.post('/auth/register', userData);
  },
  getCurrentUser: async () => {
    return api.get('/auth/me');
  }
};

// Users API
const usersAPI = {
  getUsers: async (filters: any = {}) => {
    return api.get('/users', { params: filters });
  },
  getUserById: async (id: string) => {
    if (!id) {
      console.error('getUserById called with empty ID');
      return Promise.reject(new Error('User ID is required'));
    }
    console.log(`Getting user profile for ID: ${id}`);
    return api.get(`/users/${id}`);
  },
  updateProfile: async (userData: any) => {
    return api.put('/users/profile', userData);
  },
  getPotentialMatches: async () => {
    return api.get('/users/matches/potential');
  }
};

// Matches API
const matchesAPI = {
  getMatches: async () => {
    return api.get('/matches');
  },
  createMatch: async (userId: string) => {
    return api.post('/matches', { userId });
  },
  rejectUser: async (userId: string) => {
    return api.post('/matches/reject', { userId });
  }
};

// Messages API
const messagesAPI = {
  getMessages: async (matchId: string) => {
    return api.get(`/messages/${matchId}`);
  },
  sendMessage: async (matchId: string, content: string, attachments: any[] = []) => {
    return api.post(`/messages/${matchId}`, { content, attachments });
  }
};

// Projects API
const projectsAPI = {
  getUserProjects: async (userId: string) => {
    return api.get(`/projects/user/${userId}`);
  },
  addProject: async (projectData: any) => {
    return api.post('/projects', projectData);
  },
  updateProject: async (id: string, projectData: any) => {
    return api.put(`/projects/${id}`, projectData);
  },
  deleteProject: async (id: string) => {
    return api.delete(`/projects/${id}`);
  }
};

// Settings API
const settingsAPI = {
  getSettings: async () => {
    return api.get('/settings');
  },
  updateSettings: async (settings: any) => {
    return api.put('/settings', settings);
  },
  deleteAccount: async () => {
    return api.delete('/settings/account');
  }
};

export { authAPI, usersAPI, matchesAPI, messagesAPI, projectsAPI, settingsAPI };
export default api;