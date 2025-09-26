import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, UserDocument } from '../models/User';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: UserDocument;
}

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}


export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
      return;
    }

    try {
      
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

      
      const user = await User.findById(decoded.id);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'No user found with this token'
        });
        return;
      }

      req.user = user;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};


export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;


    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      } catch (jwtError) {
    
        logger.debug('Invalid token in optional auth:', jwtError);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};


export const requireEmailVerification = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.isEmailVerified) {
    res.status(403).json({
      success: false,
      error: 'Please verify your email to access this resource'
    });
    return;
  }
  next();
};