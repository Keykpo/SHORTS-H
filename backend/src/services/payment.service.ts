import { PrismaClient, PaymentType, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentService {
  /**
   * Create payment record
   */
  static async createPayment(data: {
    userId: string;
    amount: number;
    currency?: string;
    type: PaymentType;
    subscriptionId?: string;
    donationId?: string;
    stripePaymentIntentId?: string;
    paymentMethod?: string;
    description?: string;
  }) {
    return await prisma.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        currency: data.currency || 'USD',
        type: data.type,
        status: 'PENDING',
        subscriptionId: data.subscriptionId,
        donationId: data.donationId,
        stripePaymentIntentId: data.stripePaymentIntentId,
        paymentMethod: data.paymentMethod,
        description: data.description,
      },
    });
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    metadata?: {
      stripeChargeId?: string;
      receiptUrl?: string;
      failureReason?: string;
    }
  ) {
    return await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paidAt: status === 'SUCCEEDED' ? new Date() : undefined,
        stripeChargeId: metadata?.stripeChargeId,
        receiptUrl: metadata?.receiptUrl,
        failureReason: metadata?.failureReason,
      },
    });
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId: string) {
    return await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        subscription: true,
        donation: true,
      },
    });
  }

  /**
   * Get user payments
   */
  static async getUserPayments(userId: string, options?: { limit?: number; offset?: number }) {
    return await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
      include: {
        subscription: true,
        donation: true,
      },
    });
  }

  /**
   * Get payment by Stripe Payment Intent ID
   */
  static async getPaymentByStripePaymentIntentId(paymentIntentId: string) {
    return await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
  }

  /**
   * Refund payment
   */
  static async refundPayment(paymentId: string) {
    return await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
      },
    });
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats(userId?: string) {
    const where = userId ? { userId } : {};

    const totalRevenue = await prisma.payment.aggregate({
      where: {
        ...where,
        status: 'SUCCEEDED',
      },
      _sum: {
        amount: true,
      },
    });

    const paymentsByType = await prisma.payment.groupBy({
      by: ['type'],
      where: {
        ...where,
        status: 'SUCCEEDED',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const recentPayments = await prisma.payment.findMany({
      where: {
        ...where,
        status: 'SUCCEEDED',
      },
      orderBy: { paidAt: 'desc' },
      take: 10,
    });

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      paymentsByType,
      recentPayments,
    };
  }
}
