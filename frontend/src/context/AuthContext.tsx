import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

interface User {
  _id: string; // MongoDB ID
  id?: string; // Optional legacy ID
  email: string;
  name: string;
  avatar?: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, avatar?: string, projects?: any[]) => Promise<void>;
  logout: () => void;
  loginWithGithub: () => void;
  loginWithGoogle: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          const userData = (response.data as { user: User }).user;
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data as AuthResponse;
      localStorage.setItem('token', token);
      setUser(user);
      socketService.connect(token);
      navigate('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to login. Please check your credentials and try again.');
      }
    }
  };

  const register = async (email: string, password: string, name: string, avatar?: string, projects?: any[]) => {
    try {
      console.log('Registering user:', { email, name }); // Don't log password
      const userData = {
        email,
        password,
        name,
        avatar,
        projects
      };
      
      const response = await authAPI.register(userData);
      console.log('Registration response:', response.data);
      
      // Type check the response data
      const { token, user } = response.data as AuthResponse;
      localStorage.setItem('token', token);
      setUser(user);
      navigate('/');
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to register. Please try again later.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    socketService.disconnect();
    navigate('/login');
  };

  const apiUrl = import.meta.env.VITE_API_URL as string || 'http://localhost:5000/api';

  const loginWithGithub = () => {
    window.location.href = `${apiUrl}/auth/github`;
  };

  const loginWithGoogle = () => {
    window.location.href = `${apiUrl}/auth/google`;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    loginWithGithub,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 