import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.getMe();
        setUser(response.data.data!);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, token } = response.data.data!;
      
      localStorage.setItem('token', token);
      setUser(userData);
      toast.success('Welcome back!');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<boolean> => {
    try {
      const response = await authAPI.register(userData);
      const { user: newUser, token } = response.data.data!;
      
      localStorage.setItem('token', token);
      setUser(newUser);
      toast.success('Account created successfully! Please check your email for verification.');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      
    }
    
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const response = await authAPI.updateProfile(userData);
      setUser(response.data.data!);
      toast.success('Profile updated successfully');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Update failed');
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }