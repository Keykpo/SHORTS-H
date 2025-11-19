import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { logger } from '../config/logger';
import crypto from 'crypto';

// Generate random share code
const generateShareCode = (length: number = 8): string => {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
};

export class ShareService {
  /**
   * Generate shareable link for a playlist
   */
  static async generatePlaylistShareLink(playlistId: string, userId: string) {
    // Verify ownership or public status
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    if (!playlist.isPublic && playlist.userId !== userId) {
      throw new Error('Cannot share private playlist that you don\'t own');
    }

    // Generate or return existing share code
    let shareCode = playlist.shareCode;

    if (!shareCode) {
      // Generate unique 8-character code
      shareCode = generateShareCode(8);

      await prisma.playlist.update({
        where: { id: playlistId },
        data: { shareCode },
      });
    }

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/playlist/${shareCode}`;

    logger.info('Playlist share link generated', { playlistId, shareCode });

    return {
      shareCode,
      shareUrl,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        thumbnailUrl: playlist.thumbnailUrl,
      },
    };
  }

  /**
   * Get playlist by share code (public access)
   */
  static async getPlaylistByShareCode(shareCode: string) {
    const cacheKey = `share:playlist:${shareCode}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const playlist = await prisma.playlist.findUnique({
      where: { shareCode },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        videos: {
          orderBy: { position: 'asc' },
          include: {
            video: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    // Cache for 5 minutes
    await cache.set(cacheKey, JSON.stringify(playlist), 300);

    return playlist;
  }

  /**
   * Track share event (when user shares to social media)
   */
  static async trackShare(playlistId: string, platform?: string) {
    await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        sharesCount: { increment: 1 },
      },
    });

    logger.info('Playlist share tracked', { playlistId, platform });

    return { success: true };
  }

  /**
   * Generate Open Graph meta tags for playlist
   */
  static async getPlaylistMetaTags(shareCode: string) {
    const playlist = await this.getPlaylistByShareCode(shareCode);

    const metaTags = {
      'og:type': 'website',
      'og:title': playlist.name,
      'og:description':
        playlist.description ||
        `${playlist.videosCount} videos curated by ${playlist.user.displayName || playlist.user.username}`,
      'og:image': playlist.thumbnailUrl || '/default-playlist-image.jpg',
      'og:url': `${process.env.FRONTEND_URL || 'http://localhost:3000'}/playlist/${shareCode}`,
      'og:site_name': 'AnimeShorts',
      'twitter:card': 'summary_large_image',
      'twitter:title': playlist.name,
      'twitter:description':
        playlist.description ||
        `${playlist.videosCount} videos curated by ${playlist.user.displayName || playlist.user.username}`,
      'twitter:image': playlist.thumbnailUrl || '/default-playlist-image.jpg',
    };

    return metaTags;
  }

  /**
   * Generate shareable link for a video
   */
  static async generateVideoShareLink(videoId: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!video) {
      throw new Error('Video not found');
    }

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/video/${videoId}`;

    // Track share
    await prisma.video.update({
      where: { id: videoId },
      data: {
        sharesCount: { increment: 1 },
      },
    });

    logger.info('Video share link generated', { videoId });

    return {
      shareUrl,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        creator: video.user.username,
      },
    };
  }

  /**
   * Get video meta tags for Open Graph
   */
  static async getVideoMetaTags(videoId: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!video) {
      throw new Error('Video not found');
    }

    const metaTags = {
      'og:type': 'video.other',
      'og:title': video.title,
      'og:description':
        video.description ||
        `Watch this video by ${video.user.displayName || video.user.username}`,
      'og:image': video.thumbnailUrl,
      'og:video': video.videoUrl,
      'og:url': `${process.env.FRONTEND_URL || 'http://localhost:3000'}/video/${videoId}`,
      'og:site_name': 'AnimeShorts',
      'og:video:width': video.width?.toString() || '1280',
      'og:video:height': video.height?.toString() || '720',
      'og:video:duration': video.duration.toString(),
      'twitter:card': 'player',
      'twitter:title': video.title,
      'twitter:description':
        video.description ||
        `Watch this video by ${video.user.displayName || video.user.username}`,
      'twitter:image': video.thumbnailUrl,
      'twitter:player': video.videoUrl,
      'twitter:player:width': video.width?.toString() || '1280',
      'twitter:player:height': video.height?.toString() || '720',
    };

    return metaTags;
  }
}
