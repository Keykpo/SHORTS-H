import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// All admin routes require authentication and admin access
router.use(authenticate, requireAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Admin
 */
router.get('/dashboard', AdminController.getDashboardStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering
 * @access  Admin
 */
router.get('/users', AdminController.getUsers);

/**
 * @route   GET /api/admin/videos
 * @desc    Get all videos with filtering
 * @access  Admin
 */
router.get('/videos', AdminController.getVideos);

/**
 * @route   DELETE /api/admin/videos/:videoId
 * @desc    Delete a video
 * @access  Admin
 */
router.delete('/videos/:videoId', AdminController.deleteVideo);

/**
 * @route   GET /api/admin/reports
 * @desc    Get all moderation reports
 * @access  Admin
 */
router.get('/reports', AdminController.getReports);

/**
 * @route   POST /api/admin/reports/:reportId/review
 * @desc    Review a report (resolve or dismiss)
 * @access  Admin
 */
router.post('/reports/:reportId/review', AdminController.reviewReport);

/**
 * @route   POST /api/admin/users/:userId/ban
 * @desc    Ban a user
 * @access  Admin
 */
router.post('/users/:userId/ban', AdminController.banUser);

/**
 * @route   POST /api/admin/users/:userId/unban
 * @desc    Unban a user
 * @access  Admin
 */
router.post('/users/:userId/unban', AdminController.unbanUser);

export default router;
