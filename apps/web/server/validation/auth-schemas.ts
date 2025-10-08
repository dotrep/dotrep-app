/**
 * Validation schemas for authentication-related routes
 * 
 * These schemas ensure that all user input is properly validated
 * before processing, preventing SQL injection and other input-based attacks
 */
import { z } from 'zod';

// Login schema
export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dots, and hyphens'),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password is too long')
});

// Registration schema
export const registrationSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dots, and hyphens'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  email: z.string()
    .email('Invalid email format')
    .optional(),
  fsnName: z.string()
    .min(3, 'FSN name must be at least 3 characters')
    .max(30, 'FSN name cannot exceed 30 characters')
    .regex(/^[a-z0-9-]+$/, 'FSN name can only contain lowercase letters, numbers, and hyphens')
});

// FSN name check schema
export const fsnNameCheckSchema = z.object({
  name: z.string()
    .min(3, 'FSN name must be at least 3 characters')
    .max(30, 'FSN name cannot exceed 30 characters')
    .regex(/^[a-z0-9-]+$/, 'FSN name can only contain lowercase letters, numbers, and hyphens')
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  fsnName: z.string()
    .min(3, 'FSN name must be at least 3 characters')
    .max(30, 'FSN name cannot exceed 30 characters')
    .optional()
});

// Password reset (with token) schema
export const passwordResetSchema = z.object({
  token: z.string().min(10, 'Invalid token'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
});

// User ID parameter schema
export const userIdParamSchema = z.object({
  userId: z.string().refine((val) => {
    const parsed = parseInt(val);
    return !isNaN(parsed) && parsed > 0;
  }, {
    message: 'User ID must be a positive integer'
  })
});