import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { logger } from '../config/logger';

interface RecommendationOptions {
  userId?: string;
  limit?: number;
  excludeWatched?: boolean;
}

export class RecommendationService {
  /**
   * Get personalized recommendations for a user
   * Uses a hybrid approach combining multiple signals
   */
  static async getRecommendations(options: RecommendationOptions) {
    const { userId, limit = 20, excludeWatched = true } = options;

    // If not authenticated, return trending videos
    if (!userId) {
      return this.getTrendingVideos(limit);
    }

    const cacheKey = `recommendations:${userId}:${limit}:${excludeWatched}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Parallel fetch of different recommendation signals
    const [
      basedOnHistory,
      basedOnFollowing,
      basedOnLikes,
      trending,
    ] = await Promise.all([
      this.getRecommendationsBasedOnHistory(userId, 10),
      this.getRecommendationsBasedOnFollowing(userId, 10),
      this.getRecommendationsBasedOnLikes(userId, 10),
      this.getTrendingVideos(10),
    ]);

    // Combine and deduplicate
    const allRecommendations = [
      ...basedOnHistory,
      ...basedOnFollowing,
      ...basedOnLikes,
      ...trending,
    ];

    // Remove duplicates
    const seen = new Set<string>();
    const unique = allRecommendations.filter((video) => {
      if (seen.has(video.id)) return false;
      seen.add(video.id);
      return true;
    });

    // Exclude watched videos if requested
    let final = unique;
    if (excludeWatched) {
      const watchedVideoIds = await prisma.watchHistory.findMany({
        where: { userId },
        select: { videoId: true },
      });
      const watchedIds = new Set(watchedVideoIds.map((w) => w.videoId));
      final = unique.filter((video) => !watchedIds.has(video.id));
    }

    // Take requested limit
    const recommendations = final.slice(0, limit);

    // Cache for 10 minutes
    await cache.set(cacheKey, JSON.stringify(recommendations), 600);

    logger.info('Generated recommendations', {
      userId,
      count: recommendations.length,
      sources: {
        history: basedOnHistory.length,
        following: basedOnFollowing.length,
        likes: basedOnLikes.length,
        trending: trending.length,
      },
    });

    return recommendations;
  }

  /**
   * Recommendations based on watch history
   * Finds videos with similar tags to what user has watched
   */
  private static async getRecommendationsBasedOnHistory(userId: string, limit: number) {
    // Get user's top watched tags
    const watchHistory = await prisma.watchHistory.findMany({
      where: { userId, completed: true },
      take: 50,
      orderBy: { lastWatchedAt: 'desc' },
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

    if (watchHistory.length === 0) {
      return [];
    }

    // Count tag frequencies
    const tagCounts: Record<string, number> = {};
    watchHistory.forEach((history) => {
      history.video.tags.forEach((videoTag) => {
        const tagId = videoTag.tag.id;
        tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
      });
    });

    // Get top 5 tags
    const topTagIds = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tagId]) => tagId);

    if (topTagIds.length === 0) {
      return [];
    }

    // Find videos with these tags
    const recommendations = await prisma.video.findMany({
      where: {
        status: 'READY',
        isPublic: true,
        tags: {
          some: {
            tagId: {
              in: topTagIds,
            },
          },
        },
        userId: {
          not: userId, // Exclude own videos
        },
      },
      take: limit,
      orderBy: [
        { viewsCount: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return recommendations;
  }

  /**
   * Recommendations based on users you follow
   */
  private static async getRecommendationsBasedOnFollowing(userId: string, limit: number) {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    if (following.length === 0) {
      return [];
    }

    const followingIds = following.map((f) => f.followingId);

    const recommendations = await prisma.video.findMany({
      where: {
        userId: {
          in: followingIds,
        },
        status: 'READY',
        isPublic: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return recommendations;
  }

  /**
   * Recommendations based on liked videos
   * Finds similar videos to ones you liked
   */
  private static async getRecommendationsBasedOnLikes(userId: string, limit: number) {
    const likedVideos = await prisma.interaction.findMany({
      where: {
        userId,
        type: 'LIKE',
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
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

    if (likedVideos.length === 0) {
      return [];
    }

    // Get tags from liked videos
    const tagCounts: Record<string, number> = {};
    likedVideos.forEach((interaction) => {
      interaction.video.tags.forEach((videoTag) => {
        const tagId = videoTag.tag.id;
        tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
      });
    });

    const topTagIds = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tagId]) => tagId);

    if (topTagIds.length === 0) {
      return [];
    }

    const recommendations = await prisma.video.findMany({
      where: {
        status: 'READY',
        isPublic: true,
        tags: {
          some: {
            tagId: {
              in: topTagIds,
            },
          },
        },
        userId: {
          not: userId,
        },
      },
      take: limit,
      orderBy: [
        { likesCount: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return recommendations;
  }

  /**
   * Get trending videos
   */
  private static async getTrendingVideos(limit: number) {
    const cacheKey = 'trending:videos';
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Trending = high engagement in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await prisma.video.findMany({
      where: {
        status: 'READY',
        isPublic: true,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      take: limit,
      orderBy: [
        { likesCount: 'desc' },
        { viewsCount: 'desc' },
        { commentsCount: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Cache trending for 15 minutes
    await cache.set(cacheKey, JSON.stringify(trending), 900);

    return trending;
  }

  /**
   * Get "For You" feed
   * Alias for recommendations with default options
   */
  static async getForYouFeed(userId?: string, limit: number = 20) {
    return this.getRecommendations({
      userId,
      limit,
      excludeWatched: true,
    });
  }

  /**
   * Get similar videos to a specific video
   */
  static async getSimilarVideos(videoId: string, limit: number = 10) {
    const cacheKey = `similar:${videoId}:${limit}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Get the video with its tags
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!video) {
      return [];
    }

    const tagIds = video.tags.map((vt) => vt.tagId);

    if (tagIds.length === 0) {
      // If no tags, return popular videos from same creator
      const similar = await prisma.video.findMany({
        where: {
          userId: video.userId,
          id: { not: videoId },
          status: 'READY',
          isPublic: true,
        },
        take: limit,
        orderBy: { viewsCount: 'desc' },
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

      return similar;
    }

    // Find videos with overlapping tags
    const similar = await prisma.video.findMany({
      where: {
        id: { not: videoId },
        status: 'READY',
        isPublic: true,
        tags: {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        },
      },
      take: limit,
      orderBy: [
        { likesCount: 'desc' },
        { viewsCount: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Cache for 30 minutes
    await cache.set(cacheKey, JSON.stringify(similar), 1800);

    return similar;
  }
}
