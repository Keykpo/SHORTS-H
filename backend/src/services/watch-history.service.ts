import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../config/logger';

interface UpdateWatchProgressDTO {
  userId: string;
  videoId: string;
  watchedDuration: number; // Seconds watched
  totalDuration: number;   // Total video duration
}

export class WatchHistoryService {
  /**
   * Update watch progress for a video
   * Creates or updates the watch history entry
   */
  static async updateWatchProgress(data: UpdateWatchProgressDTO) {
    const { userId, videoId, watchedDuration, totalDuration } = data;

    // Calculate progress percentage
    const progressPercent = Math.min((watchedDuration / totalDuration) * 100, 100);
    const completed = progressPercent >= 90; // Consider completed if watched 90%+

    // Upsert watch history
    const watchHistory = await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
      update: {
        watchedDuration,
        totalDuration,
        progressPercent,
        completed,
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        videoId,
        watchedDuration,
        totalDuration,
        progressPercent,
        completed,
      },
    });

    logger.info('Watch progress updated', {
      userId,
      videoId,
      progressPercent: progressPercent.toFixed(2),
      completed,
    });

    // Clear cache
    await cache.delete(`watch-history:${userId}`);
    await cache.delete(`watch-history:${userId}:continue`);

    return watchHistory;
  }

  /**
   * Get user's watch history
   */
  static async getWatchHistory(userId: string, page: number = 1, limit: number = 20) {
    const cacheKey = `watch-history:${userId}:${page}:${limit}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.watchHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { lastWatchedAt: 'desc' },
        include: {
          video: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.watchHistory.count({ where: { userId } }),
    ]);

    const result = {
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, JSON.stringify(result), 120);

    return result;
  }

  /**
   * Get videos to "Continue Watching"
   * Returns videos that are partially watched (not completed)
   */
  static async getContinueWatching(userId: string, limit: number = 10) {
    const cacheKey = `watch-history:${userId}:continue`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const continueWatching = await prisma.watchHistory.findMany({
      where: {
        userId,
        completed: false,
        progressPercent: { gt: 5 }, // Only show if watched more than 5%
      },
      take: limit,
      orderBy: { lastWatchedAt: 'desc' },
      include: {
        video: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Cache for 5 minutes
    await cache.set(cacheKey, JSON.stringify(continueWatching), 300);

    return continueWatching;
  }

  /**
   * Get watch progress for a specific video
   */
  static async getVideoProgress(userId: string, videoId: string) {
    const progress = await prisma.watchHistory.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
    });

    return progress;
  }

  /**
   * Clear watch history for a user
   */
  static async clearWatchHistory(userId: string) {
    const deleted = await prisma.watchHistory.deleteMany({
      where: { userId },
    });

    logger.info('Watch history cleared', { userId, count: deleted.count });

    // Clear cache
    await cache.delete(`watch-history:${userId}`);
    await cache.delete(`watch-history:${userId}:continue`);

    return { success: true, deletedCount: deleted.count };
  }

  /**
   * Remove specific video from watch history
   */
  static async removeFromHistory(userId: string, videoId: string) {
    const deleted = await prisma.watchHistory.delete({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
    });

    logger.info('Video removed from watch history', { userId, videoId });

    // Clear cache
    await cache.delete(`watch-history:${userId}`);
    await cache.delete(`watch-history:${userId}:continue`);

    return { success: true };
  }

  /**
   * Get watch statistics for a user
   */
  static async getWatchStats(userId: string) {
    const [totalVideos, completedVideos, totalWatchTime] = await Promise.all([
      prisma.watchHistory.count({ where: { userId } }),
      prisma.watchHistory.count({ where: { userId, completed: true } }),
      prisma.watchHistory.aggregate({
        where: { userId },
        _sum: { watchedDuration: true },
      }),
    ]);

    // Get most watched categories/tags (from completed videos)
    const completedHistory = await prisma.watchHistory.findMany({
      where: { userId, completed: true },
      include: {
        video: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    // Count tag frequencies
    const tagCounts: Record<string, number> = {};
    completedHistory.forEach((history) => {
      history.video.tags.forEach((videoTag) => {
        const tagName = videoTag.tag.name;
        tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
      });
    });

    // Get top 5 tags
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalVideosWatched: totalVideos,
      completedVideos,
      totalWatchTimeSeconds: totalWatchTime._sum.watchedDuration || 0,
      totalWatchTimeHours: ((totalWatchTime._sum.watchedDuration || 0) / 3600).toFixed(2),
      completionRate:
        totalVideos > 0 ? ((completedVideos / totalVideos) * 100).toFixed(2) : 0,
      topTags,
    };
  }

  /**
   * Auto-cleanup old watch history (older than X days)
   * This can be run as a cron job
   */
  static async cleanupOldHistory(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleted = await prisma.watchHistory.deleteMany({
      where: {
        lastWatchedAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info('Old watch history cleaned up', {
      daysOld,
      deletedCount: deleted.count,
    });

    return { success: true, deletedCount: deleted.count };
  }
}
