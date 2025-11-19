import { prisma } from '../config/database';
import { NotificationType } from '@prisma/client';
import { getSocketService } from './socket.service';

interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  imageUrl?: string;
}

export class NotificationService {
  /**
   * Create notification
   */
  static async createNotification(data: CreateNotificationDTO) {
    const notification = await prisma.notification.create({
      data,
    });

    // Send real-time notification via Socket.IO
    try {
      const socketService = getSocketService();
      socketService.sendNotification(data.userId, notification);
    } catch (error) {
      console.error('[Notification] Socket service not available:', error);
    }

    return notification;
  }

  /**
   * Notify user about new follower
   */
  static async notifyNewFollower(userId: string, followerId: string, followerUsername: string) {
    return this.createNotification({
      userId,
      type: 'NEW_FOLLOWER',
      title: 'New Follower',
      message: `${followerUsername} started following you`,
      actionUrl: `/users/${followerId}`,
    });
  }

  /**
   * Notify user about new comment
   */
  static async notifyNewComment(
    userId: string,
    videoId: string,
    commenterId: string,
    commenterUsername: string,
    videoTitle: string
  ) {
    return this.createNotification({
      userId,
      type: 'NEW_COMMENT',
      title: 'New Comment',
      message: `${commenterUsername} commented on "${videoTitle}"`,
      actionUrl: `/video/${videoId}`,
    });
  }

  /**
   * Notify user about comment reply
   */
  static async notifyCommentReply(
    userId: string,
    videoId: string,
    replierId: string,
    replierUsername: string
  ) {
    return this.createNotification({
      userId,
      type: 'COMMENT_REPLY',
      title: 'New Reply',
      message: `${replierUsername} replied to your comment`,
      actionUrl: `/video/${videoId}`,
    });
  }

  /**
   * Notify user about video like
   */
  static async notifyVideoLike(
    userId: string,
    videoId: string,
    likerId: string,
    likerUsername: string,
    videoTitle: string
  ) {
    return this.createNotification({
      userId,
      type: 'VIDEO_LIKE',
      title: 'New Like',
      message: `${likerUsername} liked your video "${videoTitle}"`,
      actionUrl: `/video/${videoId}`,
    });
  }

  /**
   * Notify user that video processing is complete
   */
  static async notifyVideoProcessed(userId: string, videoId: string, videoTitle: string) {
    return this.createNotification({
      userId,
      type: 'VIDEO_PROCESSED',
      title: 'Video Ready',
      message: `Your video "${videoTitle}" has been processed and is now live!`,
      actionUrl: `/video/${videoId}`,
    });
  }

  /**
   * System alert notification
   */
  static async notifySystemAlert(userId: string, title: string, message: string) {
    return this.createNotification({
      userId,
      type: 'SYSTEM_ALERT',
      title,
      message,
    });
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}
