import { Router } from 'express';
import { authController } from '../controllers/authController';
import { protect, requireEmailVerification } from '../middleware/auth';
import { validateRegistration, validateLogin, validatePasswordChange, validatePasswordReset } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', validatePasswordReset, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/update-profile', protect, authController.updateProfile);
router.put('/change-password', protect, validatePasswordChange, authController.changePassword);
router.post('/resend-verification', protect, authController.resendVerification);
router.post('/logout', protect, authController.logout);

export default router;