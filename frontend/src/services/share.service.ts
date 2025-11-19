import api from '../lib/axios';

export const shareService = {
  // Generate playlist share link
  generatePlaylistShareLink: async (playlistId: string) => {
    const { data } = await api.post(`/share/playlist/${playlistId}`);
    return data.data;
  },

  // Get playlist by share code
  getPlaylistByShareCode: async (shareCode: string) => {
    const { data } = await api.get(`/share/playlist/${shareCode}`);
    return data.data;
  },

  // Track share
  trackShare: async (playlistId: string, platform?: string) => {
    const { data} = await api.post(`/share/playlist/${playlistId}/track`, { platform });
    return data;
  },

  // Get playlist meta tags
  getPlaylistMetaTags: async (shareCode: string) => {
    const { data } = await api.get(`/share/playlist/${shareCode}/meta`);
    return data.data;
  },

  // Generate video share link
  generateVideoShareLink: async (videoId: string) => {
    const { data } = await api.post(`/share/video/${videoId}`);
    return data.data;
  },

  // Get video meta tags
  getVideoMetaTags: async (videoId: string) => {
    const { data } = await api.get(`/share/video/${videoId}/meta`);
    return data.data;
  },
};
