import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/analytics/overview
 * @desc    Get creator dashboard overview
 * @access  Private (creator only)
 */
router.get('/overview', AnalyticsController.getOverview);

/**
 * @route   GET /api/analytics/demographics
 * @desc    Get audience demographics
 * @access  Private (creator only)
 */
router.get('/demographics', AnalyticsController.getDemographics);

/**
 * @route   GET /api/analytics/growth
 * @desc    Get growth analytics (followers, views over time)
 * @access  Private (creator only)
 */
router.get('/growth', AnalyticsController.getGrowth);

/**
 * @route   GET /api/analytics/best-time
 * @desc    Get best time to post analysis
 * @access  Private (creator only)
 */
router.get('/best-time', AnalyticsController.getBestTimeToPost);

/**
 * @route   GET /api/analytics/top-videos
 * @desc    Get top performing videos
 * @access  Private (creator only)
 */
router.get('/top-videos', AnalyticsController.getTopVideos);

/**
 * @route   GET /api/analytics/video/:videoId
 * @desc    Get detailed analytics for a specific video
 * @access  Private (video owner only)
 */
router.get('/video/:videoId', AnalyticsController.getVideoAnalytics);

export default router;
