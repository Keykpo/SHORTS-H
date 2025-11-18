import api from '@/lib/axios';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
  User,
} from '@/types';

export class AuthService {
  /**
   * Register new user
   */
  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials);

    if (data.success && data.data) {
      // Store tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data;
    }

    throw new Error(data.error || 'Registration failed');
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);

    if (data.success && data.data) {
      // Store tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data;
    }

    throw new Error(data.error || 'Login failed');
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      // Clear tokens regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>('/auth/profile');

    if (data.success && data.data) {
      return data.data;
    }

    throw new Error(data.error || 'Failed to get profile');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}
