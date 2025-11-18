import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { CommentService } from '../services/comment.service';

export class CommentController {
  /**
   * Create a new comment
   */
  static async createComment(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { videoId, content, parentId } = req.body;

      const comment = await CommentService.createComment({
        userId,
        videoId,
        content,
        parentId,
      });

      res.status(201).json({
        success: true,
        message: parentId ? 'Reply posted successfully' : 'Comment posted successfully',
        data: comment,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get comments for a video
   */
  static async getCommentsByVideo(req: AuthRequest, res: Response) {
    try {
      const { videoId } = req.params;
      const { page = 1, limit = 20, sortBy = 'recent' } = req.query;

      const result = await CommentService.getCommentsByVideo(
        videoId,
        Number(page),
        Number(limit),
        sortBy as 'recent' | 'popular'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get replies for a comment
   */
  static async getReplies(req: AuthRequest, res: Response) {
    try {
      const { commentId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await CommentService.getReplies(
        commentId,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update comment
   */
  static async updateComment(req: AuthRequest, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.userId!;
      const { content } = req.body;

      const comment = await CommentService.updateComment(commentId, userId, { content });

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: comment,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete comment
   */
  static async deleteComment(req: AuthRequest, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.userId!;

      await CommentService.deleteComment(commentId, userId);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle like on comment
   */
  static async toggleLike(req: AuthRequest, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.userId!;

      const result = await CommentService.toggleLike(commentId, userId);

      res.status(200).json({
        success: true,
        message: result.liked ? 'Comment liked' : 'Comment unliked',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Pin comment (video owner only)
   */
  static async pinComment(req: AuthRequest, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.userId!;

      await CommentService.pinComment(commentId, userId);

      res.status(200).json({
        success: true,
        message: 'Comment pinned successfully',
      });
    } catch (error) {
      throw error;
    }
  }
}
