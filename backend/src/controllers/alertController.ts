import { Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alertService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';
import { UserDocument } from '../models/User';

interface AuthRequest extends Request {
  user?: UserDocument;
}

export class AlertController {
  
  async createAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const alertData = {
        ...req.body,
        userId: req.user?._id?.toString() || 'default'
      };

      const alert = await alertService.createAlert(alertData);

      const response: ApiResponse<any> = {
        success: true,
        data: alert,
        message: 'Alert created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating alert:', error);
      next(error);
    }
  }

  
  async getUserAlerts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id?.toString() || 'default';
      const alerts = await alertService.getUserAlerts(userId);

      const response: ApiResponse<any[]> = {
        success: true,
        data: alerts
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching user alerts:', error);
      next(error);
    }
  }

  
  async updateAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?._id?.toString();

      const alert = await alertService.updateAlert(id, updateData, userId);

      if (!alert) {
        res.status(404).json({
          success: false,
          error: 'Alert not found or not authorized'
        });
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        data: alert,
        message: 'Alert updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Error updating alert:', error);
      next(error);
    }
  }

  
  async deleteAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id?.toString();

      const deleted = await alertService.deleteAlert(id, userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Alert not found or not authorized'
        });
        return;
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Alert deleted successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Error deleting alert:', error);
      next(error);
    }
  }

  
  async getAlertStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const stats = await alertService.getAlertStats(userId);

      const response: ApiResponse<any> = {
        success: true,
        data: stats
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching alert stats:', error);
      next(error);
    }
  }
}

export const alertController = new AlertController();