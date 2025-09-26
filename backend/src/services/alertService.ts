import { Alert, AlertDocument } from '../models/Alert';
import { User } from '../models/User';
import { PriceHistory } from '../models/PriceHistory';
import { logger } from '../utils/logger';
import { socketService } from './socketService';
import { emailService } from './emailService';
import { CryptoPriceData } from '../types';

class AlertService {
  
  async createAlert(alertData: Partial<AlertDocument>): Promise<AlertDocument> {
    try {
      const alert = new Alert(alertData);
      await alert.save();
      
      logger.info(`Alert created: ${alert.symbol} ${alert.condition} for user ${alert.userId}`);
      return alert;
    } catch (error) {
      logger.error('Failed to create alert:', error);
      throw new Error('Failed to create alert');
    }
  }

  
  async getUserAlerts(userId: string = 'default'): Promise<AlertDocument[]> {
    try {
      const alerts = await Alert.find({ userId, isActive: true })
        .sort({ createdAt: -1 });
      
      return alerts;
    } catch (error) {
      logger.error('Failed to fetch user alerts:', error);
      throw new Error('Failed to fetch alerts');
    }
  }

  
  async updateAlert(alertId: string, updateData: Partial<AlertDocument>, userId?: string): Promise<AlertDocument | null> {
    try {
      const query: any = { _id: alertId };
      if (userId) {
        query.userId = userId;
      }

      const alert = await Alert.findOneAndUpdate(
        query,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (alert) {
        logger.info(`Alert updated: ${alertId} by user ${userId}`);
      }
      
      return alert;
    } catch (error) {
      logger.error('Failed to update alert:', error);
      throw new Error('Failed to update alert');
    }
  }

  
  async deleteAlert(alertId: string, userId?: string): Promise<boolean> {
    try {
      const query: any = { _id: alertId };
      if (userId) {
        query.userId = userId;
      }

      const result = await Alert.findOneAndDelete(query);
      
      if (result) {
        logger.info(`Alert deleted: ${alertId} by user ${userId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to delete alert:', error);
      throw new Error('Failed to delete alert');
    }
  }

  
  async checkAlerts(priceData: CryptoPriceData[]): Promise<void> {
    try {
      const alerts = await Alert.find({ isActive: true }).populate('userId');
      
      for (const alert of alerts) {
        const currentPrice = priceData.find(data => 
          data.symbol.toUpperCase() === alert.symbol.toUpperCase()
        );

        if (currentPrice) {
          const triggered = await this.evaluateAlert(alert, currentPrice);
          if (triggered) {
            await this.triggerAlert(alert, currentPrice);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to check alerts:', error);
    }
  }

  
  private async evaluateAlert(alert: AlertDocument, priceData: CryptoPriceData): Promise<boolean> {
    const currentPrice = priceData.current_price;

    switch (alert.condition) {
      case 'above':
        return alert.targetPrice !== undefined && currentPrice > alert.targetPrice;

      case 'below':
        return alert.targetPrice !== undefined && currentPrice < alert.targetPrice;

      case 'percent_increase':
        return this.checkPercentageChange(alert, priceData, 'increase');

      case 'percent_decrease':
        return this.checkPercentageChange(alert, priceData, 'decrease');

      default:
        return false;
    }
  }

  
  private checkPercentageChange(
    alert: AlertDocument, 
    priceData: CryptoPriceData, 
    direction: 'increase' | 'decrease'
  ): boolean {
    if (alert.percentageChange === undefined) return false;

    const change24h = priceData.price_change_percentage_24h;

    if (direction === 'increase') {
      return change24h >= alert.percentageChange;
    } else {
      return change24h <= -alert.percentageChange;
    }
  }

  
  private async triggerAlert(alert: AlertDocument, priceData: CryptoPriceData): Promise<void> {
    try {
      // Log the triggered alert
      logger.info(`Alert triggered: ${alert.symbol} ${alert.condition}`, {
        alertId: alert._id,
        userId: alert.userId,
        currentPrice: priceData.current_price,
        targetPrice: alert.targetPrice,
        percentageChange: priceData.price_change_percentage_24h
      });

      // Get user information for email notification
      const user = await User.findById(alert.userId);

      // Send socket notification
      socketService.sendAlert({
        ...alert.toObject(),
        currentPrice: priceData.current_price,
        priceChange24h: priceData.price_change_percentage_24h
      });

      // Send email notification if user exists and has email notifications enabled
      if (user && user.preferences.emailNotifications) {
        await emailService.sendAlertEmail(
          user.email,
          user.firstName,
          alert,
          priceData.current_price
        );
      }

      // Deactivate the alert to prevent spam (optional)
      await this.updateAlert(alert._id.toString(), { isActive: false });

    } catch (error) {
      logger.error('Failed to trigger alert:', error);
    }
  }

  
  async getAlertStats(userId?: string): Promise<any> {
    try {
      const query = userId ? { userId } : {};

      const totalAlerts = await Alert.countDocuments(query);
      const activeAlerts = await Alert.countDocuments({ ...query, isActive: true });
      const alertsBySymbol = await Alert.aggregate([
        { $match: { ...query, isActive: true } },
        { $group: { _id: '$symbol', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return {
        totalAlerts,
        activeAlerts,
        alertsBySymbol: alertsBySymbol.map(item => ({
          symbol: item._id,
          count: item.count
        }))
      };
    } catch (error) {
      logger.error('Failed to get alert stats:', error);
      return {
        totalAlerts: 0,
        activeAlerts: 0,
        alertsBySymbol: []
      };
    }
  }
}

export const alertService = new AlertService();