import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { RecommendationService } from '../services/recommendation.service';
import { logger } from '../config/logger';

export class RecommendationController {
  /**
   * Get "For You" personalized feed
   */
  static async getForYou(req: AuthRequest, res: Response) {
    try {
      const { limit = '20' } = req.query;
      const userId = req.userId; // Optional auth

      const recommendations = await RecommendationService.getForYouFeed(
        userId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      logger.error('Failed to get For You feed', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Get similar videos to a specific video
   */
  static async getSimilarVideos(req: AuthRequest, res: Response) {
    try {
      const { videoId } = req.params;
      const { limit = '10' } = req.query;

      const similar = await RecommendationService.getSimilarVideos(
        videoId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: similar,
      });
    } catch (error) {
      logger.error('Failed to get similar videos', {
        error,
        videoId: req.params.videoId,
      });
      throw error;
    }
  }
}
