import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validateAlert = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    symbol: Joi.string().required().uppercase(),
    condition: Joi.string().valid('above', 'below', 'percent_increase', 'percent_decrease').required(),
    targetPrice: Joi.number().positive().when('condition', {
      is: Joi.string().valid('above', 'below'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    percentageChange: Joi.number().positive().max(1000).when('condition', {
      is: Joi.string().valid('percent_increase', 'percent_decrease'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    isActive: Joi.boolean().default(true)
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  next();
};

export const validateUpdateAlert = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    condition: Joi.string().valid('above', 'below', 'percent_increase', 'percent_decrease').optional(),
    targetPrice: Joi.number().positive().optional(),
    percentageChange: Joi.number().positive().max(1000).optional(),
    isActive: Joi.boolean().optional()
  }).min(1);

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  next();
};

export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .message('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
      .required(),
    firstName: Joi.string().required().max(50).trim(),
    lastName: Joi.string().required().max(50).trim()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

export const validatePasswordChange = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .message('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
      .required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

export const validatePasswordReset = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .message('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
      .required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};