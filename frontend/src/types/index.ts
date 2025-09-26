export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  preferences: {
    defaultCurrency: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  createdAt: string;
  lastLogin?: string;
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

export interface Alert {
  _id: string;
  symbol: string;
  condition: 'above' | 'below' | 'percent_increase' | 'percent_decrease';
  targetPrice?: number;
  percentageChange?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  alertsBySymbol: Array<{ symbol: string; count: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}