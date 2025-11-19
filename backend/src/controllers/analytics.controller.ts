import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../config/logger';

export class AnalyticsController {
  /**
   * Get creator dashboard overview
   */
  static async getOverview(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      const overview = await AnalyticsService.getCreatorOverview(userId);

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      logger.error('Failed to get analytics overview', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Get video analytics
   */
  static async getVideoAnalytics(req: AuthRequest, res: Response) {
    try {
      const { videoId } = req.params;
      const userId = req.userId!;

      const analytics = await AnalyticsService.getVideoAnalytics(videoId, userId);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Failed to get video analytics', {
        error,
        videoId: req.params.videoId,
      });
      throw error;
    }
  }

  /**
   * Get audience demographics
   */
  static async getDemographics(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      const demographics = await AnalyticsService.getAudienceDemographics(userId);

      res.json({
        success: true,
        data: demographics,
      });
    } catch (error) {
      logger.error('Failed to get demographics', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Get growth analytics
   */
  static async getGrowth(req: AuthRequest, res: Response) {
    try {
      const { days = '30' } = req.query;
      const userId = req.userId!;

      const growth = await AnalyticsService.getGrowthAnalytics(
        userId,
        parseInt(days as string)
      );

      res.json({
        success: true,
        data: growth,
      });
    } catch (error) {
      logger.error('Failed to get growth analytics', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Get best time to post
   */
  static async getBestTimeToPost(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      const bestTime = await AnalyticsService.getBestTimeToPost(userId);

      res.json({
        success: true,
        data: bestTime,
      });
    } catch (error) {
      logger.error('Failed to get best time to post', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Get top performing videos
   */
  static async getTopVideos(req: AuthRequest, res: Response) {
    try {
      const { limit = '10', metric = 'views' } = req.query;
      const userId = req.userId!;

      const topVideos = await AnalyticsService.getTopVideos(
        userId,
        parseInt(limit as string),
        metric as 'views' | 'likes' | 'engagement'
      );

      res.json({
        success: true,
        data: topVideos,
      });
    } catch (error) {
      logger.error('Failed to get top videos', { error, userId: req.userId });
      throw error;
    }
  }
}
