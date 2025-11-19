import { Router } from 'express';
import { VideoController } from '../controllers/video.controller';
import {
  authenticate,
  optionalAuth,
  requireAgeVerification,
} from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';
import { uploadVideo } from '../middlewares/upload.middleware';
import { uploadRateLimit } from '../middlewares/rate-limit.middleware';

const router = Router();

/**
 * @route   GET /api/videos/feed
 * @desc    Get video feed (infinite scroll)
 * @access  Public (but filtered by age verification)
 */
router.get(
  '/feed',
  optionalAuth,
  validate(schemas.videoFeed),
  VideoController.getFeed
);

/**
 * @route   GET /api/videos/:id
 * @desc    Get video by ID
 * @access  Public (but NSFW requires age verification)
 */
router.get(
  '/:id',
  optionalAuth,
  validate(schemas.videoId),
  VideoController.getById
);

/**
 * @route   POST /api/videos/upload
 * @desc    Upload new video
 * @access  Private (requires age verification)
 */
router.post(
  '/upload',
  authenticate,
  requireAgeVerification,
  uploadRateLimit,
  uploadVideo,
  VideoController.upload
);

/**
 * @route   GET /api/videos/:id/status
 * @desc    Get video processing status
 * @access  Private (owner only)
 */
router.get(
  '/:id/status',
  authenticate,
  VideoController.getProcessingStatus
);

/**
 * @route   POST /api/videos/:id/view
 * @desc    Record video view
 * @access  Public (optional auth)
 */
router.post(
  '/:id/view',
  optionalAuth,
  validate(schemas.videoId),
  VideoController.recordView
);

/**
 * @route   POST /api/videos/:id/like
 * @desc    Toggle like on video
 * @access  Private
 */
router.post(
  '/:id/like',
  authenticate,
  validate(schemas.videoId),
  VideoController.toggleLike
);

/**
 * @route   GET /api/videos/user/:userId
 * @desc    Get user's uploaded videos
 * @access  Public
 */
router.get(
  '/user/:userId',
  optionalAuth,
  VideoController.getUserVideos
);

export default router;
