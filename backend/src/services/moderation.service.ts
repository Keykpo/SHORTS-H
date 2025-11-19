import { prisma } from '../config/database';
import { ReportReason, ReportStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../config/logger';

interface CreateReportDTO {
  reporterId: string;
  videoId?: string;
  reason: ReportReason;
  description?: string;
}

export class ModerationService {
  /**
   * Create a report
   */
  static async createReport(data: CreateReportDTO) {
    const { reporterId, videoId, reason, description } = data;

    // Verify video exists if videoId provided
    if (videoId) {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!video) {
        throw new AppError(404, 'Video not found', 'VIDEO_NOT_FOUND');
      }

      // Check if user already reported this video
      const existingReport = await prisma.report.findFirst({
        where: {
          reporterId,
          videoId,
          status: { in: ['PENDING', 'REVIEWING'] },
        },
      });

      if (existingReport) {
        throw new AppError(400, 'You already reported this content', 'ALREADY_REPORTED');
      }
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        videoId,
        reason,
        description,
        status: 'PENDING',
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        video: {
          select: {
            id: true,
            title: true,
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Auto-action for critical reports
    if (reason === 'ILLEGAL_CONTENT' || reason === 'UNDERAGE_CONTENT') {
      await this.autoModerateVideo(videoId!);
    }

    return report;
  }

  /**
   * Get all reports (admin only)
   */
  static async getReports(
    status?: ReportStatus,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          video: {
            select: {
              id: true,
              title: true,
              status: true,
              isPublic: true,
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Review report (admin only)
   */
  static async reviewReport(
    reportId: string,
    reviewerId: string,
    action: 'RESOLVE' | 'DISMISS',
    note?: string
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { video: true },
    });

    if (!report) {
      throw new AppError(404, 'Report not found', 'REPORT_NOT_FOUND');
    }

    const status: ReportStatus = action === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED';

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy: reviewerId,
        reviewNote: note,
        reviewedAt: new Date(),
      },
    });

    // If resolved and video exists, take action
    if (action === 'RESOLVE' && report.videoId) {
      await this.takeActionOnVideo(report.videoId, report.reason);
    }

    return updated;
  }

  /**
   * Auto-moderate video for critical violations
   */
  private static async autoModerateVideo(videoId: string) {
    await prisma.video.update({
      where: { id: videoId },
      data: {
        isPublic: false,
        status: 'DELETED',
      },
    });

    logger.warn('Auto-moderated video for critical violation', { videoId });
  }

  /**
   * Take action on video based on report reason
   */
  private static async takeActionOnVideo(videoId: string, reason: ReportReason) {
    switch (reason) {
      case 'ILLEGAL_CONTENT':
      case 'UNDERAGE_CONTENT':
        // Delete video and ban user
        const video = await prisma.video.findUnique({
          where: { id: videoId },
          select: { userId: true },
        });

        if (video) {
          await prisma.user.update({
            where: { id: video.userId },
            data: { isBanned: true },
          });
        }

        await prisma.video.update({
          where: { id: videoId },
          data: {
            isPublic: false,
            status: 'DELETED',
          },
        });
        break;

      case 'SPAM':
      case 'MISLEADING':
        // Hide video
        await prisma.video.update({
          where: { id: videoId },
          data: { isPublic: false },
        });
        break;

      case 'COPYRIGHT':
        // Delete video
        await prisma.video.update({
          where: { id: videoId },
          data: {
            isPublic: false,
            status: 'DELETED',
          },
        });
        break;

      default:
        // Just log, manual review needed
        logger.info('Manual review needed for video', { videoId });
    }
  }

  /**
   * Ban user (admin only)
   */
  static async banUser(userId: string, reason: string) {
    // Ban user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        isActive: false,
      },
    });

    // Hide all user's videos
    await prisma.video.updateMany({
      where: { userId },
      data: { isPublic: false },
    });

    logger.warn('User banned', { userId, reason });

    return { success: true };
  }

  /**
   * Unban user (admin only)
   */
  static async unbanUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        isActive: true,
      },
    });

    return { success: true };
  }

  /**
   * Get moderation stats (admin dashboard)
   */
  static async getModerationStats() {
    const [
      totalReports,
      pendingReports,
      totalBannedUsers,
      deletedVideos,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.video.count({ where: { status: 'DELETED' } }),
    ]);

    // Reports by reason
    const reportsByReason = await prisma.report.groupBy({
      by: ['reason'],
      _count: true,
      where: { status: 'PENDING' },
    });

    return {
      totalReports,
      pendingReports,
      totalBannedUsers,
      deletedVideos,
      reportsByReason,
    };
  }
}
