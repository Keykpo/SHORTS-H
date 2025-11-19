import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { setUser } from '../config/sentry';

export interface JWTPayload {
  userId: string;
  email: string;
  isAgeVerified: boolean;
  isPremium: boolean;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
  userId?: string;
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          isActive: true,
          isBanned: true,
          isAgeVerified: true,
          isPremium: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      if (!user.isActive || user.isBanned) {
        return res.status(403).json({
          success: false,
          error: 'Account is inactive or banned',
        });
      }

      // Attach user info to request
      req.user = {
        userId: user.id,
        email: user.email,
        isAgeVerified: user.isAgeVerified,
        isPremium: user.isPremium,
      };
      req.userId = user.id;

      // Set user context for Sentry error tracking
      setUser({ id: user.id, email: user.email });

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
  } catch (error) {
    logger.error('Authentication error', { error });
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        isBanned: true,
        isAgeVerified: true,
        isPremium: true,
      },
    });

    if (user && user.isActive && !user.isBanned) {
      req.user = {
        userId: user.id,
        email: user.email,
        isAgeVerified: user.isAgeVerified,
        isPremium: user.isPremium,
      };
      req.userId = user.id;
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};

/**
 * Middleware to require age verification for NSFW content
 */
export const requireAgeVerification = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (!req.user.isAgeVerified) {
    return res.status(403).json({
      success: false,
      error: 'Age verification required to access this content',
      code: 'AGE_VERIFICATION_REQUIRED',
    });
  }

  next();
};

/**
 * Middleware to require premium subscription
 */
export const requirePremium = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (!req.user.isPremium) {
    return res.status(403).json({
      success: false,
      error: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED',
    });
  }

  next();
};
