import api from './api';

export interface RevenueSummary {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  revenueByType: {
    type: 'DONATION' | 'AD_REVENUE' | 'SUBSCRIPTION_SHARE' | 'TIP';
    _sum: { amount: number | null };
    _count: number;
  }[];
}

export interface RevenueRecord {
  id: string;
  userId: string;
  type: 'DONATION' | 'AD_REVENUE' | 'SUBSCRIPTION_SHARE' | 'TIP';
  amount: number;
  currency: string;
  sourceId?: string;
  videoId?: string;
  description?: string;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
}

export interface RevenueAnalytics {
  thisMonth: number;
  lastMonth: number;
  growth: number;
  topVideos: any[];
}

export interface WithdrawalInfo {
  availableAmount: number;
  minimumWithdrawal: number;
  canWithdraw: boolean;
  lastPayoutDate?: string;
}

export interface MonthlyEarnings {
  month: string;
  donation: number;
  adRevenue: number;
  subscriptionShare: number;
  tip: number;
  total: number;
}

export const RevenueService = {
  /**
   * Get revenue summary
   */
  getSummary: async (): Promise<RevenueSummary> => {
    const response = await api.get('/revenue/summary');
    return response.data;
  },

  /**
   * Get revenue history
   */
  getHistory: async (options?: {
    limit?: number;
    offset?: number;
    type?: 'DONATION' | 'AD_REVENUE' | 'SUBSCRIPTION_SHARE' | 'TIP';
    isPaid?: boolean;
  }): Promise<RevenueRecord[]> => {
    const response = await api.get('/revenue/history', { params: options });
    return response.data;
  },

  /**
   * Get revenue by period
   */
  getByPeriod: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any[]> => {
    const response = await api.get('/revenue/by-period', { params: { period } });
    return response.data;
  },

  /**
   * Get revenue analytics
   */
  getAnalytics: async (): Promise<RevenueAnalytics> => {
    const response = await api.get('/revenue/analytics');
    return response.data;
  },

  /**
   * Get withdrawal info
   */
  getWithdrawalInfo: async (): Promise<WithdrawalInfo> => {
    const response = await api.get('/revenue/withdrawal-info');
    return response.data;
  },

  /**
   * Get monthly chart data
   */
  getMonthlyChart: async (months: number = 12): Promise<MonthlyEarnings[]> => {
    const response = await api.get('/revenue/monthly-chart', { params: { months } });
    return response.data;
  },
};
