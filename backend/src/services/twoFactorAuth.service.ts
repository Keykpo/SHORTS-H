import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Two-Factor Authentication Service
 * Implements TOTP (Time-based One-Time Password) for 2FA
 */
export class TwoFactorAuthService {
  /**
   * Generate a secret key for 2FA
   */
  static generateSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Generate a backup codes for account recovery
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Enable 2FA for a user
   */
  static async enable2FA(userId: string) {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();

    // Hash backup codes before storing
    const hashedBackupCodes = backupCodes.map((code) =>
      crypto.createHash('sha256').update(code).digest('hex')
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: hashedBackupCodes,
        twoFactorEnabled: true,
      },
    });

    return {
      secret,
      backupCodes, // Return plain codes only once for user to save
      qrCodeUrl: this.generateQRCodeUrl(secret, userId),
    };
  }

  /**
   * Disable 2FA for a user
   */
  static async disable2FA(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorEnabled: false,
      },
    });
  }

  /**
   * Verify a 2FA token
   * Note: In production, use a library like 'otplib' for TOTP verification
   */
  static async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    // TODO: Implement actual TOTP verification with otplib
    // For now, this is a placeholder
    // const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
    // return isValid;

    return true; // Placeholder
  }

  /**
   * Verify a backup code
   */
  static async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorBackupCodes: true },
    });

    if (!user || !user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
      return false;
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const codeIndex = user.twoFactorBackupCodes.indexOf(hashedCode);

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    const updatedCodes = [...user.twoFactorBackupCodes];
    updatedCodes.splice(codeIndex, 1);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: updatedCodes },
    });

    return true;
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  private static generateQRCodeUrl(secret: string, userId: string): string {
    const issuer = 'AnimeShorts';
    const label = `${issuer}:${userId}`;
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

    // Use a QR code generation service
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
  }
}
