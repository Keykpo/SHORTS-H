import api from '../lib/axios';

export interface CreatorOverview {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  averageCompletionRate: string;
  engagementRate: string;
}

export interface VideoAnalytics {
  video: any;
  completion: {
    averageCompletionRate: string;
    completedViews: number;
  };
  engagementByHour: any[];
  topViewers: any[];
  engagementRate: string;
}

export const analyticsService = {
  // Get creator overview
  getOverview: async (): Promise<CreatorOverview> => {
    const { data } = await api.get('/analytics/overview');
    return data.data;
  },

  // Get video analytics
  getVideoAnalytics: async (videoId: string): Promise<VideoAnalytics> => {
    const { data } = await api.get(`/analytics/video/${videoId}`);
    return data.data;
  },

  // Get demographics
  getDemographics: async () => {
    const { data } = await api.get('/analytics/demographics');
    return data.data;
  },

  // Get growth analytics
  getGrowth: async (days: number = 30) => {
    const { data } = await api.get(`/analytics/growth?days=${days}`);
    return data.data;
  },

  // Get best time to post
  getBestTimeToPost: async () => {
    const { data } = await api.get('/analytics/best-time');
    return data.data;
  },

  // Get top videos
  getTopVideos: async (limit: number = 10, metric: 'views' | 'likes' | 'engagement' = 'views') => {
    const { data } = await api.get(`/analytics/top-videos?limit=${limit}&metric=${metric}`);
    return data.data;
  },
};
