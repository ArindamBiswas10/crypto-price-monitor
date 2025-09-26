import { Request, Response, NextFunction } from 'express';
import { coinGeckoService } from '../services/coinGeckoService';
import { PriceHistory } from '../models/PriceHistory';
import { logger } from '../utils/logger';
import { ApiResponse, CryptoPriceData } from '../types';

export class PriceController {
  
  async getCurrentPrices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { coins } = req.query;
      const coinIds = coins ? (coins as string).split(',') : undefined;

      const prices = await coinGeckoService.getCurrentPrices(coinIds);

      const response: ApiResponse<CryptoPriceData[]> = {
        success: true,
        data: prices
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching current prices:', error);
      next(error);
    }
  }

  
  async getCoinPrice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { symbol } = req.params;
      
      if (!symbol) {
        res.status(400).json({
          success: false,
          error: 'Symbol parameter is required'
        });
        return;
      }

      const price = await coinGeckoService.getCoinPrice(symbol.toLowerCase());

      if (!price) {
        res.status(404).json({
          success: false,
          error: 'Cryptocurrency not found'
        });
        return;
      }

      const response: ApiResponse<CryptoPriceData> = {
        success: true,
        data: price
      };

      res.json(response);
    } catch (error) {
      logger.error(`Error fetching price for ${req.params.symbol}:`, error);
      next(error);
    }
  }

  
  async getPriceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { symbol } = req.params;
      const { days = 7, limit = 100 } = req.query;

      if (!symbol) {
        res.status(400).json({
          success: false,
          error: 'Symbol parameter is required'
        });
        return;
      }

      const historicalPrices = await coinGeckoService.getHistoricalPrices(
        symbol.toLowerCase(),
        parseInt(days as string)
      );

      // Also get stored price history from our database
      const storedHistory = await PriceHistory
        .find({ symbol: symbol.toUpperCase() })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string));

      const response: ApiResponse<any> = {
        success: true,
        data: {
          external: historicalPrices,
          stored: storedHistory
        }
      };

      res.json(response);
    } catch (error) {
      logger.error(`Error fetching price history for ${req.params.symbol}:`, error);
      next(error);
    }
  }

  async searchCoins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required'
        });
        return;
      }

      const searchResults = await coinGeckoService.searchCoins(q as string);

      const response: ApiResponse<any[]> = {
        success: true,
        data: searchResults
      };

      res.json(response);
    } catch (error) {
      logger.error(`Error searching coins with query "${req.query.q}":`, error);
      next(error);
    }
  }


  async getSupportedCoins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supportedCoins = await coinGeckoService.getSupportedCoins();

      const response: ApiResponse<any[]> = {
        success: true,
        data: supportedCoins
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching supported coins:', error);
      next(error);
    }
  }

 
  async getApiStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = coinGeckoService.getUsageStats();

      const response: ApiResponse<any> = {
        success: true,
        data: stats
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching API stats:', error);
      next(error);
    }
  }
}

export const priceController = new PriceController();
   