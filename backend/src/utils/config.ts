import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-monitor',
  redisUri: process.env.REDIS_URI || 'redis://localhost:6379',
  
  // API Keys
  coinGeckoApiKey: process.env.COINGECKO_API_KEY || '',
  
  // Intervals (in milliseconds)
  priceUpdateInterval: parseInt(process.env.PRICE_UPDATE_INTERVAL || '10000'), // 10 seconds
  cacheDefaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '60000'), // 1 minute
  
  // Rate limiting
  apiRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per windowMs
  },
  
  // Supported cryptocurrencies
  supportedCoins: [
    'bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana',
    'polkadot', 'dogecoin', 'avalanche-2', 'polygon', 'chainlink'
  ],
  
  // CoinGecko API
  coinGeckoApi: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    rateLimit: 30, // requests per minute for free tier
    timeout: 10000 // 10 seconds
  },


  jwtSecret: (process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production') as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30',
  jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE || '30'), // days
  
  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.sendrid.net',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
    fromName: process.env.EMAIL_FROM_NAME || 'Crypto Monitor',
    fromEmail: process.env.EMAIL_FROM|| 'arindambiswas2999@gmail.com'
  },
  
  // Client URL for email links
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
};
