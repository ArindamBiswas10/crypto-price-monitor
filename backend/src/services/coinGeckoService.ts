import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { CryptoPriceData } from '../types';
import { cacheService } from './cacheService';

class CoinGeckoService {
  private api: AxiosInstance;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private readonly REQUEST_INTERVAL = 60000 / config.coinGeckoApi.rateLimit; // ms between requests

  constructor() {
    this.api = axios.create({
      baseURL: config.coinGeckoApi.baseUrl,
      timeout: config.coinGeckoApi.timeout,
      headers: {
        'Accept': 'application/json',
        ...(config.coinGeckoApiKey && {
          'x-cg-demo-api-key': config.coinGeckoApiKey
        })
      }
    });

    this.api.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.REQUEST_INTERVAL) {
        const delay = this.REQUEST_INTERVAL - timeSinceLastRequest;
        logger.debug(`Rate limiting: waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      this.lastRequestTime = Date.now();
      this.requestCount++;
      
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        logger.error('CoinGecko API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 60;
          logger.warn(`Rate limited. Retrying after ${retryAfter} seconds`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.api.request(error.config);
        }

        return Promise.reject(error);
      }
    );
  }

  
  async getCurrentPrices(coinIds?: string[]): Promise<CryptoPriceData[]> {
    try {
      const coins = coinIds || config.supportedCoins;
      const cacheKey = `prices:${coins.join(',')}`;

      // Try to get from cache first
      const cachedData = await cacheService.get<CryptoPriceData[]>(cacheKey);
      if (cachedData) {
        logger.debug('Returning cached price data');
        return cachedData;
      }

      const response: AxiosResponse<CryptoPriceData[]> = await this.api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: coins.join(','),
          order: 'market_cap_desc',
          per_page: coins.length,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        }
      });

      const priceData = response.data;

      // Cache the data for 30 seconds
      await cacheService.set(cacheKey, priceData, 30);

      logger.info(`Fetched prices for ${priceData.length} cryptocurrencies`);
      return priceData;

    } catch (error) {
      logger.error('Failed to fetch current prices:', error);
      
      // Try to return cached data even if expired as fallback
      const cacheKey = `prices:${(coinIds || config.supportedCoins).join(',')}`;
      const fallbackData = await cacheService.get<CryptoPriceData[]>(cacheKey);
      
      if (fallbackData) {
        logger.warn('Returning stale cached data due to API error');
        return fallbackData;
      }

      throw new Error('Failed to fetch cryptocurrency prices');
    }
  }

  
  async getCoinPrice(coinId: string): Promise<CryptoPriceData | null> {
    try {
      const cacheKey = `price:${coinId}`;

      // Try cache first
      const cachedData = await cacheService.get<CryptoPriceData>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response: AxiosResponse<CryptoPriceData[]> = await this.api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: coinId,
          order: 'market_cap_desc',
          per_page: 1,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        }
      });

      const coinData = response.data[0];
      if (!coinData) return null;

      // Cache for 30 seconds
      await cacheService.set(cacheKey, coinData, 30);

      return coinData;

    } catch (error) {
      logger.error(`Failed to fetch price for ${coinId}:`, error);
      return null;
    }
  }

 
  async getHistoricalPrices(coinId: string, days: number = 7): Promise<number[][]> {
    try {
      const cacheKey = `history:${coinId}:${days}`;

      // Try cache first (cache for longer since historical data doesn't change)
      const cachedData = await cacheService.get<number[][]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await this.api.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days,
          interval: days <= 1 ? 'hourly' : 'daily'
        }
      });

      const prices = response.data.prices;

      // Cache historical data for 5 minutes
      await cacheService.set(cacheKey, prices, 300);

      return prices;

    } catch (error) {
      logger.error(`Failed to fetch historical prices for ${coinId}:`, error);
      return [];
    }
  }

  
  async searchCoins(query: string): Promise<any[]> {
    try {
      const cacheKey = `search:${query.toLowerCase()}`;

      // Try cache first
      const cachedData = await cacheService.get<any[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await this.api.get('/search', {
        params: { query }
      });

      const coins = response.data.coins.slice(0, 10); // Limit to top 10 results

      // Cache search results for 10 minutes
      await cacheService.set(cacheKey, coins, 600);

      return coins;

    } catch (error) {
      logger.error(`Failed to search coins for query "${query}":`, error);
      return [];
    }
  }

  
  async getSupportedCoins(): Promise<any[]> {
    try {
      const cacheKey = 'supported-coins';

      // Try cache first
      const cachedData = await cacheService.get<any[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await this.api.get('/coins/list');
      const coins = response.data;

      // Cache for 1 hour since this data rarely changes
      await cacheService.set(cacheKey, coins, 3600);

      return coins;

    } catch (error) {
      logger.error('Failed to fetch supported coins:', error);
      return [];
    }
  }

  
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      rateLimit: config.coinGeckoApi.rateLimit
    };
  }
}

export const coinGeckoService = new CoinGeckoService();