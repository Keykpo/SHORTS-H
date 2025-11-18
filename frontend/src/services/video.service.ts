import api from '@/lib/axios';
import {
  Video,
  VideoFeedParams,
  VideoFeedResponse,
  ApiResponse,
} from '@/types';

export class VideoService {
  /**
   * Get video feed
   */
  static async getFeed(params: VideoFeedParams = {}): Promise<VideoFeedResponse> {
    const { data } = await api.get<ApiResponse<VideoFeedResponse>>('/videos/feed', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        tags: params.tags?.join(','),
        nsfwOnly: params.nsfwOnly,
        sortBy: params.sortBy || 'recent',
      },
    });

    if (data.success && data.data) {
      return data.data;
    }

    throw new Error(data.error || 'Failed to get video feed');
  }

  /**
   * Get video by ID
   */
  static async getById(id: string): Promise<Video> {
    const { data } = await api.get<ApiResponse<Video>>(`/videos/${id}`);

    if (data.success && data.data) {
      return data.data;
    }

    throw new Error(data.error || 'Failed to get video');
  }

  /**
   * Record video view
   */
  static async recordView(id: string, watchDuration?: number): Promise<void> {
    await api.post(`/videos/${id}/view`, { watchDuration });
  }

  /**
   * Toggle like on video
   */
  static async toggleLike(id: string): Promise<{ liked: boolean }> {
    const { data } = await api.post<ApiResponse<{ liked: boolean }>>(`/videos/${id}/like`);

    if (data.success && data.data) {
      return data.data;
    }

    throw new Error(data.error || 'Failed to toggle like');
  }

  /**
   * Upload new video
   */
  static async upload(videoData: {
    title: string;
    description?: string;
    isNsfw: boolean;
    nsfwLevel: string;
    tags: string[];
    contentWarnings?: string[];
  }): Promise<Video> {
    const { data } = await api.post<ApiResponse<Video>>('/videos/upload', videoData);

    if (data.success && data.data) {
      return data.data;
    }

    throw new Error(data.error || 'Failed to upload video');
  }

  /**
   * Get user's videos
   */
  static async getUserVideos(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<VideoFeedResponse> {
    const { data } = await api.get<ApiResponse<VideoFeedResponse>>(`/videos/user/${userId}`, {
      params: { page, limit },
    });

    if (data.success && data.data) {
      return data.data;
    }

    throw new Error(data.error || 'Failed to get user videos');
  }
}
