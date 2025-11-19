import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PlaylistService } from '../services/playlist.service';
import { logger } from '../config/logger';

export class PlaylistController {
  /**
   * Create a new playlist
   */
  static async createPlaylist(req: AuthRequest, res: Response) {
    try {
      const { name, description, isPublic } = req.body;
      const userId = req.userId!;

      const playlist = await PlaylistService.createPlaylist({
        userId,
        name,
        description,
        isPublic,
      });

      res.status(201).json({
        success: true,
        data: playlist,
      });
    } catch (error) {
      logger.error('Failed to create playlist', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Get playlist by ID
   */
  static async getPlaylistById(req: AuthRequest, res: Response) {
    try {
      const { playlistId } = req.params;
      const userId = req.userId;

      const playlist = await PlaylistService.getPlaylistById(playlistId, userId);

      res.json({
        success: true,
        data: playlist,
      });
    } catch (error) {
      logger.error('Failed to get playlist', { error, playlistId: req.params.playlistId });
      throw error;
    }
  }

  /**
   * Get user's playlists
   */
  static async getUserPlaylists(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const requestingUserId = req.userId;

      const playlists = await PlaylistService.getUserPlaylists(userId, requestingUserId);

      res.json({
        success: true,
        data: playlists,
      });
    } catch (error) {
      logger.error('Failed to get user playlists', { error, userId: req.params.userId });
      throw error;
    }
  }

  /**
   * Get current user's playlists
   */
  static async getMyPlaylists(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      const playlists = await PlaylistService.getUserPlaylists(userId, userId);

      res.json({
        success: true,
        data: playlists,
      });
    } catch (error) {
      logger.error('Failed to get my playlists', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Update playlist
   */
  static async updatePlaylist(req: AuthRequest, res: Response) {
    try {
      const { playlistId } = req.params;
      const { name, description, isPublic } = req.body;
      const userId = req.userId!;

      const playlist = await PlaylistService.updatePlaylist(playlistId, userId, {
        name,
        description,
        isPublic,
      });

      res.json({
        success: true,
        data: playlist,
      });
    } catch (error) {
      logger.error('Failed to update playlist', { error, playlistId: req.params.playlistId });
      throw error;
    }
  }

  /**
   * Delete playlist
   */
  static async deletePlaylist(req: AuthRequest, res: Response) {
    try {
      const { playlistId } = req.params;
      const userId = req.userId!;

      await PlaylistService.deletePlaylist(playlistId, userId);

      res.json({
        success: true,
        message: 'Playlist deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete playlist', { error, playlistId: req.params.playlistId });
      throw error;
    }
  }

  /**
   * Add video to playlist
   */
  static async addVideoToPlaylist(req: AuthRequest, res: Response) {
    try {
      const { playlistId } = req.params;
      const { videoId } = req.body;
      const userId = req.userId!;

      const playlistVideo = await PlaylistService.addVideoToPlaylist({
        playlistId,
        videoId,
        userId,
      });

      res.status(201).json({
        success: true,
        data: playlistVideo,
        message: 'Video added to playlist',
      });
    } catch (error) {
      logger.error('Failed to add video to playlist', {
        error,
        playlistId: req.params.playlistId,
        videoId: req.body.videoId,
      });
      throw error;
    }
  }

  /**
   * Remove video from playlist
   */
  static async removeVideoFromPlaylist(req: AuthRequest, res: Response) {
    try {
      const { playlistId, videoId } = req.params;
      const userId = req.userId!;

      await PlaylistService.removeVideoFromPlaylist(playlistId, videoId, userId);

      res.json({
        success: true,
        message: 'Video removed from playlist',
      });
    } catch (error) {
      logger.error('Failed to remove video from playlist', {
        error,
        playlistId: req.params.playlistId,
        videoId: req.params.videoId,
      });
      throw error;
    }
  }

  /**
   * Reorder videos in playlist
   */
  static async reorderPlaylist(req: AuthRequest, res: Response) {
    try {
      const { playlistId } = req.params;
      const { videoOrders } = req.body; // Array of { videoId, position }
      const userId = req.userId!;

      await PlaylistService.reorderPlaylist(playlistId, userId, videoOrders);

      res.json({
        success: true,
        message: 'Playlist reordered successfully',
      });
    } catch (error) {
      logger.error('Failed to reorder playlist', {
        error,
        playlistId: req.params.playlistId,
      });
      throw error;
    }
  }

  /**
   * Get "Liked Videos" system playlist
   */
  static async getLikedVideosPlaylist(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      const playlist = await PlaylistService.getLikedVideosPlaylist(userId);

      res.json({
        success: true,
        data: playlist,
      });
    } catch (error) {
      logger.error('Failed to get liked videos playlist', { error, userId: req.userId });
      throw error;
    }
  }

  /**
   * Get public playlists (discover)
   */
  static async getPublicPlaylists(req: AuthRequest, res: Response) {
    try {
      const { page = '1', limit = '20' } = req.query;

      const result = await PlaylistService.getPublicPlaylists(
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to get public playlists', { error });
      throw error;
    }
  }
}
