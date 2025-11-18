import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { cache } from '../config/redis';

interface CreateCommentDTO {
  userId: string;
  videoId: string;
  content: string;
  parentId?: string;
}

interface UpdateCommentDTO {
  content: string;
}

export class CommentService {
  /**
   * Create a new comment
   */
  static async createComment(data: CreateCommentDTO) {
    const { userId, videoId, content, parentId } = data;

    // Verify video exists and comments are allowed
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, allowComments: true, userId: true },
    });

    if (!video) {
      throw new AppError(404, 'Video not found', 'VIDEO_NOT_FOUND');
    }

    if (!video.allowComments) {
      throw new AppError(403, 'Comments are disabled for this video', 'COMMENTS_DISABLED');
    }

    // If replying to a comment, verify parent exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new AppError(404, 'Parent comment not found', 'PARENT_NOT_FOUND');
      }

      if (parentComment.videoId !== videoId) {
        throw new AppError(400, 'Parent comment belongs to different video', 'INVALID_PARENT');
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId,
        videoId,
        content,
        parentId,
      },
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
      },
    });

    // Increment comments count on video
    await prisma.video.update({
      where: { id: videoId },
      data: { commentsCount: { increment: 1 } },
    });

    // Invalidate cache
    await cache.delete(`comments:video:${videoId}`);

    // TODO: Create notification for video owner (if not self-comment)
    if (video.userId !== userId && !parentId) {
      // Notify video owner about new comment
    }

    // TODO: Create notification for parent comment owner (if reply)
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true },
      });
      if (parentComment && parentComment.userId !== userId) {
        // Notify parent comment owner about reply
      }
    }

    return comment;
  }

  /**
   * Get comments for a video
   */
  static async getCommentsByVideo(
    videoId: string,
    page: number = 1,
    limit: number = 20,
    sortBy: 'recent' | 'popular' = 'recent'
  ) {
    const skip = (page - 1) * limit;

    // Try cache first
    const cacheKey = `comments:video:${videoId}:${page}:${limit}:${sortBy}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build order by
    const orderBy = sortBy === 'popular'
      ? { likesCount: 'desc' as const }
      : { createdAt: 'desc' as const };

    // Get top-level comments (no parent)
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          videoId,
          parentId: null,
          isDeleted: false,
        },
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
          replies: {
            take: 3, // Show first 3 replies
            orderBy: { createdAt: 'asc' },
            where: { isDeleted: false },
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
            },
          },
          _count: {
            select: {
              replies: {
                where: { isDeleted: false },
              },
            },
          },
        },
      }),
      prisma.comment.count({
        where: {
          videoId,
          parentId: null,
          isDeleted: false,
        },
      }),
    ]);

    const result = {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120);

    return result;
  }

  /**
   * Get replies for a comment
   */
  static async getReplies(
    commentId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          parentId: commentId,
          isDeleted: false,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
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
        },
      }),
      prisma.comment.count({
        where: {
          parentId: commentId,
          isDeleted: false,
        },
      }),
    ]);

    return {
      replies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update comment
   */
  static async updateComment(
    commentId: string,
    userId: string,
    data: UpdateCommentDTO
  ) {
    // Verify comment exists and user owns it
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND');
    }

    if (comment.userId !== userId) {
      throw new AppError(403, 'Unauthorized to edit this comment', 'UNAUTHORIZED');
    }

    if (comment.isDeleted) {
      throw new AppError(400, 'Cannot edit deleted comment', 'COMMENT_DELETED');
    }

    // Update comment
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: data.content,
        isEdited: true,
      },
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
      },
    });

    // Invalidate cache
    await cache.delete(`comments:video:${comment.videoId}`);

    return updated;
  }

  /**
   * Delete comment (soft delete)
   */
  static async deleteComment(commentId: string, userId: string) {
    // Verify comment exists and user owns it
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND');
    }

    if (comment.userId !== userId) {
      throw new AppError(403, 'Unauthorized to delete this comment', 'UNAUTHORIZED');
    }

    // Soft delete
    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true },
    });

    // Decrement comments count on video
    await prisma.video.update({
      where: { id: comment.videoId },
      data: { commentsCount: { decrement: 1 } },
    });

    // Invalidate cache
    await cache.delete(`comments:video:${comment.videoId}`);

    return { success: true };
  }

  /**
   * Toggle like on comment
   */
  static async toggleLike(commentId: string, userId: string) {
    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND');
    }

    // Check if user already liked
    // For simplicity, we'll track likes in a separate table (can be added to schema)
    // For now, we'll increment/decrement the count directly

    // This is a simplified version - in production, you'd want a separate CommentLike table
    const currentLikes = comment.likesCount;

    // Toggle logic (simplified)
    // In production, check if user has liked in a CommentLike table
    // For now, just increment
    await prisma.comment.update({
      where: { id: commentId },
      data: { likesCount: { increment: 1 } },
    });

    return { liked: true, likesCount: currentLikes + 1 };
  }

  /**
   * Pin comment (video owner only)
   */
  static async pinComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        video: {
          select: { userId: true },
        },
      },
    });

    if (!comment) {
      throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND');
    }

    // Only video owner can pin comments
    if (comment.video.userId !== userId) {
      throw new AppError(403, 'Only video owner can pin comments', 'UNAUTHORIZED');
    }

    // Unpin other comments on this video
    await prisma.comment.updateMany({
      where: {
        videoId: comment.videoId,
        isPinned: true,
      },
      data: { isPinned: false },
    });

    // Pin this comment
    await prisma.comment.update({
      where: { id: commentId },
      data: { isPinned: true },
    });

    // Invalidate cache
    await cache.delete(`comments:video:${comment.videoId}`);

    return { success: true };
  }
}
