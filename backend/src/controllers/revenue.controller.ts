import { Request, Response, NextFunction } from 'express';
import { RevenueService } from '../services/revenue.service';
import { z } from 'zod';

const getRevenueHistorySchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  type: z.enum(['DONATION', 'AD_REVENUE', 'SUBSCRIPTION_SHARE', 'TIP']).optional(),
  isPaid: z.boolean().optional(),
});

const getPeriodSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
});

export class RevenueController {
  /**
   * GET /api/revenue/summary
   * Get user's revenue summary
   */
  static async getRevenueSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const summary = await RevenueService.getUserRevenue(userId);

      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/revenue/history
   * Get revenue history
   */
  static async getRevenueHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const query = getRevenueHistorySchema.parse({
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        type: req.query.type,
        isPaid: req.query.isPaid === 'true',
      });

      const history = await RevenueService.getRevenueHistory(userId, query);

      res.json(history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/revenue/by-period
   * Get revenue grouped by time period
   */
  static async getRevenueByPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { period } = getPeriodSchema.parse(req.query);

      const revenue = await RevenueService.getRevenueByPeriod(userId, period);

      res.json(revenue);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/revenue/analytics
   * Get revenue analytics for dashboard
   */
  static async getRevenueAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const analytics = await RevenueService.getRevenueAnalytics(userId);

      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/revenue/withdrawal-info
   * Get withdrawal information
   */
  static async getWithdrawalInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const info = await RevenueService.getWithdrawalInfo(userId);

      res.json(info);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/revenue/monthly-chart
   * Get monthly earnings chart data
   */
  static async getMonthlyChart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const months = parseInt(req.query.months as string) || 12;

      const chartData = await RevenueService.getMonthlyEarningsChart(userId, months);

      res.json(chartData);
    } catch (error) {
      next(error);
    }
  }
}
