import { Router } from 'express';
import { ShareController } from '../controllers/share.controller';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/share/playlist/:playlistId
 * @desc    Generate shareable link for a playlist
 * @access  Private (owner or public playlist)
 */
router.post('/playlist/:playlistId', authenticate, ShareController.generatePlaylistShareLink);

/**
 * @route   GET /api/share/playlist/:shareCode
 * @desc    Get playlist by share code
 * @access  Public
 */
router.get('/playlist/:shareCode', optionalAuth, ShareController.getPlaylistByShareCode);

/**
 * @route   POST /api/share/playlist/:playlistId/track
 * @desc    Track share event
 * @access  Public
 */
router.post('/playlist/:playlistId/track', ShareController.trackShare);

/**
 * @route   GET /api/share/playlist/:shareCode/meta
 * @desc    Get Open Graph meta tags for playlist
 * @access  Public
 */
router.get('/playlist/:shareCode/meta', ShareController.getPlaylistMetaTags);

/**
 * @route   POST /api/share/video/:videoId
 * @desc    Generate shareable link for a video
 * @access  Public
 */
router.post('/video/:videoId', ShareController.generateVideoShareLink);

/**
 * @route   GET /api/share/video/:videoId/meta
 * @desc    Get Open Graph meta tags for video
 * @access  Public
 */
router.get('/video/:videoId/meta', ShareController.getVideoMetaTags);

export default router;
