import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class SubscriptionService {
  /**
   * Get subscription pricing
   */
  static getPricing() {
    return {
      monthly: {
        plan: 'MONTHLY',
        amount: 9.99,
        currency: 'USD',
        benefits: [
          'Ad-free experience',
          'Unlimited uploads',
          'Exclusive content access',
          'Premium badge',
          'Priority support',
          'Early access to new features',
        ],
      },
      yearly: {
        plan: 'YEARLY',
        amount: 99.99,
        currency: 'USD',
        savings: 19.89, // 2 months free
        benefits: [
          'All monthly benefits',
          '2 months free',
          'Exclusive yearly subscriber badge',
          'Priority creator features',
        ],
      },
    };
  }

  /**
   * Get user's active subscription
   */
  static async getUserSubscription(userId: string) {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        currentPeriodEnd: {
          gte: new Date(),
        },
      },
      include: {
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });
  }

  /**
   * Create subscription
   */
  static async createSubscription(data: {
    userId: string;
    plan: SubscriptionPlan;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
  }) {
    const pricing = this.getPricing();
    const planPricing = data.plan === 'MONTHLY' ? pricing.monthly : pricing.yearly;

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();

    if (data.plan === 'MONTHLY') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: data.userId,
        plan: data.plan,
        status: 'ACTIVE',
        amount: planPricing.amount,
        currency: planPricing.currency,
        currentPeriodStart,
        currentPeriodEnd,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeCustomerId: data.stripeCustomerId,
      },
    });

    // Update user premium status
    await prisma.user.update({
      where: { id: data.userId },
      data: { isPremium: true },
    });

    return subscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, cancelImmediately: boolean = false) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (cancelImmediately) {
      // Cancel immediately
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });

      // Remove premium status
      await prisma.user.update({
        where: { id: subscription.userId },
        data: { isPremium: false },
      });
    } else {
      // Cancel at period end
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true,
        },
      });
    }

    return subscription;
  }

  /**
   * Reactivate canceled subscription
   */
  static async reactivateSubscription(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'CANCELED' && !subscription.cancelAtPeriodEnd) {
      throw new Error('Subscription is not canceled');
    }

    // Check if period has ended
    if (new Date() > subscription.currentPeriodEnd) {
      throw new Error('Subscription period has ended. Please create a new subscription.');
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    return subscription;
  }

  /**
   * Update subscription status (for webhooks)
   */
  static async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status },
    });

    // Update user premium status
    if (status === 'ACTIVE') {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: { isPremium: true },
      });
    } else if (status === 'CANCELED' || status === 'EXPIRED') {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: { isPremium: false },
      });
    }

    return subscription;
  }

  /**
   * Renew subscription
   */
  static async renewSubscription(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newPeriodStart = subscription.currentPeriodEnd;
    const newPeriodEnd = new Date(newPeriodStart);

    if (subscription.plan === 'MONTHLY') {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    } else {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    }

    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get subscription history
   */
  static async getSubscriptionHistory(userId: string) {
    return await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get subscription analytics
   */
  static async getSubscriptionAnalytics() {
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });

    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        type: 'SUBSCRIPTION',
        status: 'SUCCEEDED',
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
      _sum: {
        amount: true,
      },
    });

    const subscriptionsByPlan = await prisma.subscription.groupBy({
      by: ['plan'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    return {
      activeSubscriptions,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      subscriptionsByPlan,
    };
  }
}
