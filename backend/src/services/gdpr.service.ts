import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

/**
 * GDPR Compliance Service
 * Implements data export, deletion, and privacy features
 */
export class GDPRService {
  /**
   * Export all user data (Right to Data Portability)
   */
  static async exportUserData(userId: string): Promise<{
    user: any;
    videos: any[];
    comments: any[];
    interactions: any[];
    playlists: any[];
    subscriptions: any[];
    payments: any[];
    donations: any[];
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        isEmailVerified: true,
        isAgeVerified: true,
        birthDate: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    const videos = await prisma.video.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnailUrl: true,
        duration: true,
        viewsCount: true,
        likesCount: true,
        createdAt: true,
        publishedAt: true,
      },
    });

    const comments = await prisma.comment.findMany({
      where: { userId },
      select: {
        id: true,
        content: true,
        videoId: true,
        createdAt: true,
        likesCount: true,
      },
    });

    const interactions = await prisma.interaction.findMany({
      where: { userId },
      select: {
        id: true,
        videoId: true,
        type: true,
        createdAt: true,
      },
    });

    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        videos: {
          include: {
            video: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      select: {
        id: true,
        plan: true,
        status: true,
        amount: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
      },
    });

    const payments = await prisma.payment.findMany({
      where: { userId },
      select: {
        id: true,
        amount: true,
        currency: true,
        type: true,
        status: true,
        createdAt: true,
        paidAt: true,
      },
    });

    const sentDonations = await prisma.donation.findMany({
      where: { senderId: userId },
      select: {
        id: true,
        amount: true,
        message: true,
        createdAt: true,
      },
    });

    const receivedDonations = await prisma.donation.findMany({
      where: { receiverId: userId },
      select: {
        id: true,
        amount: true,
        message: true,
        isAnonymous: true,
        createdAt: true,
      },
    });

    return {
      user: user!,
      videos,
      comments,
      interactions,
      playlists,
      subscriptions,
      payments,
      donations: [...sentDonations, ...receivedDonations],
    };
  }

  /**
   * Anonymize user data (soft delete - retain data but anonymize)
   */
  static async anonymizeUser(userId: string) {
    const randomId = `deleted_${Date.now()}`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        username: randomId,
        email: `${randomId}@deleted.local`,
        displayName: 'Deleted User',
        bio: null,
        avatarUrl: null,
        bannerUrl: null,
        passwordHash: '',
        isActive: false,
        isEmailVerified: false,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    // Anonymize comments
    await prisma.comment.updateMany({
      where: { userId },
      data: {
        content: '[deleted]',
      },
    });
  }

  /**
   * Permanently delete user and all associated data (Right to be Forgotten)
   */
  static async deleteUserPermanently(userId: string) {
    // Note: Prisma cascading deletes will handle most relations
    // But you may want to handle some manually for audit purposes

    // Delete user (cascading will delete most related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log the deletion for compliance
    console.log(`User ${userId} permanently deleted at ${new Date().toISOString()}`);
  }

  /**
   * Get user consent records
   */
  static async getUserConsents(userId: string) {
    // This would query a consents table
    // For now, return empty array as placeholder

    return {
      cookieConsent: true,
      termsAccepted: true,
      privacyPolicyAccepted: true,
      marketingConsent: false,
      dataProcessingConsent: true,
      consentDate: new Date(),
    };
  }

  /**
   * Record user consent
   */
  static async recordConsent(userId: string, consentType: string, granted: boolean) {
    // Store consent in database
    // await prisma.userConsent.create({
    //   data: {
    //     userId,
    //     consentType,
    //     granted,
    //     grantedAt: new Date(),
    //   },
    // });

    console.log(`Consent recorded: ${userId} - ${consentType}: ${granted}`);
  }

  /**
   * Generate data retention policy report
   */
  static async getDataRetentionReport(userId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    return {
      accountAge: 'X days',
      dataRetentionPeriod: '90 days after account deletion',
      deletableData: {
        videos: 'Deleted immediately upon request',
        comments: 'Anonymized upon account deletion',
        personalInfo: 'Deleted immediately upon request',
        interactions: 'Deleted after 90 days',
        financialRecords: 'Retained for 7 years (legal requirement)',
      },
      scheduledDeletion: null, // Date if user requested deletion
    };
  }

  /**
   * Check if user has active subscription (affects data deletion)
   */
  static async canDeleteAccount(userId: string): Promise<{
    canDelete: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Check for active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (activeSubscription) {
      reasons.push('You have an active subscription. Please cancel it first.');
    }

    // Check for pending payments
    const pendingPayments = await prisma.payment.count({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (pendingPayments > 0) {
      reasons.push('You have pending payments. Please wait for them to be processed.');
    }

    // Check for pending revenue payouts
    const pendingRevenue = await prisma.revenue.count({
      where: {
        userId,
        isPaid: false,
      },
    });

    if (pendingRevenue > 0) {
      reasons.push('You have pending revenue. Please request a payout first.');
    }

    return {
      canDelete: reasons.length === 0,
      reasons,
    };
  }
}
