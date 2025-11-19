import api from '../lib/axios';

export const CommentService = {
  // Get comments for a video
  getComments: async (videoId: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get(`/comments/${videoId}`, { params });
    return data.data;
  },

  // Create a comment
  createComment: async (commentData: {
    videoId: string;
    content: string;
    parentId?: string;
  }) => {
    const { data } = await api.post('/comments', commentData);
    return data.data;
  },

  // Toggle like on a comment
  toggleLike: async (commentId: string) => {
    const { data } = await api.post(`/comments/${commentId}/like`);
    return data.data;
  },

  // Delete a comment
  deleteComment: async (commentId: string) => {
    const { data } = await api.delete(`/comments/${commentId}`);
    return data;
  },

  // Update a comment
  updateComment: async (commentId: string, content: string) => {
    const { data } = await api.put(`/comments/${commentId}`, { content });
    return data.data;
  },
};
