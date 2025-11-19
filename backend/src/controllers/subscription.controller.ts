import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  plan: z.enum(['MONTHLY', 'YEARLY']),
});

const cancelSubscriptionSchema = z.object({
  cancelImmediately: z.boolean().optional().default(false),
});

export class SubscriptionController {
  /**
   * GET /api/subscriptions/pricing
   * Get subscription pricing plans
   */
  static async getPricing(req: Request, res: Response, next: NextFunction) {
    try {
      const pricing = SubscriptionService.getPricing();
      res.json(pricing);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscriptions/me
   * Get current user's subscription
   */
  static async getMySubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const subscription = await SubscriptionService.getUserSubscription(userId);

      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      res.json(subscription);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subscriptions
   * Create new subscription
   * Note: This creates the DB record. Payment processing should be done via Stripe webhooks
   */
  static async createSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const body = createSubscriptionSchema.parse(req.body);

      // Check if user already has active subscription
      const existingSubscription = await SubscriptionService.getUserSubscription(userId);
      if (existingSubscription) {
        return res.status(400).json({ error: 'You already have an active subscription' });
      }

      const subscription = await SubscriptionService.createSubscription({
        userId,
        plan: body.plan,
      });

      res.status(201).json(subscription);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subscriptions/:id/cancel
   * Cancel subscription
   */
  static async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const subscriptionId = req.params.id;
      const body = cancelSubscriptionSchema.parse(req.body);

      // Verify ownership
      const subscription = await SubscriptionService.getUserSubscription(req.user!.id);
      if (!subscription || subscription.id !== subscriptionId) {
        return res.status(403).json({ error: 'Not authorized to cancel this subscription' });
      }

      const canceledSubscription = await SubscriptionService.cancelSubscription(
        subscriptionId,
        body.cancelImmediately
      );

      res.json({
        message: body.cancelImmediately
          ? 'Subscription canceled immediately'
          : 'Subscription will be canceled at the end of the billing period',
        subscription: canceledSubscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subscriptions/:id/reactivate
   * Reactivate canceled subscription
   */
  static async reactivateSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const subscriptionId = req.params.id;

      const subscription = await SubscriptionService.reactivateSubscription(subscriptionId);

      res.json({
        message: 'Subscription reactivated successfully',
        subscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscriptions/history
   * Get subscription history
   */
  static async getSubscriptionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const history = await SubscriptionService.getSubscriptionHistory(userId);

      res.json(history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscriptions/analytics (Admin only)
   * Get subscription analytics
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is admin
      if (!req.user!.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const analytics = await SubscriptionService.getSubscriptionAnalytics();

      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }
}
