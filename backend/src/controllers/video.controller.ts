import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { VideoService } from '../services/video.service';

export class VideoController {
  /**
   * Get video feed (infinite scroll)
   */
  static async getFeed(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, tags, nsfwOnly, sortBy } = req.query;

      const result = await VideoService.getVideoFeed({
        userId: req.userId,
        page: Number(page),
        limit: Number(limit),
        tags: tags ? String(tags).split(',') : undefined,
        nsfwOnly: nsfwOnly === 'true',
        sortBy: sortBy as 'recent' | 'popular' | 'trending',
        isAgeVerified: req.user?.isAgeVerified || false,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get video by ID
   */
  static async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const video = await VideoService.getVideoById(id, req.userId);

      res.status(200).json({
        success: true,
        data: video,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload new video
   */
  static async upload(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const {
        title,
        description,
        isNsfw,
        nsfwLevel,
        tags,
        contentWarnings,
      } = req.body;

      // In a real implementation, you would handle the actual file upload here
      // For this prototype, we'll simulate with placeholder URLs
      const videoUrl = 'https://cdn.example.com/videos/placeholder.mp4';
      const thumbnailUrl = 'https://cdn.example.com/thumbnails/placeholder.jpg';

      const video = await VideoService.createVideo({
        userId,
        title,
        description,
        isNsfw: isNsfw ?? true,
        nsfwLevel: nsfwLevel || 'MODERATE',
        tags,
        contentWarnings,
        videoUrl,
        thumbnailUrl,
        duration: 30, // Placeholder duration
      });

      res.status(201).json({
        success: true,
        message: 'Video uploaded successfully',
        data: video,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record video view
   */
  static async recordView(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { watchDuration } = req.body;

      await VideoService.recordView(id, req.userId, watchDuration);

      res.status(200).json({
        success: true,
        message: 'View recorded',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle like on video
   */
  static async toggleLike(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const result = await VideoService.toggleLike(id, userId);

      res.status(200).json({
        success: true,
        message: result.liked ? 'Video liked' : 'Video unliked',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's uploaded videos
   */
  static async getUserVideos(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          where: {
            userId,
            status: 'READY',
          },
          skip,
          take: Number(limit),
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
        }),
        prisma.video.count({
          where: {
            userId,
            status: 'READY',
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          videos,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }
}

import { prisma } from '../config/database';
