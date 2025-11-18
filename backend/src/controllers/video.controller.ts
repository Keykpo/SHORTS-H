import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { VideoService } from '../services/video.service';
import { addVideoToQueue } from '../workers/video-processor';
import { getFileUrl } from '../middlewares/upload.middleware';
import { AppError } from '../middlewares/error.middleware';

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

      // Check if file was uploaded
      if (!req.file) {
        throw new AppError(400, 'No video file uploaded', 'NO_FILE');
      }

      const {
        title,
        description,
        isNsfw,
        nsfwLevel,
        tags,
        contentWarnings,
      } = req.body;

      // Parse tags if string
      const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      const parsedWarnings = typeof contentWarnings === 'string'
        ? JSON.parse(contentWarnings)
        : contentWarnings;

      // Get file path
      const filePath = req.file.path;
      const fileUrl = getFileUrl(filePath);

      // Create video record with UPLOADING status
      const video = await VideoService.createVideo({
        userId,
        title,
        description,
        isNsfw: isNsfw === 'true' || isNsfw === true,
        nsfwLevel: nsfwLevel || 'MODERATE',
        tags: parsedTags,
        contentWarnings: parsedWarnings || [],
        videoUrl: fileUrl, // Temporary URL, will be replaced after processing
        thumbnailUrl: 'https://cdn.example.com/thumbnails/processing.jpg', // Placeholder
        duration: 0, // Will be updated after processing
      });

      // Add to processing queue
      await addVideoToQueue(video.id, filePath, userId);

      res.status(202).json({
        success: true,
        message: 'Video uploaded and queued for processing',
        data: {
          id: video.id,
          status: video.status,
          title: video.title,
          message: 'Your video is being processed. This may take a few minutes.',
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get video processing status
   */
  static async getProcessingStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const video = await prisma.video.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          title: true,
          userId: true,
          createdAt: true,
          publishedAt: true,
        },
      });

      if (!video) {
        throw new AppError(404, 'Video not found', 'VIDEO_NOT_FOUND');
      }

      // Check ownership
      if (video.userId !== userId) {
        throw new AppError(403, 'Unauthorized', 'UNAUTHORIZED');
      }

      const statusMessages = {
        UPLOADING: 'Video is being uploaded',
        PROCESSING: 'Video is being processed (transcoding to multiple qualities)',
        READY: 'Video is ready and published',
        FAILED: 'Video processing failed. Please try uploading again.',
        DELETED: 'Video has been deleted',
      };

      res.status(200).json({
        success: true,
        data: {
          id: video.id,
          status: video.status,
          message: statusMessages[video.status],
          createdAt: video.createdAt,
          publishedAt: video.publishedAt,
        },
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
