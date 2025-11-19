import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

/**
 * Middleware to check if user is an admin
 * Must be used after authenticate middleware
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      logger.warn('Unauthorized admin access attempt', {
        userId: req.userId,
        path: req.path,
      });

      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED',
      });
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error', { error });
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed',
    });
  }
};
