import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { logger } from '../config/logger';

export class AnalyticsService {
  /**
   * Get creator dashboard overview
   */
  static async getCreatorOverview(userId: string) {
    const cacheKey = `analytics:overview:${userId}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const [
      totalVideos,
      totalViews,
      totalLikes,
      totalComments,
      totalFollowers,
      averageCompletionRate,
    ] = await Promise.all([
      // Total videos
      prisma.video.count({
        where: { userId, status: 'READY' },
      }),

      // Total views across all videos
      prisma.video.aggregate({
        where: { userId, status: 'READY' },
        _sum: { viewsCount: true },
      }),

      // Total likes
      prisma.video.aggregate({
        where: { userId, status: 'READY' },
        _sum: { likesCount: true },
      }),

      // Total comments
      prisma.video.aggregate({
        where: { userId, status: 'READY' },
        _sum: { commentsCount: true },
      }),

      // Total followers
      prisma.follow.count({
        where: { followingId: userId },
      }),

      // Average completion rate from watch history
      prisma.watchHistory.aggregate({
        where: {
          video: { userId },
        },
        _avg: { progressPercent: true },
      }),
    ]);

    // Calculate engagement rate
    const engagementRate =
      totalViews._sum.viewsCount && totalViews._sum.viewsCount > 0
        ? (((totalLikes._sum.likesCount || 0) + (totalComments._sum.commentsCount || 0)) /
            totalViews._sum.viewsCount) *
          100
        : 0;

    const overview = {
      totalVideos,
      totalViews: totalViews._sum.viewsCount || 0,
      totalLikes: totalLikes._sum.likesCount || 0,
      totalComments: totalComments._sum.commentsCount || 0,
      totalFollowers,
      averageCompletionRate: averageCompletionRate._avg.progressPercent?.toFixed(2) || 0,
      engagementRate: engagementRate.toFixed(2),
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, JSON.stringify(overview), 300);

    return overview;
  }

  /**
   * Get detailed analytics for a specific video
   */
  static async getVideoAnalytics(videoId: string, userId: string) {
    // Verify ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video || video.userId !== userId) {
      throw new Error('Unauthorized or video not found');
    }

    const cacheKey = `analytics:video:${videoId}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const [viewStats, completionStats, engagementByHour] = await Promise.all([
      // View statistics
      prisma.video.findUnique({
        where: { id: videoId },
        select: {
          viewsCount: true,
          likesCount: true,
          dislikesCount: true,
          commentsCount: true,
          sharesCount: true,
          duration: true,
          createdAt: true,
        },
      }),

      // Completion statistics
      prisma.watchHistory.aggregate({
        where: { videoId },
        _avg: { progressPercent: true },
        _count: { completed: true },
      }),

      // Views by hour (for best time to post analysis)
      prisma.$queryRaw`
        SELECT
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as view_count
        FROM video_views
        WHERE video_id = ${videoId}
        GROUP BY hour
        ORDER BY hour
      `,
    ]);

    // Top viewers
    const topViewers = await prisma.watchHistory.findMany({
      where: { videoId },
      take: 10,
      orderBy: { watchedDuration: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    const analytics = {
      video: viewStats,
      completion: {
        averageCompletionRate: completionStats._avg.progressPercent?.toFixed(2) || 0,
        completedViews: completionStats._count.completed,
      },
      engagementByHour,
      topViewers: topViewers.map((v) => ({
        user: v.user,
        watchedDuration: v.watchedDuration,
        progressPercent: v.progressPercent,
      })),
      engagementRate:
        viewStats && viewStats.viewsCount > 0
          ? (
              ((viewStats.likesCount + viewStats.commentsCount) / viewStats.viewsCount) *
              100
            ).toFixed(2)
          : 0,
    };

    // Cache for 10 minutes
    await cache.set(cacheKey, JSON.stringify(analytics), 600);

    return analytics;
  }

  /**
   * Get audience demographics (top tags, locations if available)
   */
  static async getAudienceDemographics(userId: string) {
    const cacheKey = `analytics:demographics:${userId}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Get all videos from creator
    const videos = await prisma.video.findMany({
      where: { userId, status: 'READY' },
      select: { id: true },
    });

    const videoIds = videos.map((v) => v.id);

    if (videoIds.length === 0) {
      return {
        topTags: [],
        viewerRetention: 0,
        averageWatchTime: 0,
      };
    }

    // Get watch history for these videos
    const watchHistory = await prisma.watchHistory.findMany({
      where: {
        videoId: { in: videoIds },
      },
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

    // Count tag preferences of audience
    const tagCounts: Record<string, { name: string; count: number }> = {};
    watchHistory.forEach((history) => {
      history.video.tags.forEach((videoTag) => {
        const tagName = videoTag.tag.name;
        if (!tagCounts[tagName]) {
          tagCounts[tagName] = { name: tagName, count: 0 };
        }
        tagCounts[tagName].count++;
      });
    });

    const topTags = Object.values(tagCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate viewer retention (% of viewers who completed)
    const completedCount = watchHistory.filter((h) => h.completed).length;
    const viewerRetention =
      watchHistory.length > 0 ? (completedCount / watchHistory.length) * 100 : 0;

    // Average watch time
    const totalWatchTime = watchHistory.reduce((sum, h) => sum + h.watchedDuration, 0);
    const averageWatchTime =
      watchHistory.length > 0 ? totalWatchTime / watchHistory.length : 0;

    const demographics = {
      topTags,
      viewerRetention: viewerRetention.toFixed(2),
      averageWatchTime: Math.round(averageWatchTime),
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, JSON.stringify(demographics), 900);

    return demographics;
  }

  /**
   * Get growth analytics (followers, views over time)
   */
  static async getGrowthAnalytics(userId: string, days: number = 30) {
    const cacheKey = `analytics:growth:${userId}:${days}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Followers growth
    const followersGrowth = await prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM follows
      WHERE following_id = ${userId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    // Views growth (by video publish date)
    const viewsGrowth = await prisma.$queryRaw<
      { date: Date; views: bigint }[]
    >`
      SELECT
        DATE(published_at) as date,
        SUM(views_count) as views
      FROM videos
      WHERE user_id = ${userId}
        AND published_at >= ${startDate}
        AND status = 'READY'
      GROUP BY DATE(published_at)
      ORDER BY date
    `;

    const growth = {
      followersGrowth: followersGrowth.map((f) => ({
        date: f.date,
        count: Number(f.count),
      })),
      viewsGrowth: viewsGrowth.map((v) => ({
        date: v.date,
        views: Number(v.views),
      })),
    };

    // Cache for 1 hour
    await cache.set(cacheKey, JSON.stringify(growth), 3600);

    return growth;
  }

  /**
   * Get best time to post analysis
   */
  static async getBestTimeToPost(userId: string) {
    const cacheKey = `analytics:best-time:${userId}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Get all video IDs from creator
    const videos = await prisma.video.findMany({
      where: { userId, status: 'READY' },
      select: { id: true },
    });

    const videoIds = videos.map((v) => v.id);

    if (videoIds.length === 0) {
      return {
        bestHour: null,
        bestDay: null,
        hourlyEngagement: [],
        dailyEngagement: [],
      };
    }

    // Engagement by hour and day of week
    const [hourlyData, dailyData] = await Promise.all([
      prisma.$queryRaw<{ hour: number; engagement: bigint }[]>`
        SELECT
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as engagement
        FROM video_views
        WHERE video_id = ANY(${videoIds})
        GROUP BY hour
        ORDER BY engagement DESC
      `,
      prisma.$queryRaw<{ day: number; engagement: bigint }[]>`
        SELECT
          EXTRACT(DOW FROM created_at) as day,
          COUNT(*) as engagement
        FROM video_views
        WHERE video_id = ANY(${videoIds})
        GROUP BY day
        ORDER BY engagement DESC
      `,
    ]);

    const bestTime = {
      bestHour: hourlyData[0] ? Number(hourlyData[0].hour) : null,
      bestDay: dailyData[0] ? Number(dailyData[0].day) : null,
      hourlyEngagement: hourlyData.map((h) => ({
        hour: Number(h.hour),
        engagement: Number(h.engagement),
      })),
      dailyEngagement: dailyData.map((d) => ({
        day: Number(d.day),
        engagement: Number(d.engagement),
      })),
    };

    // Cache for 6 hours
    await cache.set(cacheKey, JSON.stringify(bestTime), 21600);

    return bestTime;
  }

  /**
   * Get top performing videos
   */
  static async getTopVideos(userId: string, limit: number = 10, metric: 'views' | 'likes' | 'engagement' = 'views') {
    const orderBy =
      metric === 'views'
        ? { viewsCount: 'desc' as const }
        : metric === 'likes'
        ? { likesCount: 'desc' as const }
        : { likesCount: 'desc' as const }; // engagement uses likes for now

    const topVideos = await prisma.video.findMany({
      where: { userId, status: 'READY' },
      take: limit,
      orderBy,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return topVideos;
  }
}
