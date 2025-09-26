export interface CryptoPriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface Alert {
  _id?: string;
  userId?: string;
  symbol: string;
  condition: 'above' | 'below' | 'percent_increase' | 'percent_decrease';
  targetPrice?: number;
  percentageChange?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PriceHistory {
  _id?: string;
  symbol: string;
  price: number;
  timestamp: Date;
  volume_24h?: number;
  market_cap?: number;
}

export interface CacheData {
  data: any;
  timestamp: number;
  ttl: number;
}

export interface SocketEvents {
  'price-update': (data: CryptoPriceData[]) => void;
  'alert-triggered': (alert: Alert & { currentPrice: number }) => void;
  'connection-status': (status: { connected: boolean; timestamp: number }) => void;
  'subscribe-to-symbol': (symbol: string) => void;
  'unsubscribe-from-symbol': (symbol: string) => void;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}