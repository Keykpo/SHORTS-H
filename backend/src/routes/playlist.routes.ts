import { Router } from 'express';
import { PlaylistController } from '../controllers/playlist.controller';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';

const router = Router();

/**
 * @route   GET /api/playlists/discover
 * @desc    Get public playlists (discover page)
 * @access  Public
 */
router.get('/discover', optionalAuth, PlaylistController.getPublicPlaylists);

/**
 * @route   GET /api/playlists/me
 * @desc    Get current user's playlists
 * @access  Private
 */
router.get('/me', authenticate, PlaylistController.getMyPlaylists);

/**
 * @route   GET /api/playlists/liked
 * @desc    Get "Liked Videos" system playlist
 * @access  Private
 */
router.get('/liked', authenticate, PlaylistController.getLikedVideosPlaylist);

/**
 * @route   POST /api/playlists
 * @desc    Create a new playlist
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(schemas.createPlaylist),
  PlaylistController.createPlaylist
);

/**
 * @route   GET /api/playlists/:playlistId
 * @desc    Get playlist by ID with all videos
 * @access  Public (if public) / Private (if private, owner only)
 */
router.get('/:playlistId', optionalAuth, PlaylistController.getPlaylistById);

/**
 * @route   PUT /api/playlists/:playlistId
 * @desc    Update playlist
 * @access  Private (owner only)
 */
router.put(
  '/:playlistId',
  authenticate,
  validate(schemas.updatePlaylist),
  PlaylistController.updatePlaylist
);

/**
 * @route   DELETE /api/playlists/:playlistId
 * @desc    Delete playlist
 * @access  Private (owner only)
 */
router.delete('/:playlistId', authenticate, PlaylistController.deletePlaylist);

/**
 * @route   POST /api/playlists/:playlistId/videos
 * @desc    Add video to playlist
 * @access  Private (owner only)
 */
router.post(
  '/:playlistId/videos',
  authenticate,
  validate(schemas.addVideoToPlaylist),
  PlaylistController.addVideoToPlaylist
);

/**
 * @route   DELETE /api/playlists/:playlistId/videos/:videoId
 * @desc    Remove video from playlist
 * @access  Private (owner only)
 */
router.delete(
  '/:playlistId/videos/:videoId',
  authenticate,
  PlaylistController.removeVideoFromPlaylist
);

/**
 * @route   PUT /api/playlists/:playlistId/reorder
 * @desc    Reorder videos in playlist
 * @access  Private (owner only)
 */
router.put(
  '/:playlistId/reorder',
  authenticate,
  validate(schemas.reorderPlaylist),
  PlaylistController.reorderPlaylist
);

/**
 * @route   GET /api/playlists/user/:userId
 * @desc    Get user's public playlists (or all if own)
 * @access  Public
 */
router.get('/user/:userId', optionalAuth, PlaylistController.getUserPlaylists);

export default router;
