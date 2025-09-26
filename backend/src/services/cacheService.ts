import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { CacheData } from '../types';

class CacheService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: config.redisUri
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
      this.isConnected = true;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      this.isConnected = false;
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (!this.isConnected) return;

      const cacheData: CacheData = {
        data: value,
        timestamp: Date.now(),
        ttl: ttlSeconds ? ttlSeconds * 1000 : config.cacheDefaultTtl
      };

      const serializedData = JSON.stringify(cacheData);
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedData);
      } else {
        await this.client.set(key, serializedData);
      }

      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;

      const cachedData = await this.client.get(key);
      if (!cachedData) return null;

      const parsed: CacheData = JSON.parse(cachedData);
      
      // Check if cache has expired
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        await this.delete(key);
        return null;
      }

      logger.debug(`Cache hit: ${key}`);
      return parsed.data as T;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.flushAll();
      logger.info('Cache flushed');
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  async setMultiple(data: Record<string, any>, ttlSeconds?: number): Promise<void> {
    const pipeline = this.client.multi();
    
    Object.entries(data).forEach(([key, value]) => {
      const cacheData: CacheData = {
        data: value,
        timestamp: Date.now(),
        ttl: ttlSeconds ? ttlSeconds * 1000 : config.cacheDefaultTtl
      };

      const serializedData = JSON.stringify(cacheData);
      
      if (ttlSeconds) {
        pipeline.setEx(key, ttlSeconds, serializedData);
      } else {
        pipeline.set(key, serializedData);
      }
    });

    await pipeline.exec();
    logger.debug(`Cache set multiple: ${Object.keys(data).length} keys`);
  }

  isConnected_(): boolean {
    return this.isConnected;
  }
}

export const cacheService = new CacheService();