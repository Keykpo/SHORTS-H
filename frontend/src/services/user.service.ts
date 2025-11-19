import api from '../lib/axios';

export const UserService = {
  // Get user profile by username
  getProfile: async (username: string) => {
    const { data } = await api.get(`/users/${username}`);
    return data.data;
  },

  // Get user's videos
  getUserVideos: async (username: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get(`/users/${username}/videos`, { params });
    return data.data;
  },

  // Get user's playlists
  getUserPlaylists: async (username: string) => {
    const { data } = await api.get(`/users/${username}/playlists`);
    return data.data;
  },

  // Toggle follow user
  toggleFollow: async (userId: string) => {
    const { data } = await api.post(`/users/${userId}/follow`);
    return data.data;
  },

  // Get followers
  getFollowers: async (username: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get(`/users/${username}/followers`, { params });
    return data.data;
  },

  // Get following
  getFollowing: async (username: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get(`/users/${username}/following`, { params });
    return data.data;
  },

  // Update profile
  updateProfile: async (profileData: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
  }) => {
    const { data } = await api.put('/users/profile', profileData);
    return data.data;
  },
};
