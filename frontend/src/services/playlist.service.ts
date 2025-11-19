import api from '../lib/axios';

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  isSystem: boolean;
  videosCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  videos?: any[];
}

export const playlistService = {
  // Get my playlists
  getMyPlaylists: async () => {
    const { data } = await api.get('/playlists/me');
    return data.data;
  },

  // Get playlist by ID
  getPlaylistById: async (playlistId: string) => {
    const { data } = await api.get(`/playlists/${playlistId}`);
    return data.data;
  },

  // Get user's playlists
  getUserPlaylists: async (userId: string) => {
    const { data } = await api.get(`/playlists/user/${userId}`);
    return data.data;
  },

  // Create playlist
  createPlaylist: async (playlistData: { name: string; description?: string; isPublic?: boolean }) => {
    const { data } = await api.post('/playlists', playlistData);
    return data.data;
  },

  // Update playlist
  updatePlaylist: async (playlistId: string, updates: Partial<Playlist>) => {
    const { data } = await api.put(`/playlists/${playlistId}`, updates);
    return data.data;
  },

  // Delete playlist
  deletePlaylist: async (playlistId: string) => {
    const { data } = await api.delete(`/playlists/${playlistId}`);
    return data;
  },

  // Add video to playlist
  addVideo: async (playlistId: string, videoId: string) => {
    const { data } = await api.post(`/playlists/${playlistId}/videos`, { videoId });
    return data.data;
  },

  // Remove video from playlist
  removeVideo: async (playlistId: string, videoId: string) => {
    const { data } = await api.delete(`/playlists/${playlistId}/videos/${videoId}`);
    return data;
  },

  // Reorder videos
  reorderVideos: async (playlistId: string, videoOrders: { videoId: string; position: number }[]) => {
    const { data } = await api.put(`/playlists/${playlistId}/reorder`, { videoOrders });
    return data;
  },

  // Get public playlists (discover)
  getPublicPlaylists: async (page: number = 1, limit: number = 20) => {
    const { data } = await api.get(`/playlists/discover?page=${page}&limit=${limit}`);
    return data.data;
  },

  // Get "Liked Videos" playlist
  getLikedVideos: async () => {
    const { data } = await api.get('/playlists/liked');
    return data.data;
  },
};
