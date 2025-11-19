import api from '../lib/axios';

export const recommendationService = {
  // Get "For You" feed
  getForYou: async (limit: number = 20) => {
    const { data } = await api.get(`/recommendations/for-you?limit=${limit}`);
    return data.data;
  },

  // Get similar videos
  getSimilarVideos: async (videoId: string, limit: number = 10) => {
    const { data } = await api.get(`/recommendations/similar/${videoId}?limit=${limit}`);
    return data.data;
  },
};
