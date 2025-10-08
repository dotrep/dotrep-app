/**
 * Input validation middleware using Zod schemas
 * 
 * Protects against malicious input and ensures data integrity
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validates request body against a Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        // Extract validation errors and format them for response
        const errors = result.error.errors.map(error => ({
          path: error.path.join('.'),
          message: error.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      
      // Replace req.body with validated data
      req.body = result.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Validation error occurred'
      });
    }
  };
};

/**
 * Validates request params against a Zod schema
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors = result.error.errors.map(error => ({
          path: error.path.join('.'),
          message: error.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Invalid parameters',
          errors
        });
      }
      
      // Replace req.params with validated data
      req.params = result.data;
      next();
    } catch (error) {
      console.error('Parameter validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Parameter validation error occurred'
      });
    }
  };
};

/**
 * Validates request query against a Zod schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = result.error.errors.map(error => ({
          path: error.path.join('.'),
          message: error.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors
        });
      }
      
      // Replace req.query with validated data
      req.query = result.data;
      next();
    } catch (error) {
      console.error('Query validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Query validation error occurred'
      });
    }
  };
};