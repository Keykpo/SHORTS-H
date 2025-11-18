import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Handle custom AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = (error.meta?.target as string[])?.[0] || 'field';
        return res.status(409).json({
          success: false,
          error: `${field} already exists`,
          code: 'DUPLICATE_ERROR',
        });
      case 'P2025':
        // Record not found
        return res.status(404).json({
          success: false,
          error: 'Resource not found',
          code: 'NOT_FOUND',
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Database error',
          code: 'DATABASE_ERROR',
        });
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR',
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message,
    code: 'INTERNAL_ERROR',
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
};
