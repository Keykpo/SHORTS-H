import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { WatchHistoryService } from '../services/watch-history.service';
import { logger } from '../config/logger';

export class WatchHistoryController {
  /**
   * Update watch progress
   */
  static async updateProgress(req: AuthRequest, res: Response) {
    try {
      const { videoId, watchedDuration, totalDuration } = req.body;
      const userId = req.userId!;

      const watchHistory = await WatchHistoryService.updateWatchProgress({
        userId,
        videoId,
        watchedDuration,
        totalDuration,
      });

      res.json({
        success: true,
        data: watchHistory,
      });
    } catch (error) {
      logger.error('Failed to update watch progress', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Get watch history
   */
  static async getHistory(req: AuthRequest, res: Response) {
    try {
      const { page = '1', limit = '20' } = req.query;
      const userId = req.userId!;

      const result = await WatchHistoryService.getWatchHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to get watch history', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Get "Continue Watching" videos
   */
  static async getContinueWatching(req: AuthRequest, res: Response) {
    try {
      const { limit = '10' } = req.query;
      const userId = req.userId!;

      const continueWatching = await WatchHistoryService.getContinueWatching(
        userId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: continueWatching,
      });
    } catch (error) {
      logger.error('Failed to get continue watching', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Get progress for specific video
   */
  static async getVideoProgress(req: AuthRequest, res: Response) {
    try {
      const { videoId } = req.params;
      const userId = req.userId!;

      const progress = await WatchHistoryService.getVideoProgress(userId, videoId);

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      logger.error('Failed to get video progress', {
        error,
        videoId: req.params.videoId,
      });
      throw error;
    }
  }

  /**
   * Clear all watch history
   */
  static async clearHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      const result = await WatchHistoryService.clearWatchHistory(userId);

      res.json({
        success: true,
        message: 'Watch history cleared',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to clear watch history', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Remove specific video from history
   */
  static async removeFromHistory(req: AuthRequest, res: Response) {
    try {
      const { videoId } = req.params;
      const userId = req.userId!;

      await WatchHistoryService.removeFromHistory(userId, videoId);

      res.json({
        success: true,
        message: 'Video removed from watch history',
      });
    } catch (error) {
      logger.error('Failed to remove from watch history', {
        error,
        videoId: req.params.videoId,
      });
      throw error;
    }
  }

  /**
   * Get watch statistics
   */
  static async getStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      const stats = await WatchHistoryService.getWatchStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get watch stats', { error, userId: req.userId });
      throw error;
    }
  }
}
