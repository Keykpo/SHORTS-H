import { PrismaClient, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class DonationService {
  /**
   * Create donation
   */
  static async createDonation(data: {
    senderId: string;
    receiverId: string;
    amount: number;
    currency?: string;
    message?: string;
    videoId?: string;
    isAnonymous?: boolean;
    isPublic?: boolean;
  }) {
    // Validate amount
    if (data.amount < 1) {
      throw new Error('Minimum donation amount is $1');
    }

    if (data.amount > 10000) {
      throw new Error('Maximum donation amount is $10,000');
    }

    // Create donation record
    const donation = await prisma.donation.create({
      data: {
        senderId: data.senderId,
        receiverId: data.receiverId,
        amount: data.amount,
        currency: data.currency || 'USD',
        message: data.message,
        videoId: data.videoId,
        isAnonymous: data.isAnonymous || false,
        isPublic: data.isPublic !== false,
        status: 'PENDING',
      },
    });

    return donation;
  }

  /**
   * Update donation status
   */
  static async updateDonationStatus(donationId: string, status: PaymentStatus) {
    const donation = await prisma.donation.update({
      where: { id: donationId },
      data: { status },
    });

    // If donation succeeded, create revenue record for receiver
    if (status === 'SUCCEEDED') {
      await prisma.revenue.create({
        data: {
          userId: donation.receiverId,
          type: 'DONATION',
          amount: donation.amount,
          currency: donation.currency,
          sourceId: donation.id,
          videoId: donation.videoId,
          description: `Donation from ${donation.isAnonymous ? 'Anonymous' : 'supporter'}`,
        },
      });

      // Send notification to receiver
      await prisma.notification.create({
        data: {
          userId: donation.receiverId,
          type: 'SYSTEM_ALERT',
          title: '🎁 New Donation Received!',
          message: donation.isAnonymous
            ? `You received a $${donation.amount} donation from an anonymous supporter!`
            : `You received a $${donation.amount} donation!`,
          actionUrl: '/dashboard/revenue',
        },
      });
    }

    return donation;
  }

  /**
   * Get donations received by user
   */
  static async getReceivedDonations(
    userId: string,
    options?: { limit?: number; offset?: number }
  ) {
    return await prisma.donation.findMany({
      where: {
        receiverId: userId,
        status: 'SUCCEEDED',
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isPremium: true,
          },
        },
        payment: true,
      },
    });
  }

  /**
   * Get donations sent by user
   */
  static async getSentDonations(userId: string, options?: { limit?: number; offset?: number }) {
    return await prisma.donation.findMany({
      where: {
        senderId: userId,
        status: 'SUCCEEDED',
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        payment: true,
      },
    });
  }

  /**
   * Get donation leaderboard for a creator
   */
  static async getDonationLeaderboard(
    receiverId: string,
    timeframe: 'all' | 'month' | 'week' = 'all'
  ) {
    const dateFilter = this.getDateFilter(timeframe);

    const topDonors = await prisma.donation.groupBy({
      by: ['senderId'],
      where: {
        receiverId,
        status: 'SUCCEEDED',
        isPublic: true,
        isAnonymous: false,
        ...(dateFilter && { createdAt: { gte: dateFilter } }),
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

    // Get sender details
    const donorsWithDetails = await Promise.all(
      topDonors.map(async (donor) => {
        const user = await prisma.user.findUnique({
          where: { id: donor.senderId },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isPremium: true,
          },
        });

        return {
          ...donor,
          user,
          totalAmount: donor._sum.amount || 0,
          donationCount: donor._count,
        };
      })
    );

    return donorsWithDetails;
  }

  /**
   * Get donation statistics for a creator
   */
  static async getDonationStats(userId: string) {
    const totalDonations = await prisma.donation.aggregate({
      where: {
        receiverId: userId,
        status: 'SUCCEEDED',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const thisMonthDonations = await prisma.donation.aggregate({
      where: {
        receiverId: userId,
        status: 'SUCCEEDED',
        createdAt: {
          gte: new Date(new Date().setDate(1)), // First day of current month
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const topDonation = await prisma.donation.findFirst({
      where: {
        receiverId: userId,
        status: 'SUCCEEDED',
      },
      orderBy: {
        amount: 'desc',
      },
      include: {
        sender: {
          select: {
            username: true,
            displayName: true,
            isAnonymous: true,
          },
        },
      },
    });

    return {
      totalAmount: totalDonations._sum.amount || 0,
      totalCount: totalDonations._count,
      thisMonthAmount: thisMonthDonations._sum.amount || 0,
      thisMonthCount: thisMonthDonations._count,
      topDonation,
    };
  }

  /**
   * Helper: Get date filter for timeframe
   */
  private static getDateFilter(timeframe: 'all' | 'month' | 'week'): Date | null {
    if (timeframe === 'all') return null;

    const now = new Date();
    if (timeframe === 'month') {
      return new Date(now.setDate(1)); // First day of current month
    } else {
      return new Date(now.setDate(now.getDate() - 7)); // 7 days ago
    }
  }

  /**
   * Get recent donations with messages (for display on creator page)
   */
  static async getRecentDonationsWithMessages(receiverId: string, limit: number = 5) {
    return await prisma.donation.findMany({
      where: {
        receiverId,
        status: 'SUCCEEDED',
        message: {
          not: null,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isPremium: true,
          },
        },
      },
    });
  }
}
