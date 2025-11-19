import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ModerationService } from '../services/moderation.service';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

export class AdminController {
  /**
   * Get admin dashboard statistics
   */
  static async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const [
        totalUsers,
        activeUsers,
        bannedUsers,
        premiumUsers,
        totalVideos,
        processingVideos,
        readyVideos,
        failedVideos,
        deletedVideos,
        totalViews,
        totalComments,
        moderationStats,
      ] = await Promise.all([
        // User stats
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true, isBanned: false } }),
        prisma.user.count({ where: { isBanned: true } }),
        prisma.user.count({ where: { isPremium: true } }),

        // Video stats
        prisma.video.count(),
        prisma.video.count({ where: { status: 'PROCESSING' } }),
        prisma.video.count({ where: { status: 'READY' } }),
        prisma.video.count({ where: { status: 'FAILED' } }),
        prisma.video.count({ where: { status: 'DELETED' } }),

        // Engagement stats
        prisma.video.aggregate({ _sum: { viewsCount: true } }),
        prisma.comment.count(),

        // Moderation stats
        ModerationService.getModerationStats(),
      ]);

      // Recent activity (last 24 hours)
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [
        newUsersToday,
        newVideosToday,
        newReportsToday,
      ] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: last24Hours } } }),
        prisma.video.count({ where: { createdAt: { gte: last24Hours } } }),
        prisma.report.count({ where: { createdAt: { gte: last24Hours } } }),
      ]);

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
            banned: bannedUsers,
            premium: premiumUsers,
            newToday: newUsersToday,
          },
          videos: {
            total: totalVideos,
            processing: processingVideos,
            ready: readyVideos,
            failed: failedVideos,
            deleted: deletedVideos,
            newToday: newVideosToday,
          },
          engagement: {
            totalViews: totalViews._sum.viewsCount || 0,
            totalComments,
          },
          moderation: {
            ...moderationStats,
            newReportsToday,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get dashboard stats', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard statistics',
      });
    }
  }

  /**
   * Get all reports with filtering
   */
  static async getReports(req: AuthRequest, res: Response) {
    try {
      const { status, page = '1', limit = '20' } = req.query;

      const result = await ModerationService.getReports(
        status as any,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to get reports', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reports',
      });
    }
  }

  /**
   * Review a report (resolve or dismiss)
   */
  static async reviewReport(req: AuthRequest, res: Response) {
    try {
      const { reportId } = req.params;
      const { action, note } = req.body;

      if (!['RESOLVE', 'DISMISS'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Must be RESOLVE or DISMISS',
        });
      }

      const result = await ModerationService.reviewReport(
        reportId,
        req.userId!,
        action,
        note
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to review report', { error, reportId: req.params.reportId });
      res.status(500).json({
        success: false,
        error: 'Failed to review report',
      });
    }
  }

  /**
   * Ban a user
   */
  static async banUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Ban reason is required',
        });
      }

      await ModerationService.banUser(userId, reason);

      logger.info('User banned by admin', {
        adminId: req.userId,
        bannedUserId: userId,
        reason,
      });

      res.json({
        success: true,
        message: 'User has been banned',
      });
    } catch (error) {
      logger.error('Failed to ban user', { error, userId: req.params.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to ban user',
      });
    }
  }

  /**
   * Unban a user
   */
  static async unbanUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      await ModerationService.unbanUser(userId);

      logger.info('User unbanned by admin', {
        adminId: req.userId,
        unbannedUserId: userId,
      });

      res.json({
        success: true,
        message: 'User has been unbanned',
      });
    } catch (error) {
      logger.error('Failed to unban user', { error, userId: req.params.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to unban user',
      });
    }
  }

  /**
   * Get all users with filtering and pagination
   */
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        search,
        status, // active, banned, all
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};

      if (search) {
        where.OR = [
          { username: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (status === 'banned') {
        where.isBanned = true;
      } else if (status === 'active') {
        where.isActive = true;
        where.isBanned = false;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            isAdmin: true,
            isPremium: true,
            isActive: true,
            isBanned: true,
            isAgeVerified: true,
            createdAt: true,
            lastLoginAt: true,
            _count: {
              select: {
                videos: true,
                comments: true,
                followers: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            totalPages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get users', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
      });
    }
  }

  /**
   * Get all videos with filtering and pagination
   */
  static async getVideos(req: AuthRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        status, // PROCESSING, READY, FAILED, DELETED
        search,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        }),
        prisma.video.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          videos,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            totalPages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get videos', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch videos',
      });
    }
  }

  /**
   * Delete a video
   */
  static async deleteVideo(req: AuthRequest, res: Response) {
    try {
      const { videoId } = req.params;

      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'DELETED',
          isPublic: false,
        },
      });

      logger.info('Video deleted by admin', {
        adminId: req.userId,
        videoId,
      });

      res.json({
        success: true,
        message: 'Video has been deleted',
      });
    } catch (error) {
      logger.error('Failed to delete video', { error, videoId: req.params.videoId });
      res.status(500).json({
        success: false,
        error: 'Failed to delete video',
      });
    }
  }
}
