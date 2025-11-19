import { Request, Response, NextFunction } from 'express';
import { DonationService } from '../services/donation.service';
import { z } from 'zod';

const createDonationSchema = z.object({
  receiverId: z.string(),
  amount: z.number().min(1).max(10000),
  message: z.string().max(500).optional(),
  videoId: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

const leaderboardSchema = z.object({
  timeframe: z.enum(['all', 'month', 'week']).optional().default('all'),
});

export class DonationController {
  /**
   * POST /api/donations
   * Create a donation
   * Note: Actual payment should be processed via Stripe
   */
  static async createDonation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const body = createDonationSchema.parse(req.body);

      // Validate sender is not donating to themselves
      if (body.receiverId === userId) {
        return res.status(400).json({ error: 'Cannot donate to yourself' });
      }

      const donation = await DonationService.createDonation({
        senderId: userId,
        ...body,
      });

      res.status(201).json(donation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/received
   * Get donations received by current user
   */
  static async getReceivedDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const donations = await DonationService.getReceivedDonations(userId, { limit, offset });

      res.json(donations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/sent
   * Get donations sent by current user
   */
  static async getSentDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const donations = await DonationService.getSentDonations(userId, { limit, offset });

      res.json(donations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/leaderboard/:userId
   * Get donation leaderboard for a creator
   */
  static async getDonationLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const receiverId = req.params.userId;
      const { timeframe } = leaderboardSchema.parse(req.query);

      const leaderboard = await DonationService.getDonationLeaderboard(receiverId, timeframe);

      res.json(leaderboard);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/stats
   * Get donation statistics for current user
   */
  static async getDonationStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const stats = await DonationService.getDonationStats(userId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/recent-messages/:userId
   * Get recent donations with messages for a creator
   */
  static async getRecentMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const receiverId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 5;

      const messages = await DonationService.getRecentDonationsWithMessages(receiverId, limit);

      res.json(messages);
    } catch (error) {
      next(error);
    }
  }
}
