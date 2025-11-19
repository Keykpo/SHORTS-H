import { Router } from 'express';
import { WatchHistoryController } from '../controllers/watch-history.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';

const router = Router();

// All watch history routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/watch-history/progress
 * @desc    Update watch progress for a video
 * @access  Private
 */
router.post(
  '/progress',
  validate(schemas.updateWatchProgress),
  WatchHistoryController.updateProgress
);

/**
 * @route   GET /api/watch-history
 * @desc    Get user's watch history
 * @access  Private
 */
router.get('/', WatchHistoryController.getHistory);

/**
 * @route   GET /api/watch-history/continue
 * @desc    Get "Continue Watching" videos
 * @access  Private
 */
router.get('/continue', WatchHistoryController.getContinueWatching);

/**
 * @route   GET /api/watch-history/stats
 * @desc    Get watch statistics
 * @access  Private
 */
router.get('/stats', WatchHistoryController.getStats);

/**
 * @route   GET /api/watch-history/video/:videoId
 * @desc    Get progress for specific video
 * @access  Private
 */
router.get('/video/:videoId', WatchHistoryController.getVideoProgress);

/**
 * @route   DELETE /api/watch-history
 * @desc    Clear all watch history
 * @access  Private
 */
router.delete('/', WatchHistoryController.clearHistory);

/**
 * @route   DELETE /api/watch-history/video/:videoId
 * @desc    Remove specific video from history
 * @access  Private
 */
router.delete('/video/:videoId', WatchHistoryController.removeFromHistory);

export default router;
