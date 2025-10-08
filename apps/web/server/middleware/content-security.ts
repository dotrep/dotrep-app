/**
 * Content Security Policy (CSP) and security headers middleware
 * 
 * Implements a strong CSP and other security headers to protect against:
 * - Cross-Site Scripting (XSS)
 * - Clickjacking
 * - MIME type sniffing vulnerabilities
 * - Cross-site leaks
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Applies security headers to all responses
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy (CSP)
  // Strict policy that prevents execution of inline scripts and restricts sources
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",  // Allow inline styles for now since we use them
    "img-src 'self' data: blob:",         // Allow data URIs for images
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  // Set CSP header
  res.setHeader('Content-Security-Policy', cspDirectives);
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent referrer leakage to external origins
  res.setHeader('Referrer-Policy', 'same-origin');
  
  // Prevent browsers from storing pages in cache with sensitive information
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  // Enforce HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
}