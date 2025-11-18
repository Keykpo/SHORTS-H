import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AuthService } from '../services/auth.service';

export class AuthController {
  /**
   * Register new user
   */
  static async register(req: AuthRequest, res: Response) {
    try {
      const { username, email, password, birthDate, agreedToTerms } = req.body;

      const result = await AuthService.register({
        username,
        email,
        password,
        birthDate: new Date(birthDate),
        agreedToTerms,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refresh(req: AuthRequest, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token required',
        });
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const token = req.headers.authorization?.substring(7);

      if (token) {
        await AuthService.logout(userId, token);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

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
          isPremium: true,
          createdAt: true,
          _count: {
            select: {
              videos: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }
}

import { prisma } from '../config/database';
