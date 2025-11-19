import api from './api';

export interface Donation {
  id: string;
  senderId: string;
  receiverId: string;
  videoId?: string;
  amount: number;
  currency: string;
  message?: string;
  isAnonymous: boolean;
  isPublic: boolean;
  status: string;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isPremium: boolean;
  };
  receiver?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface DonationStats {
  totalAmount: number;
  totalCount: number;
  thisMonthAmount: number;
  thisMonthCount: number;
  topDonation?: Donation;
}

export interface DonationLeaderboardEntry {
  senderId: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isPremium: boolean;
  };
  totalAmount: number;
  donationCount: number;
}

export const DonationService = {
  /**
   * Create donation
   */
  createDonation: async (data: {
    receiverId: string;
    amount: number;
    message?: string;
    videoId?: string;
    isAnonymous?: boolean;
    isPublic?: boolean;
  }): Promise<Donation> => {
    const response = await api.post('/donations', data);
    return response.data;
  },

  /**
   * Get received donations
   */
  getReceivedDonations: async (limit: number = 20, offset: number = 0): Promise<Donation[]> => {
    const response = await api.get('/donations/received', { params: { limit, offset } });
    return response.data;
  },

  /**
   * Get sent donations
   */
  getSentDonations: async (limit: number = 20, offset: number = 0): Promise<Donation[]> => {
    const response = await api.get('/donations/sent', { params: { limit, offset } });
    return response.data;
  },

  /**
   * Get donation leaderboard
   */
  getDonationLeaderboard: async (
    userId: string,
    timeframe: 'all' | 'month' | 'week' = 'all'
  ): Promise<DonationLeaderboardEntry[]> => {
    const response = await api.get(`/donations/leaderboard/${userId}`, {
      params: { timeframe },
    });
    return response.data;
  },

  /**
   * Get donation stats
   */
  getDonationStats: async (): Promise<DonationStats> => {
    const response = await api.get('/donations/stats');
    return response.data;
  },

  /**
   * Get recent donations with messages
   */
  getRecentMessages: async (userId: string, limit: number = 5): Promise<Donation[]> => {
    const response = await api.get(`/donations/recent-messages/${userId}`, {
      params: { limit },
    });
    return response.data;
  },
};
