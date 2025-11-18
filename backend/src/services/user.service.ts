import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { cache } from '../config/redis';

export class UserService {
  /**
   * Follow a user
   */
  static async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError(400, 'Cannot follow yourself', 'SELF_FOLLOW');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      throw new AppError(400, 'Already following this user', 'ALREADY_FOLLOWING');
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Invalidate cache
    await cache.delete(`user:${followerId}:following`);
    await cache.delete(`user:${followingId}:followers`);

    // TODO: Create notification

    return { success: true };
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new AppError(404, 'Not following this user', 'NOT_FOLLOWING');
    }

    await prisma.follow.delete({
      where: { id: follow.id },
    });

    // Invalidate cache
    await cache.delete(`user:${followerId}:following`);
    await cache.delete(`user:${followingId}:followers`);

    return { success: true };
  }

  /**
   * Get followers list
   */
  static async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isPremium: true,
            },
          },
        },
      }),
      prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    return {
      followers: followers.map(f => f.follower),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get following list
   */
  static async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isPremium: true,
            },
          },
        },
      }),
      prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      following: following.map(f => f.following),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check if user is following another user
   */
  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  /**
   * Get user profile with stats
   */
  static async getUserProfile(userId: string, currentUserId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        isPremium: true,
        createdAt: true,
        _count: {
          select: {
            videos: { where: { status: 'READY' } },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Get total views across all videos
    const videosStats = await prisma.video.aggregate({
      where: {
        userId,
        status: 'READY',
      },
      _sum: {
        viewsCount: true,
        likesCount: true,
      },
    });

    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      isFollowing = await this.isFollowing(currentUserId, userId);
    }

    return {
      ...user,
      stats: {
        videosCount: user._count.videos,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        totalViews: videosStats._sum.viewsCount || 0,
        totalLikes: videosStats._sum.likesCount || 0,
      },
      isFollowing,
    };
  }
}
