import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';

export class UserController {
  static async followUser(req: AuthRequest, res: Response) {
    try {
      const followerId = req.userId!;
      const { userId } = req.params;

      await UserService.followUser(followerId, userId);

      res.status(200).json({
        success: true,
        message: 'User followed successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  static async unfollowUser(req: AuthRequest, res: Response) {
    try {
      const followerId = req.userId!;
      const { userId } = req.params;

      await UserService.unfollowUser(followerId, userId);

      res.status(200).json({
        success: true,
        message: 'User unfollowed successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  static async getFollowers(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await UserService.getFollowers(userId, Number(page), Number(limit));

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getFollowing(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await UserService.getFollowing(userId, Number(page), Number(limit));

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getUserProfile(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = req.userId;

      const profile = await UserService.getUserProfile(userId, currentUserId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      throw error;
    }
  }
}
