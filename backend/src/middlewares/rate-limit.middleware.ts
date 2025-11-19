import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { redis } from '../config/redis';
import { AuthRequest } from './auth.middleware';
import { logger } from '../config/logger';

/**
 * Rate limiter configurations
 */

// Global rate limiter (for anonymous users)
const globalLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60, // Block for 60 seconds if exceeded
});

// Authenticated user rate limiter (Redis-backed)
let userLimiter: RateLimiterRedis | RateLimiterMemory;

try {
  userLimiter = new RateLimiterRedis({
    storeClient: redis,
    points: 200, // More requests for authenticated users
    duration: 60, // Per 60 seconds
    blockDuration: 60,
    keyPrefix: 'rl:user',
  });
} catch (error) {
  logger.warn('Redis rate limiter failed to initialize, using memory', { error });
  userLimiter = new RateLimiterMemory({
    points: 200,
    duration: 60,
    blockDuration: 60,
  });
}

// Premium user rate limiter
let premiumLimiter: RateLimiterRedis | RateLimiterMemory;

try {
  premiumLimiter = new RateLimiterRedis({
    storeClient: redis,
    points: 500, // Much higher limits for premium
    duration: 60,
    blockDuration: 30, // Shorter block time
    keyPrefix: 'rl:premium',
  });
} catch (error) {
  premiumLimiter = new RateLimiterMemory({
    points: 500,
    duration: 60,
    blockDuration: 30,
  });
}

// Upload rate limiter (stricter for resource-intensive operations)
let uploadLimiter: RateLimiterRedis | RateLimiterMemory;

try {
  uploadLimiter = new RateLimiterRedis({
    storeClient: redis,
    points: 10, // Only 10 uploads per hour
    duration: 3600, // Per hour
    blockDuration: 3600,
    keyPrefix: 'rl:upload',
  });
} catch (error) {
  uploadLimiter = new RateLimiterMemory({
    points: 10,
    duration: 3600,
    blockDuration: 3600,
  });
}

// Authentication rate limiter (prevent brute force)
let authLimiter: RateLimiterRedis | RateLimiterMemory;

try {
  authLimiter = new RateLimiterRedis({
    storeClient: redis,
    points: 5, // Only 5 login attempts
    duration: 300, // Per 5 minutes
    blockDuration: 900, // Block for 15 minutes if exceeded
    keyPrefix: 'rl:auth',
  });
} catch (error) {
  authLimiter = new RateLimiterMemory({
    points: 5,
    duration: 300,
    blockDuration: 900,
  });
}

/**
 * General rate limiting middleware
 */
export const rateLimitMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    let limiter: RateLimiterRedis | RateLimiterMemory;
    let key: string;

    if (user) {
      // Use user-specific limiter
      limiter = user.isPremium ? premiumLimiter : userLimiter;
      key = user.userId;
    } else {
      // Use IP-based global limiter
      limiter = globalLimiter;
      key = req.ip || 'unknown';
    }

    await limiter.consume(key);
    next();
  } catch (error: any) {
    const retryAfter = Math.ceil(error.msBeforeNext / 1000) || 60;

    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: (req as AuthRequest).user?.userId,
      path: req.path,
      retryAfter,
    });

    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter,
    });
  }
};

/**
 * Upload rate limiting middleware
 */
export const uploadRateLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId || req.ip || 'unknown';
    await uploadLimiter.consume(userId);
    next();
  } catch (error: any) {
    const retryAfter = Math.ceil(error.msBeforeNext / 1000) || 3600;

    logger.warn('Upload rate limit exceeded', {
      userId: req.user?.userId,
      ip: req.ip,
      retryAfter,
    });

    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      success: false,
      error: 'Upload limit exceeded. Please try again later.',
      retryAfter,
      message: 'You can upload up to 10 videos per hour',
    });
  }
};

/**
 * Authentication rate limiting middleware (login/register)
 */
export const authRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const key = req.body.email || req.ip || 'unknown';
    await authLimiter.consume(key);
    next();
  } catch (error: any) {
    const retryAfter = Math.ceil(error.msBeforeNext / 1000) || 900;

    logger.warn('Auth rate limit exceeded', {
      email: req.body.email,
      ip: req.ip,
      retryAfter,
    });

    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter,
    });
  }
};

/**
 * Custom rate limiter factory
 */
export const createRateLimiter = (options: {
  points: number;
  duration: number;
  blockDuration?: number;
  keyPrefix?: string;
}) => {
  try {
    return new RateLimiterRedis({
      storeClient: redis,
      points: options.points,
      duration: options.duration,
      blockDuration: options.blockDuration || options.duration,
      keyPrefix: options.keyPrefix || 'rl:custom',
    });
  } catch (error) {
    logger.warn('Creating memory-based rate limiter', { error });
    return new RateLimiterMemory({
      points: options.points,
      duration: options.duration,
      blockDuration: options.blockDuration || options.duration,
    });
  }
};

/**
 * Rate limiter for specific endpoints
 */
export const customRateLimit = (
  limiter: RateLimiterRedis | RateLimiterMemory,
  getKey?: (req: AuthRequest) => string
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const key = getKey ? getKey(req) : req.user?.userId || req.ip || 'unknown';
      await limiter.consume(key);
      next();
    } catch (error: any) {
      const retryAfter = Math.ceil(error.msBeforeNext / 1000) || 60;

      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter,
      });
    }
  };
};
