import { z } from 'zod';
import {
  createPostSchema,
  createCommentSchema,
  createGroupSchema,
  uploadImageSchema,
  searchSchema,
} from './schemas';

// =====================================================
// CUSTOM VALIDATORS
// =====================================================

/**
 * Validates post content for profanity and spam
 */
export const validatePostContent = (content: string): { valid: boolean; message?: string } => {
  // Check for excessive whitespace
  if (content.trim().length === 0) {
    return { valid: false, message: 'Post cannot be empty' };
  }

  // Check for all caps (spam indicator)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.8 && content.length > 10) {
    return { valid: false, message: 'Too much uppercase text (looks like spam)' };
  }

  // Check for excessive links (spam indicator)
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    return { valid: false, message: 'Too many links in post' };
  }

  // Check for repeated characters (spam indicator)
  if (/([a-z])\1{9,}/i.test(content)) {
    return { valid: false, message: 'Invalid text pattern' };
  }

  return { valid: true };
};

/**
 * Validates group name for uniqueness (placeholder)
 */
export const validateGroupName = async (name: string, excludeId?: string): Promise<{ valid: boolean; message?: string }> => {
  // In production, check against database
  if (name.length < 3) {
    return { valid: false, message: 'Group name too short' };
  }

  // TODO: Add database check for duplicate names
  return { valid: true };
};

/**
 * Validates email format and domain
 */
export const validateEmail = (email: string): { valid: boolean; message?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  // Check for disposable email domains (optional)
  const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
  const domain = email.split('@')[1];
  if (disposableDomains.includes(domain)) {
    return { valid: false, message: 'Please use a valid email address' };
  }

  return { valid: true };
};

/**
 * Validates image dimensions (if needed)
 */
export const validateImageDimensions = async (
  file: File,
  maxWidth: number = 4000,
  maxHeight: number = 4000
): Promise<{ valid: boolean; message?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > maxWidth || img.height > maxHeight) {
          resolve({
            valid: false,
            message: `Image dimensions must be less than ${maxWidth}x${maxHeight}`,
          });
        } else {
          resolve({ valid: true });
        }
      };
      img.onerror = () => {
        resolve({ valid: false, message: 'Invalid image file' });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// =====================================================
// VALIDATION HELPERS
// =====================================================

/**
 * Safe validation wrapper that returns errors
 */
export const validateData = <T>(
  schema: z.ZodSchema,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

/**
 * Validates post with custom checks
 */
export const validatePost = (data: unknown): { success: boolean; data?: any; errors?: Record<string, string> } => {
  // First, validate schema
  const schemaResult = validateData(createPostSchema, data);
  if (!schemaResult.success) {
    return schemaResult;
  }

  // Then, validate content
  const contentCheck = validatePostContent((data as any).content);
  if (!contentCheck.valid) {
    return {
      success: false,
      errors: { content: contentCheck.message || 'Invalid content' },
    };
  }

  return schemaResult;
};

/**
 * Validates comment with custom checks
 */
export const validateComment = (data: unknown): { success: boolean; data?: any; errors?: Record<string, string> } => {
  // First, validate schema
  const schemaResult = validateData(createCommentSchema, data);
  if (!schemaResult.success) {
    return schemaResult;
  }

  // Then, validate content
  const contentCheck = validatePostContent((data as any).content);
  if (!contentCheck.valid) {
    return {
      success: false,
      errors: { content: contentCheck.message || 'Invalid content' },
    };
  }

  return schemaResult;
};

/**
 * Validates group creation
 */
export const validateGroupCreation = async (data: unknown): Promise<{ success: boolean; data?: any; errors?: Record<string, string> }> => {
  // First, validate schema
  const schemaResult = validateData(createGroupSchema, data);
  if (!schemaResult.success) {
    return schemaResult;
  }

  // Then, validate group name uniqueness (if needed)
  // This could be an async database check
  const nameCheck = await validateGroupName((data as any).name);
  if (!nameCheck.valid) {
    return {
      success: false,
      errors: { name: nameCheck.message || 'Invalid group name' },
    };
  }

  return schemaResult;
};

/**
 * Get formatted error message for display
 */
export const getErrorMessage = (errors: Record<string, string>, fieldName: string): string | undefined => {
  return errors[fieldName] || errors['general'];
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: Record<string, string>): string[] => {
  return Object.entries(errors).map(([field, message]) => {
    return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${message}`;
  });
};
