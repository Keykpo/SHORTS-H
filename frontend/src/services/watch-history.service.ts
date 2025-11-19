import api from '../lib/axios';

export interface WatchHistory {
  id: string;
  userId: string;
  videoId: string;
  watchedDuration: number;
  totalDuration: number;
  progressPercent: number;
  completed: boolean;
  lastWatchedAt: string;
  createdAt: string;
  video?: any;
}

export const watchHistoryService = {
  // Update watch progress
  updateProgress: async (videoId: string, watchedDuration: number, totalDuration: number) => {
    const { data } = await api.post('/watch-history/progress', {
      videoId,
      watchedDuration,
      totalDuration,
    });
    return data.data;
  },

  // Get watch history
  getHistory: async (page: number = 1, limit: number = 20) => {
    const { data } = await api.get(`/watch-history?page=${page}&limit=${limit}`);
    return data.data;
  },

  // Get "Continue Watching"
  getContinueWatching: async (limit: number = 10) => {
    const { data } = await api.get(`/watch-history/continue?limit=${limit}`);
    return data.data;
  },

  // Get video progress
  getVideoProgress: async (videoId: string) => {
    const { data } = await api.get(`/watch-history/video/${videoId}`);
    return data.data;
  },

  // Clear history
  clearHistory: async () => {
    const { data } = await api.delete('/watch-history');
    return data;
  },

  // Remove from history
  removeFromHistory: async (videoId: string) => {
    const { data } = await api.delete(`/watch-history/video/${videoId}`);
    return data;
  },

  // Get stats
  getStats: async () => {
    const { data } = await api.get('/watch-history/stats');
    return data.data;
  },
};
