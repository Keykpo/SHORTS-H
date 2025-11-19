import api from '../lib/axios';

export const AdminService = {
  // Get admin statistics
  getStats: async () => {
    const { data } = await api.get('/admin/stats');
    return data.data;
  },

  // Get recent videos
  getRecentVideos: async (params?: { limit?: number }) => {
    const { data } = await api.get('/admin/videos/recent', { params });
    return data.data;
  },

  // Get pending reports
  getPendingReports: async (params?: { limit?: number; page?: number }) => {
    const { data } = await api.get('/admin/reports/pending', { params });
    return data.data;
  },

  // Moderate video
  moderateVideo: async (videoId: string, action: 'approve' | 'reject', reason?: string) => {
    const { data } = await api.post(`/admin/videos/${videoId}/moderate`, { action, reason });
    return data.data;
  },

  // Get all users with filters
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const { data } = await api.get('/admin/users', { params });
    return data.data;
  },

  // Ban/unban user
  toggleUserBan: async (userId: string, reason?: string, duration?: number) => {
    const { data } = await api.post(`/admin/users/${userId}/ban`, { reason, duration });
    return data.data;
  },

  // Update user role
  updateUserRole: async (userId: string, role: string) => {
    const { data } = await api.put(`/admin/users/${userId}/role`, { role });
    return data.data;
  },

  // Get all reports
  getReports: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }) => {
    const { data } = await api.get('/admin/reports', { params });
    return data.data;
  },

  // Resolve report
  resolveReport: async (reportId: string, action: 'dismiss' | 'action_taken', notes?: string) => {
    const { data } = await api.post(`/admin/reports/${reportId}/resolve`, { action, notes });
    return data.data;
  },

  // Delete video
  deleteVideo: async (videoId: string, reason: string) => {
    const { data } = await api.delete(`/admin/videos/${videoId}`, { data: { reason } });
    return data;
  },

  // Get moderation queue
  getModerationQueue: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/admin/moderation/queue', { params });
    return data.data;
  },
};
