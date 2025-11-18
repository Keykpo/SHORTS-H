import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: z.ZodObject<any> | z.ZodEffects<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
      }

      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  // User registration
  register: z.object({
    body: z.object({
      username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
      email: z.string().email('Invalid email address'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
      birthDate: z.string().refine((date) => {
        const birthDate = new Date(date);
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age >= 18;
      }, 'You must be at least 18 years old to register'),
      agreedToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms'),
    }),
  }),

  // User login
  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  // Video upload
  uploadVideo: z.object({
    body: z.object({
      title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title must be at most 200 characters'),
      description: z
        .string()
        .max(5000, 'Description must be at most 5000 characters')
        .optional(),
      isNsfw: z.boolean().default(true),
      nsfwLevel: z.enum(['SOFT', 'MODERATE', 'EXPLICIT']).default('MODERATE'),
      tags: z
        .array(z.string())
        .min(1, 'At least one tag is required')
        .max(10, 'Maximum 10 tags allowed'),
      contentWarnings: z.array(z.string()).optional(),
    }),
  }),

  // Video ID param
  videoId: z.object({
    params: z.object({
      id: z.string().cuid('Invalid video ID'),
    }),
  }),

  // Comment creation
  createComment: z.object({
    body: z.object({
      videoId: z.string().cuid('Invalid video ID'),
      content: z
        .string()
        .min(1, 'Comment cannot be empty')
        .max(2000, 'Comment must be at most 2000 characters'),
      parentId: z.string().cuid().optional(),
    }),
  }),

  // Pagination
  pagination: z.object({
    query: z.object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val > 0, 'Page must be greater than 0'),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 20))
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
    }),
  }),

  // Video feed filters
  videoFeed: z.object({
    query: z.object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1)),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 20)),
      tags: z.string().optional(),
      nsfwOnly: z
        .string()
        .optional()
        .transform((val) => val === 'true'),
      sortBy: z.enum(['recent', 'popular', 'trending']).optional().default('recent'),
    }),
  }),
};
