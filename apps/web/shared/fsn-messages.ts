import { z } from 'zod';

// Schema for sending messages/files
export const sendFsnMessageSchema = z.object({
  from: z.string().min(1).max(50),
  to: z.string().min(1).max(50),
  message: z.string().max(2000).optional(),
  fileData: z.string().optional(),
  fileName: z.string().optional(),
});

export type SendFsnMessage = z.infer<typeof sendFsnMessageSchema>;

// Schema for validating file uploads
export const fileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string(),
  fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
});

// Schema for sanitizing messages
export const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  allowedAttributes: {
    'a': ['href', 'target']
  }
};