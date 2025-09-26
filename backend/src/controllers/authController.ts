import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserDocument } from '../models/User';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { emailService } from '../services/emailService';
import { ApiResponse } from '../types';

interface AuthRequest extends Request {
  user?: UserDocument;
}

export class AuthController {
    constructor() {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.sendTokenResponse = this.sendTokenResponse.bind(this);
  }


  
  private generateToken(userId: string): string {
    // @ts-ignore
  return jwt.sign({ id: userId }, config.jwtSecret!, {
    expiresIn: config.jwtExpiresIn,
  });
}

  
  private sendTokenResponse(user: UserDocument, statusCode: number, res: Response) {
    const token = this.generateToken(user._id.toString());
    
    const options = {
      expires: new Date(Date.now() + config.jwtCookieExpire * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict' as const
    };

    
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      preferences: user.preferences,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res
      .status(statusCode)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        data: { user: userResponse }
      });
  }

  
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
        return;
      }

      // Create user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      logger.info(`New user registered: ${email}`);
      this.sendTokenResponse(user, 201, res);
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  }

 
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Check if email and password are provided
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Please provide email and password'
        });
        return;
      }

      // Find user and include password field
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      // Check password
      const isPasswordCorrect = await user.comparePassword(password);
      if (!isPasswordCorrect) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${email}`);
      this.sendTokenResponse(user, 200, res);
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  
  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      
      const response: ApiResponse<any> = {
        success: true,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          preferences: user.preferences,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Get me error:', error);
      next(error);
    }
  }

 
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { firstName, lastName, preferences } = req.body;

      const fieldsToUpdate: any = {};
      if (firstName) fieldsToUpdate.firstName = firstName;
      if (lastName) fieldsToUpdate.lastName = lastName;
      if (preferences) fieldsToUpdate.preferences = { ...user.preferences, ...preferences };

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        fieldsToUpdate,
        { new: true, runValidators: true }
      );

      const response: ApiResponse<any> = {
        success: true,
        data: {
          id: updatedUser!._id,
          email: updatedUser!.email,
          firstName: updatedUser!.firstName,
          lastName: updatedUser!.lastName,
          isEmailVerified: updatedUser!.isEmailVerified,
          preferences: updatedUser!.preferences
        },
        message: 'Profile updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }

  
  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.user!._id).select('+password');
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Please provide current password and new password'
        });
        return;
      }

      // Check current password
      const isCurrentPasswordCorrect = await user!.comparePassword(currentPassword);
      if (!isCurrentPasswordCorrect) {
        res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
        return;
      }

      // Update password
      user!.password = newPassword;
      await user!.save();

      logger.info(`Password changed for user: ${user!.email}`);
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      next(error);
    }
  }

  
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Please provide email address'
        });
        return;
      }

      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'No user found with that email address'
        });
        return;
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send email
      try {
        await emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);
        
        res.json({
          success: true,
          message: 'Password reset email sent'
        });
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(500).json({
          success: false,
          error: 'Email could not be sent'
        });
      }
    } catch (error) {
      logger.error('Forgot password error:', error);
      next(error);
    }
  }

  
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          error: 'Please provide new password'
        });
        return;
      }

      // Get hashed token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired token'
        });
        return;
      }

      // Set new password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset for user: ${user.email}`);
      this.sendTokenResponse(user, 200, res);
    } catch (error) {
      logger.error('Reset password error:', error);
      next(error);
    }
  }

  
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      // Get hashed token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token'
        });
        return;
      }

      // Verify email
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      logger.info(`Email verified for user: ${user.email}`);
      
      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      next(error);
    }
  }

  
  async resendVerification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;

      if (user.isEmailVerified) {
        res.status(400).json({
          success: false,
          error: 'Email is already verified'
        });
        return;
      }

      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
        
        res.json({
          success: true,
          message: 'Verification email sent'
        });
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        res.status(500).json({
          success: false,
          error: 'Email could not be sent'
        });
      }
    } catch (error) {
      logger.error('Resend verification error:', error);
      next(error);
    }
  }

  
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.json({
      success: true,
      message: 'User logged out successfully'
    });
  }
}

export const authController = new AuthController();