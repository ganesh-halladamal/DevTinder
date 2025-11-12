import axios from 'axios';

// Define ImportMeta with env property
declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('API URL:', API_URL); // Log the API URL for debugging

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout
  timeout: 10000,
  // Don't use withCredentials since we're using token-based auth
  withCredentials: false
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      // Validate token format before sending
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3 || token.includes('mock-token')) {
        console.error('Invalid token format detected, removing from localStorage');
        localStorage.removeItem('token');
        return config;
      }
      
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding auth token to request:', { 
        url: config.url,
        headers: config.headers 
      });
    } else {
      console.log('No token found in localStorage');
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
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // Clear invalid token from localStorage
        localStorage.removeItem('token');
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
    return api.get(`/users/profile/${id}`);
  },
  updateProfile: async (userData: any) => {
    return api.put('/users/profile', userData);
  },
  getPotentialMatches: async () => {
    return api.get('/users/matches/potential');
  },
  likeUser: async (userId: string) => {
    return api.post(`/users/matches/like/${userId}`);
  },
  dislikeUser: async (userId: string) => {
    return api.post(`/users/matches/dislike/${userId}`);
  }
};

// Matches API
const matchesAPI = {
  getMatches: async () => {
    return api.get('/matches/my-matches');
  },
  getMatchDetails: async (matchId: string) => {
    return api.get(`/matches/${matchId}`);
  },
  getPotentialMatches: async () => {
    return api.get('/matches/potential');
  },
  likeUser: async (userId: string) => {
    return api.post(`/matches/like/${userId}`);
  },
  dislikeUser: async (userId: string) => {
    return api.post(`/matches/dislike/${userId}`);
  },
  rejectUser: async (userId: string) => {
    return api.post('/matches/reject', { userId });
  },
  toggleBookmark: async (matchId: string) => {
    return api.put(`/matches/${matchId}/bookmark`);
  },
  updateMatchStatus: async (matchId: string, status: string) => {
    return api.put(`/matches/${matchId}/status`, { status });
  }
};

// Messages API
const messagesAPI = {
  getConversations: async () => {
    return api.get('/messages/conversations');
  },
  getOrCreateConversation: async (userId: string) => {
    return api.get(`/messages/conversation/${userId}`);
  },
  getMessages: async (conversationId: string) => {
    return api.get(`/messages/${conversationId}`);
  },
  getMessagePreview: async (conversationId: string, limit = 3) => {
    return api.get(`/messages/${conversationId}/preview`, { params: { limit } });
  },
  sendMessage: async (conversationId: string, text: string, attachments: any[] = []) => {
    return api.post(`/messages/${conversationId}`, { text, attachments });
  },
  markAsRead: async (conversationId: string) => {
    return api.post(`/messages/${conversationId}/read`);
  },
  getUnreadCounts: async () => {
    return api.get('/messages/unread/counts');
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

// Notifications API
const notificationsAPI = {
  getNotifications: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    return api.get('/notifications', { params });
  },
  getUnreadCount: async () => {
    return api.get('/notifications/unread-count');
  },
  markAsRead: async (notificationId: string) => {
    return api.put(`/notifications/${notificationId}/read`);
  },
  markAllAsRead: async () => {
    return api.put('/notifications/read-all');
  },
  deleteNotification: async (notificationId: string) => {
    return api.delete(`/notifications/${notificationId}`);
  }
};

export { authAPI, usersAPI, matchesAPI, messagesAPI, projectsAPI, settingsAPI, notificationsAPI };
export default api;