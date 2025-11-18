import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/comments
 * @desc    Create a new comment or reply
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  CommentController.createComment
);

/**
 * @route   GET /api/comments/video/:videoId
 * @desc    Get comments for a video
 * @access  Public
 */
router.get(
  '/video/:videoId',
  optionalAuth,
  CommentController.getCommentsByVideo
);

/**
 * @route   GET /api/comments/:commentId/replies
 * @desc    Get replies for a comment
 * @access  Public
 */
router.get(
  '/:commentId/replies',
  optionalAuth,
  CommentController.getReplies
);

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update comment
 * @access  Private (owner only)
 */
router.put(
  '/:commentId',
  authenticate,
  CommentController.updateComment
);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete comment
 * @access  Private (owner only)
 */
router.delete(
  '/:commentId',
  authenticate,
  CommentController.deleteComment
);

/**
 * @route   POST /api/comments/:commentId/like
 * @desc    Toggle like on comment
 * @access  Private
 */
router.post(
  '/:commentId/like',
  authenticate,
  CommentController.toggleLike
);

/**
 * @route   POST /api/comments/:commentId/pin
 * @desc    Pin comment (video owner only)
 * @access  Private
 */
router.post(
  '/:commentId/pin',
  authenticate,
  CommentController.pinComment
);

export default router;
