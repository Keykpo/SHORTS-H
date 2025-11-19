import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ShareService } from '../services/share.service';
import { logger } from '../config/logger';

export class ShareController {
  /**
   * Generate share link for playlist
   */
  static async generatePlaylistShareLink(req: AuthRequest, res: Response) {
    try {
      const { playlistId } = req.params;
      const userId = req.userId!;

      const shareData = await ShareService.generatePlaylistShareLink(playlistId, userId);

      res.json({
        success: true,
        data: shareData,
      });
    } catch (error) {
      logger.error('Failed to generate playlist share link', {
        error,
        playlistId: req.params.playlistId,
      });
      throw error;
    }
  }

  /**
   * Get playlist by share code
   */
  static async getPlaylistByShareCode(req: AuthRequest, res: Response) {
    try {
      const { shareCode } = req.params;

      const playlist = await ShareService.getPlaylistByShareCode(shareCode);

      res.json({
        success: true,
        data: playlist,
      });
    } catch (error) {
      logger.error('Failed to get playlist by share code', {
        error,
        shareCode: req.params.shareCode,
      });
      throw error;
    }
  }

  /**
   * Track share event
   */
  static async trackShare(req: AuthRequest, res: Response) {
    try {
      const { playlistId } = req.params;
      const { platform } = req.body;

      await ShareService.trackShare(playlistId, platform);

      res.json({
        success: true,
        message: 'Share tracked',
      });
    } catch (error) {
      logger.error('Failed to track share', { error, playlistId: req.params.playlistId });
      throw error;
    }
  }

  /**
   * Get playlist meta tags for Open Graph
   */
  static async getPlaylistMetaTags(req: AuthRequest, res: Response) {
    try {
      const { shareCode } = req.params;

      const metaTags = await ShareService.getPlaylistMetaTags(shareCode);

      res.json({
        success: true,
        data: metaTags,
      });
    } catch (error) {
      logger.error('Failed to get playlist meta tags', {
        error,
        shareCode: req.params.shareCode,
      });
      throw error;
    }
  }

  /**
   * Generate share link for video
   */
  static async generateVideoShareLink(req: AuthRequest, res: Response) {
    try {
      const { videoId } = req.params;

      const shareData = await ShareService.generateVideoShareLink(videoId);

      res.json({
        success: true,
        data: shareData,
      });
    } catch (error) {
      logger.error('Failed to generate video share link', {
        error,
        videoId: req.params.videoId,
      });
      throw error;
    }
  }

  /**
   * Get video meta tags for Open Graph
   */
  static async getVideoMetaTags(req: AuthRequest, res: Response) {
    try {
      const { videoId } = req.params;

      const metaTags = await ShareService.getVideoMetaTags(videoId);

      res.json({
        success: true,
        data: metaTags,
      });
    } catch (error) {
      logger.error('Failed to get video meta tags', { error, videoId: req.params.videoId });
      throw error;
    }
  }
}
