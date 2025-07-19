import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
    return api.get(`/users/${id}`);
  },
  updateProfile: async (userData: any) => {
    return api.put('/users/profile', userData);
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

export { authAPI, usersAPI, matchesAPI, messagesAPI, projectsAPI };
export default api; 