import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class SearchService {
  /**
   * Search videos by title, description, or tags
   */
  static async searchVideos(
    query: string,
    page: number = 1,
    limit: number = 20,
    isAgeVerified: boolean = false
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.VideoWhereInput = {
      status: 'READY',
      isPublic: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        {
          tags: {
            some: {
              tag: {
                name: { contains: query, mode: 'insensitive' },
              },
            },
          },
        },
      ],
    };

    // Filter NSFW content
    if (!isAgeVerified) {
      where.isNsfw = false;
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        skip,
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
        },
      }),
      prisma.video.count({ where }),
    ]);

    return {
      videos: videos.map(v => ({ ...v, tags: v.tags.map(vt => vt.tag) })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search users
   */
  static async searchUsers(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          AND: [
            { isActive: true },
            { isBanned: false },
            {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isPremium: true,
          _count: {
            select: {
              videos: { where: { status: 'READY' } },
              followers: true,
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          AND: [
            { isActive: true },
            { isBanned: false },
            {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
      }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get trending tags
   */
  static async getTrendingTags(limit: number = 20) {
    const tags = await prisma.tag.findMany({
      take: limit,
      orderBy: {
        usageCount: 'desc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        isNsfw: true,
        usageCount: true,
      },
    });

    return tags;
  }
}
