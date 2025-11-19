import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Security Service for detecting suspicious activity
 */
export class SecurityService {
  /**
   * Password strength requirements
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    // Minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // Maximum length
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for numbers
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common passwords
    const commonPasswords = [
      'password',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('This password is too common. Please choose a stronger password');
    }

    // Determine strength
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (password.length >= 12 && score === 4) {
      strength = 'strong';
    } else if (password.length >= 8 && score >= 3) {
      strength = 'medium';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(data: {
    userId?: string;
    ipAddress: string;
    action: string;
    details?: string;
    severity: 'low' | 'medium' | 'high';
  }) {
    // In production, you might want to use a dedicated security logging service
    console.warn('[SECURITY]', {
      timestamp: new Date().toISOString(),
      ...data,
    });

    // Optionally store in database
    // await prisma.securityLog.create({ data });
  }

  /**
   * Detect suspicious login attempts
   */
  static async detectSuspiciousLogin(userId: string, ipAddress: string): Promise<boolean> {
    // Check for multiple failed login attempts
    const recentFailedAttempts = await this.getRecentFailedLoginAttempts(userId, 15); // Last 15 minutes

    if (recentFailedAttempts >= 5) {
      await this.logSuspiciousActivity({
        userId,
        ipAddress,
        action: 'MULTIPLE_FAILED_LOGINS',
        details: `${recentFailedAttempts} failed login attempts in 15 minutes`,
        severity: 'high',
      });
      return true;
    }

    // Check for login from unusual location
    // This would require IP geolocation service
    // const isUnusualLocation = await this.checkUnusualLocation(userId, ipAddress);

    return false;
  }

  /**
   * Get recent failed login attempts
   */
  private static async getRecentFailedLoginAttempts(userId: string, minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    // This would query a login_attempts table
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Check if IP is blocked
   */
  static async isIPBlocked(ipAddress: string): Promise<boolean> {
    // Check against IP blacklist
    // This could be implemented with a database table or Redis
    const blockedIPs: string[] = []; // Load from database

    return blockedIPs.includes(ipAddress);
  }

  /**
   * Block an IP address
   */
  static async blockIP(
    ipAddress: string,
    reason: string,
    duration?: number // Duration in hours, undefined = permanent
  ) {
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;

    // Store in database
    // await prisma.blockedIP.create({
    //   data: {
    //     ipAddress,
    //     reason,
    //     expiresAt,
    //   },
    // });

    await this.logSuspiciousActivity({
      ipAddress,
      action: 'IP_BLOCKED',
      details: `Reason: ${reason}, Duration: ${duration ? `${duration}h` : 'permanent'}`,
      severity: 'high',
    });
  }

  /**
   * Generate secure token for email verification, password reset, etc.
   */
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash sensitive data
   */
  static hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Detect brute force attacks
   */
  static async detectBruteForce(identifier: string, action: string): Promise<boolean> {
    // Track attempts by identifier (IP, userId, email, etc.)
    // This would use Redis or similar for fast lookups

    // For now, return false as placeholder
    return false;
  }

  /**
   * Validate session integrity
   */
  static async validateSession(sessionId: string, userId: string, ipAddress: string): Promise<boolean> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return false;
    }

    // Check if session belongs to user
    if (session.userId !== userId) {
      await this.logSuspiciousActivity({
        userId,
        ipAddress,
        action: 'SESSION_MISMATCH',
        details: 'Session does not belong to user',
        severity: 'high',
      });
      return false;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      return false;
    }

    // Check if IP has changed (optional - may cause issues with mobile users)
    // if (session.ipAddress && session.ipAddress !== ipAddress) {
    //   await this.logSuspiciousActivity({
    //     userId,
    //     ipAddress,
    //     action: 'IP_CHANGE',
    //     details: `Session IP changed from ${session.ipAddress} to ${ipAddress}`,
    //     severity: 'medium',
    //   });
    // }

    return true;
  }

  /**
   * Check for account takeover indicators
   */
  static async detectAccountTakeover(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Check for unusual activity patterns
    // - Sudden change in upload frequency
    // - Unusual login times
    // - Multiple failed 2FA attempts
    // - Password change from unusual location
    // - Account details changed rapidly

    // For now, return not suspicious as placeholder
    return {
      suspicious: false,
      reasons,
    };
  }
}
