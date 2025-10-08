/**
 * Rate limiting middleware for FSN platform security
 * 
 * Implements protection against brute force attacks on authentication
 * and other sensitive endpoints
 */
import rateLimit from 'express-rate-limit';

// Standard rate limiter for general API endpoints
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Strict rate limiter for authentication endpoints (login, password reset, etc.)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
});

// Rate limiter for email sending (prevents spamming users with emails)
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 email requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many email requests from this IP, please try again after an hour',
});

// Rate limiter for FSN name availability checking
export const fsnNameLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 name availability checks per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many FSN name availability checks from this IP, please try again after 10 minutes',
});