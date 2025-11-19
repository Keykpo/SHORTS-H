import api from './api';

export interface SubscriptionPlan {
  plan: 'MONTHLY' | 'YEARLY';
  amount: number;
  currency: string;
  benefits: string[];
  savings?: number;
}

export interface Pricing {
  monthly: SubscriptionPlan;
  yearly: SubscriptionPlan;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'EXPIRED';
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
  canceledAt?: string;
}

export const SubscriptionService = {
  /**
   * Get subscription pricing
   */
  getPricing: async (): Promise<Pricing> => {
    const response = await api.get('/subscriptions/pricing');
    return response.data;
  },

  /**
   * Get current user's subscription
   */
  getMySubscription: async (): Promise<Subscription> => {
    const response = await api.get('/subscriptions/me');
    return response.data;
  },

  /**
   * Create subscription
   */
  createSubscription: async (plan: 'MONTHLY' | 'YEARLY'): Promise<Subscription> => {
    const response = await api.post('/subscriptions', { plan });
    return response.data;
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (subscriptionId: string, cancelImmediately: boolean = false): Promise<any> => {
    const response = await api.post(`/subscriptions/${subscriptionId}/cancel`, {
      cancelImmediately,
    });
    return response.data;
  },

  /**
   * Reactivate subscription
   */
  reactivateSubscription: async (subscriptionId: string): Promise<any> => {
    const response = await api.post(`/subscriptions/${subscriptionId}/reactivate`);
    return response.data;
  },

  /**
   * Get subscription history
   */
  getSubscriptionHistory: async (): Promise<Subscription[]> => {
    const response = await api.get('/subscriptions/history');
    return response.data;
  },
};
