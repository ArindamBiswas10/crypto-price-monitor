import axios, { AxiosResponse } from 'axios';
import { User, CryptoPrice, Alert, AlertStats, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AxiosResponse<ApiResponse<{ user: User; token: string }>>> =>
    api.post('/auth/register', userData),

  login: (credentials: {
    email: string;
    password: string;
  }): Promise<AxiosResponse<ApiResponse<{ user: User; token: string }>>> =>
    api.post('/auth/login', credentials),

  logout: (): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.post('/auth/logout'),

  getMe: (): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get('/auth/me'),

  updateProfile: (userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put('/auth/update-profile', userData),

  changePassword: (passwords: {
    currentPassword: string;
    newPassword: string;
  }): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.put('/auth/change-password', passwords),

  forgotPassword: (email: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.put(`/auth/reset-password/${token}`, { password }),

  verifyEmail: (token: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.get(`/auth/verify-email/${token}`),

  resendVerification: (): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.post('/auth/resend-verification'),
};

// Price API
export const priceAPI = {
  getCurrentPrices: (coins?: string[]): Promise<AxiosResponse<ApiResponse<CryptoPrice[]>>> =>
    api.get('/prices', { params: { coins: coins?.join(',') } }),

  getCoinPrice: (symbol: string): Promise<AxiosResponse<ApiResponse<CryptoPrice>>> =>
    api.get(`/prices/${symbol}`),

  getPriceHistory: (symbol: string, days = 7): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/prices/${symbol}/history`, { params: { days } }),

  searchCoins: (query: string): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get('/prices/search', { params: { q: query } }),

  getSupportedCoins: (): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get('/prices/supported'),
};

// Alert API
export const alertAPI = {
  createAlert: (alertData: Omit<Alert, '_id' | 'createdAt' | 'updatedAt'>): Promise<AxiosResponse<ApiResponse<Alert>>> =>
    api.post('/alerts', alertData),

  getUserAlerts: (): Promise<AxiosResponse<ApiResponse<Alert[]>>> =>
    api.get('/alerts'),

  updateAlert: (id: string, alertData: Partial<Alert>): Promise<AxiosResponse<ApiResponse<Alert>>> =>
    api.put(`/alerts/${id}`, alertData),

  deleteAlert: (id: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.delete(`/alerts/${id}`),

  getAlertStats: (): Promise<AxiosResponse<ApiResponse<AlertStats>>> =>
    api.get('/alerts/stats'),
};

export default api;