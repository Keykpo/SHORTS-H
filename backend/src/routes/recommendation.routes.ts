import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/recommendations/for-you
 * @desc    Get personalized "For You" feed
 * @access  Public (better with auth)
 */
router.get('/for-you', optionalAuth, RecommendationController.getForYou);

/**
 * @route   GET /api/recommendations/similar/:videoId
 * @desc    Get videos similar to a specific video
 * @access  Public
 */
router.get('/similar/:videoId', optionalAuth, RecommendationController.getSimilarVideos);

export default router;
