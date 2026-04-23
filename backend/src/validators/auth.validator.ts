import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  full_name: Joi.string().min(3).max(50).required(),
  farm_name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().optional()
});

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

export const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(3).max(50).optional(),
  farm_name: Joi.string().min(3).max(100).optional(),
  email: Joi.string().email().optional().allow(null, '')
});
