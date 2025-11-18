import { Prisma, VideoStatus, NsfwLevel } from '@prisma/client';
import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { AppError } from '../middlewares/error.middleware';

interface CreateVideoDTO {
  userId: string;
  title: string;
  description?: string;
  isNsfw: boolean;
  nsfwLevel: NsfwLevel;
  tags: string[];
  contentWarnings?: string[];
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
}

interface VideoFeedParams {
  userId?: string;
  page: number;
  limit: number;
  tags?: string[];
  nsfwOnly?: boolean;
  sortBy?: 'recent' | 'popular' | 'trending';
  isAgeVerified?: boolean;
}

export class VideoService {
  /**
   * Create a new video
   */
  static async createVideo(data: CreateVideoDTO) {
    const { userId, tags, ...videoData } = data;

    // Get or create tags
    const tagIds = await this.getOrCreateTags(tags);

    // Create video
    const video = await prisma.video.create({
      data: {
        ...videoData,
        userId,
        status: VideoStatus.PROCESSING,
        tags: {
          create: tagIds.map(tagId => ({ tagId })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isPremium: true,
          },
        },
      },
    });

    // Invalidate cache
    await cache.deletePattern('videos:feed:*');

    return video;
  }

  /**
   * Get video feed with recommendations
   */
  static async getVideoFeed(params: VideoFeedParams) {
    const {
      userId,
      page = 1,
      limit = 20,
      tags,
      nsfwOnly,
      sortBy = 'recent',
      isAgeVerified = false,
    } = params;

    const skip = (page - 1) * limit;

    // Build cache key
    const cacheKey = `videos:feed:${sortBy}:${page}:${limit}:${tags?.join(',') || 'all'}:${nsfwOnly}:${isAgeVerified}`;

    // Try to get from cache
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build where clause
    const where: Prisma.VideoWhereInput = {
      status: VideoStatus.READY,
      isPublic: true,
    };

    // NSFW filtering based on age verification
    if (!isAgeVerified) {
      where.isNsfw = false;
    } else if (nsfwOnly) {
      where.isNsfw = true;
    }

    // Tags filtering
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            slug: { in: tags },
          },
        },
      };
    }

    // Exclude already watched videos for logged-in users
    if (userId) {
      const watchedIds = await this.getWatchedVideoIds(userId, 50);
      if (watchedIds.length > 0) {
        where.id = { notIn: watchedIds };
      }
    }

    // Build order by
    let orderBy: Prisma.VideoOrderByWithRelationInput[];
    switch (sortBy) {
      case 'popular':
        orderBy = [{ viewsCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'trending':
        // For trending, we prioritize recent videos with high engagement
        orderBy = [{ likesCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'recent':
      default:
        orderBy = [{ createdAt: 'desc' }];
    }

    // Query videos
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isPremium: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  category: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              interactions: {
                where: { type: 'LIKE' },
              },
            },
          },
        },
      }),
      prisma.video.count({ where }),
    ]);

    // Get user interactions if logged in
    let userInteractions: Map<string, string[]> = new Map();
    if (userId) {
      userInteractions = await this.getUserInteractions(
        userId,
        videos.map(v => v.id)
      );
    }

    // Format response
    const formattedVideos = videos.map(video => ({
      ...video,
      tags: video.tags.map(vt => vt.tag),
      isLiked: userInteractions.get(video.id)?.includes('LIKE') || false,
      isFavorited: userInteractions.get(video.id)?.includes('FAVORITE') || false,
    }));

    const result = {
      videos: formattedVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Get video by ID
   */
  static async getVideoById(videoId: string, userId?: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isPremium: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!video) {
      throw new AppError(404, 'Video not found', 'VIDEO_NOT_FOUND');
    }

    // Check NSFW access
    if (video.isNsfw && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAgeVerified: true },
      });

      if (!user?.isAgeVerified) {
        throw new AppError(
          403,
          'Age verification required to view this content',
          'AGE_VERIFICATION_REQUIRED'
        );
      }
    }

    // Get user interaction
    let isLiked = false;
    let isFavorited = false;
    if (userId) {
      const interactions = await prisma.interaction.findMany({
        where: {
          userId,
          videoId,
          type: { in: ['LIKE', 'FAVORITE'] },
        },
      });

      isLiked = interactions.some(i => i.type === 'LIKE');
      isFavorited = interactions.some(i => i.type === 'FAVORITE');
    }

    return {
      ...video,
      tags: video.tags.map(vt => vt.tag),
      isLiked,
      isFavorited,
    };
  }

  /**
   * Record video view
   */
  static async recordView(videoId: string, userId?: string, watchDuration?: number) {
    // Increment view count
    await prisma.video.update({
      where: { id: videoId },
      data: { viewsCount: { increment: 1 } },
    });

    // Record interaction
    if (userId) {
      await prisma.interaction.upsert({
        where: {
          userId_videoId_type: {
            userId,
            videoId,
            type: 'VIEW',
          },
        },
        create: {
          userId,
          videoId,
          type: 'VIEW',
          watchDuration,
        },
        update: {
          watchDuration,
          updatedAt: new Date(),
        },
      });
    }

    // Invalidate cache
    await cache.delete(`video:${videoId}`);
  }

  /**
   * Toggle like on video
   */
  static async toggleLike(videoId: string, userId: string) {
    const existing = await prisma.interaction.findUnique({
      where: {
        userId_videoId_type: {
          userId,
          videoId,
          type: 'LIKE',
        },
      },
    });

    if (existing) {
      // Unlike
      await prisma.$transaction([
        prisma.interaction.delete({
          where: { id: existing.id },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);

      return { liked: false };
    } else {
      // Like
      await prisma.$transaction([
        prisma.interaction.create({
          data: {
            userId,
            videoId,
            type: 'LIKE',
          },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);

      return { liked: true };
    }
  }

  /**
   * Get or create tags
   */
  private static async getOrCreateTags(tagNames: string[]): Promise<string[]> {
    const tagIds: string[] = [];

    for (const name of tagNames) {
      const slug = name.toLowerCase().replace(/\s+/g, '-');

      const tag = await prisma.tag.upsert({
        where: { slug },
        create: {
          name,
          slug,
          category: 'GENRE', // Default category
        },
        update: {
          usageCount: { increment: 1 },
        },
      });

      tagIds.push(tag.id);
    }

    return tagIds;
  }

  /**
   * Get watched video IDs for user
   */
  private static async getWatchedVideoIds(
    userId: string,
    limit: number = 50
  ): Promise<string[]> {
    const interactions = await prisma.interaction.findMany({
      where: {
        userId,
        type: 'VIEW',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { videoId: true },
    });

    return interactions.map(i => i.videoId);
  }

  /**
   * Get user interactions for multiple videos
   */
  private static async getUserInteractions(
    userId: string,
    videoIds: string[]
  ): Promise<Map<string, string[]>> {
    const interactions = await prisma.interaction.findMany({
      where: {
        userId,
        videoId: { in: videoIds },
        type: { in: ['LIKE', 'FAVORITE'] },
      },
      select: {
        videoId: true,
        type: true,
      },
    });

    const map = new Map<string, string[]>();
    interactions.forEach(interaction => {
      const existing = map.get(interaction.videoId) || [];
      existing.push(interaction.type);
      map.set(interaction.videoId, existing);
    });

    return map;
  }
}
