import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import mongoose from 'mongoose';
import * as cron from 'node-cron';

import { logger } from './utils/logger';
import { config } from './utils/config';
import { cacheService } from './services/cacheService';
import { coinGeckoService } from './services/coinGeckoService';
import { alertService } from './services/alertService';
import { socketService } from './services/socketService';
import { PriceHistory } from './models/PriceHistory';

import priceRoutes from './routes/priceRoutes';
import alertRoutes from './routes/alertRoutes';
import authRoutes from './routes/authRoutes';

import { errorHandler } from './middleware/errorHandler';

class App {
  public app: Application;
  public server: any;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.apiRateLimit.windowMs,
      max: config.apiRateLimit.max,
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
      }
    });
    this.app.use('/api', limiter);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv
      });
    });

    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/prices', priceRoutes);
    this.app.use('/api/alerts', alertRoutes);

    this.app.get('/api/socket/stats', (req: Request, res: Response) => {
      const stats = socketService.getStats();
      res.json({
        success: true,
        data: stats
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
    res.status(404).json({
    success: false,
    error: 'Route not found'
   });
 });

  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async connectToDatabase(): Promise<void> {
    try {
      await mongoose.connect(config.mongoUri);
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      // Connect to Redis
      await cacheService.connect();
      
      // Initialize Socket.IO
      socketService.initialize(this.server);
      
      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  private initializeCronJobs(): void {
    // Update prices every 10 seconds
    cron.schedule('*/10 * * * * *', async () => {
      try {
        const prices = await coinGeckoService.getCurrentPrices();
        
        // Broadcast price updates via Socket.IO
        socketService.broadcastPriceUpdate(prices);
        
        // Check alerts
        await alertService.checkAlerts(prices);
        
        // Store price history (every minute to avoid too much data)
        if (Math.floor(Date.now() / 1000) % 60 === 0) {
          await this.storePriceHistory(prices);
        }
        
      } catch (error) {
        logger.error('Error in price update cron job:', error);
      }
    });

    // Cleanup old price history data (daily at midnight)
    cron.schedule('0 0 * * *', async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const result = await PriceHistory.deleteMany({
          timestamp: { $lt: thirtyDaysAgo }
        });
        
        logger.info(`Cleaned up ${result.deletedCount} old price history records`);
      } catch (error) {
        logger.error('Error in cleanup cron job:', error);
      }
    });

    logger.info('Cron jobs initialized');
  }

  private async storePriceHistory(prices: any[]): Promise<void> {
    try {
      const historyRecords = prices.map(price => ({
        symbol: price.symbol.toUpperCase(),
        price: price.current_price,
        timestamp: new Date(),
        volume_24h: price.total_volume,
        market_cap: price.market_cap
      }));

      await PriceHistory.insertMany(historyRecords);
      logger.debug(`Stored price history for ${historyRecords.length} cryptocurrencies`);
    } catch (error) {
      logger.error('Error storing price history:', error);
    }
  }

  public async start(): Promise<void> {
    try {
    
      await this.connectToDatabase();
      
      await this.initializeServices();
      
      this.initializeCronJobs();
      
      this.server.listen(config.port, () => {
        logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      });

      this.setupGracefulShutdown();
      
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Close server
        await new Promise<void>((resolve) => {
          this.server.close(() => {
            logger.info('HTTP server closed');
            resolve();
          });
        });

        // Disconnect from services
        await cacheService.disconnect();
        await mongoose.connection.close();
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}

// Start the application
const app = new App();
app.start().catch(error => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

export default app;