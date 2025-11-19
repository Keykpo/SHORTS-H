import { PrismaClient, RevenueType } from '@prisma/client';

const prisma = new PrismaClient();

export class RevenueService {
  /**
   * Create revenue record
   */
  static async createRevenue(data: {
    userId: string;
    type: RevenueType;
    amount: number;
    currency?: string;
    sourceId?: string;
    videoId?: string;
    description?: string;
  }) {
    return await prisma.revenue.create({
      data: {
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        currency: data.currency || 'USD',
        sourceId: data.sourceId,
        videoId: data.videoId,
        description: data.description,
      },
    });
  }

  /**
   * Get user revenue summary
   */
  static async getUserRevenue(userId: string) {
    const totalRevenue = await prisma.revenue.aggregate({
      where: { userId },
      _sum: {
        amount: true,
      },
    });

    const paidRevenue = await prisma.revenue.aggregate({
      where: {
        userId,
        isPaid: true,
      },
      _sum: {
        amount: true,
      },
    });

    const pendingRevenue = await prisma.revenue.aggregate({
      where: {
        userId,
        isPaid: false,
      },
      _sum: {
        amount: true,
      },
    });

    const revenueByType = await prisma.revenue.groupBy({
      by: ['type'],
      where: { userId },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      paidRevenue: paidRevenue._sum.amount || 0,
      pendingRevenue: pendingRevenue._sum.amount || 0,
      revenueByType,
    };
  }

  /**
   * Get revenue breakdown by time period
   */
  static async getRevenueByPeriod(
    userId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    const revenue = await prisma.revenue.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by date
    const revenueByDate = revenue.reduce((acc, rev) => {
      const date = rev.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          amount: 0,
          count: 0,
        };
      }
      acc[date].amount += Number(rev.amount);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; amount: number; count: number }>);

    return Object.values(revenueByDate).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get revenue history
   */
  static async getRevenueHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: RevenueType;
      isPaid?: boolean;
    }
  ) {
    return await prisma.revenue.findMany({
      where: {
        userId,
        ...(options?.type && { type: options.type }),
        ...(options?.isPaid !== undefined && { isPaid: options.isPaid }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Mark revenue as paid
   */
  static async markRevenuePaid(revenueIds: string[]) {
    return await prisma.revenue.updateMany({
      where: {
        id: {
          in: revenueIds,
        },
      },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });
  }

  /**
   * Get revenue analytics for dashboard
   */
  static async getRevenueAnalytics(userId: string) {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // This month revenue
    const thisMonthRevenue = await prisma.revenue.aggregate({
      where: {
        userId,
        createdAt: {
          gte: thisMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Last month revenue
    const lastMonthRevenue = await prisma.revenue.aggregate({
      where: {
        userId,
        createdAt: {
          gte: lastMonth,
          lte: lastMonthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate growth
    const thisMonthAmount = Number(thisMonthRevenue._sum.amount || 0);
    const lastMonthAmount = Number(lastMonthRevenue._sum.amount || 0);
    const growth =
      lastMonthAmount > 0 ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 : 0;

    // Top performing videos
    const topVideos = await prisma.revenue.groupBy({
      by: ['videoId'],
      where: {
        userId,
        videoId: {
          not: null,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 10,
    });

    return {
      thisMonth: thisMonthAmount,
      lastMonth: lastMonthAmount,
      growth,
      topVideos,
    };
  }

  /**
   * Get withdrawal information
   */
  static async getWithdrawalInfo(userId: string) {
    const pendingRevenue = await prisma.revenue.aggregate({
      where: {
        userId,
        isPaid: false,
      },
      _sum: {
        amount: true,
      },
    });

    const minimumWithdrawal = 50; // $50 minimum
    const canWithdraw = Number(pendingRevenue._sum.amount || 0) >= minimumWithdrawal;

    // Get last payout date
    const lastPayout = await prisma.revenue.findFirst({
      where: {
        userId,
        isPaid: true,
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    return {
      availableAmount: pendingRevenue._sum.amount || 0,
      minimumWithdrawal,
      canWithdraw,
      lastPayoutDate: lastPayout?.paidAt,
    };
  }

  /**
   * Get monthly earnings chart data
   */
  static async getMonthlyEarningsChart(userId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const revenue = await prisma.revenue.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by month
    const monthlyData = revenue.reduce((acc, rev) => {
      const month = rev.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          month,
          donation: 0,
          adRevenue: 0,
          subscriptionShare: 0,
          tip: 0,
          total: 0,
        };
      }

      const amount = Number(rev.amount);
      acc[month].total += amount;

      switch (rev.type) {
        case 'DONATION':
          acc[month].donation += amount;
          break;
        case 'AD_REVENUE':
          acc[month].adRevenue += amount;
          break;
        case 'SUBSCRIPTION_SHARE':
          acc[month].subscriptionShare += amount;
          break;
        case 'TIP':
          acc[month].tip += amount;
          break;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData);
  }
}
