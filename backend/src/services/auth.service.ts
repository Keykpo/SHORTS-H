import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { JWTPayload } from '../middlewares/auth.middleware';

interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  birthDate: Date;
  agreedToTerms: boolean;
}

interface LoginDTO {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    isAgeVerified: boolean;
    isPremium: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterDTO): Promise<AuthResponse> {
    const { username, email, password, birthDate, agreedToTerms } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new AppError(409, 'User already exists', 'USER_EXISTS');
    }

    // Verify age
    const age = this.calculateAge(birthDate);
    if (age < config.ageVerification.minimumAge) {
      throw new AppError(403, 'You must be at least 18 years old to register', 'AGE_RESTRICTION');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        birthDate,
        isAgeVerified: age >= 18,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isAgeVerified: true,
        isPremium: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens({
      userId: user.id,
      email: user.email,
      isAgeVerified: user.isAgeVerified,
      isPremium: user.isPremium,
    });

    // Store session
    await this.createSession(user.id, accessToken, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  static async login(data: LoginDTO): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        isActive: true,
        isBanned: true,
        isAgeVerified: true,
        isPremium: true,
      },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Check if account is active
    if (!user.isActive || user.isBanned) {
      throw new AppError(403, 'Account is inactive or banned', 'ACCOUNT_INACTIVE');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens({
      userId: user.id,
      email: user.email,
      isAgeVerified: user.isAgeVerified,
      isPremium: user.isPremium,
    });

    // Store session
    await this.createSession(user.id, accessToken, refreshToken);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JWTPayload;

      // Verify session exists
      const session = await prisma.session.findFirst({
        where: {
          userId: decoded.userId,
          refreshToken,
          expiresAt: { gte: new Date() },
        },
      });

      if (!session) {
        throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      // Get updated user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          isAgeVerified: true,
          isPremium: true,
          isActive: true,
          isBanned: true,
        },
      });

      if (!user || !user.isActive || user.isBanned) {
        throw new AppError(403, 'Account is inactive or banned', 'ACCOUNT_INACTIVE');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        isAgeVerified: user.isAgeVerified,
        isPremium: user.isPremium,
      });

      // Update session
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: accessToken,
          lastUsedAt: new Date(),
        },
      });

      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(401, 'Refresh token expired', 'TOKEN_EXPIRED');
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(userId: string, token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        userId,
        token,
      },
    });
  }

  /**
   * Generate JWT tokens
   */
  private static generateTokens(payload: JWTPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generate access token only
   */
  private static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Create session record
   */
  private static async createSession(
    userId: string,
    token: string,
    refreshToken: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId,
        token,
        refreshToken,
        expiresAt,
      },
    });
  }

  /**
   * Calculate age from birth date
   */
  private static calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }
}
