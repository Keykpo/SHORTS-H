import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../config/logger';

interface CreatePlaylistDTO {
  userId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

interface UpdatePlaylistDTO {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

interface AddVideoToPlaylistDTO {
  playlistId: string;
  videoId: string;
  userId: string;
}

export class PlaylistService {
  /**
   * Create a new playlist
   */
  static async createPlaylist(data: CreatePlaylistDTO) {
    const { userId, name, description, isPublic = true } = data;

    // Check if playlist name already exists for this user
    const existing = await prisma.playlist.findFirst({
      where: {
        userId,
        name,
        isSystem: false,
      },
    });

    if (existing) {
      throw new AppError(400, 'A playlist with this name already exists', 'DUPLICATE_PLAYLIST');
    }

    const playlist = await prisma.playlist.create({
      data: {
        userId,
        name,
        description,
        isPublic,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    logger.info('Playlist created', { playlistId: playlist.id, userId });

    // Clear user playlists cache
    await cache.delete(`playlists:user:${userId}`);

    return playlist;
  }

  /**
   * Get playlist by ID
   */
  static async getPlaylistById(playlistId: string, userId?: string) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
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
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    if (!playlist) {
      throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
    }

    // Check access permissions
    if (!playlist.isPublic && playlist.userId !== userId) {
      throw new AppError(403, 'You do not have access to this playlist', 'FORBIDDEN');
    }

    return playlist;
  }

  /**
   * Get user's playlists
   */
  static async getUserPlaylists(userId: string, requestingUserId?: string) {
    const cacheKey = `playlists:user:${userId}`;

    // Only cache if requesting own playlists
    if (userId === requestingUserId) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const where: any = { userId };

    // If not the owner, only show public playlists
    if (userId !== requestingUserId) {
      where.isPublic = true;
    }

    const playlists = await prisma.playlist.findMany({
      where,
      orderBy: [
        { isSystem: 'desc' }, // System playlists first
        { createdAt: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    // Get thumbnail from first video if not set
    for (const playlist of playlists) {
      if (!playlist.thumbnailUrl) {
        const firstVideo = await prisma.playlistVideo.findFirst({
          where: { playlistId: playlist.id },
          orderBy: { position: 'asc' },
          include: {
            video: {
              select: {
                thumbnailUrl: true,
              },
            },
          },
        });

        if (firstVideo) {
          playlist.thumbnailUrl = firstVideo.video.thumbnailUrl;
        }
      }
    }

    // Cache for 5 minutes if requesting own playlists
    if (userId === requestingUserId) {
      await cache.set(cacheKey, JSON.stringify(playlists), 300);
    }

    return playlists;
  }

  /**
   * Update playlist
   */
  static async updatePlaylist(playlistId: string, userId: string, data: UpdatePlaylistDTO) {
    // Check ownership
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
    }

    if (playlist.userId !== userId) {
      throw new AppError(403, 'You do not own this playlist', 'FORBIDDEN');
    }

    if (playlist.isSystem) {
      throw new AppError(400, 'Cannot edit system playlists', 'SYSTEM_PLAYLIST');
    }

    const updated = await prisma.playlist.update({
      where: { id: playlistId },
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    logger.info('Playlist updated', { playlistId, userId });

    // Clear cache
    await cache.delete(`playlists:user:${userId}`);
    await cache.delete(`playlist:${playlistId}`);

    return updated;
  }

  /**
   * Delete playlist
   */
  static async deletePlaylist(playlistId: string, userId: string) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
    }

    if (playlist.userId !== userId) {
      throw new AppError(403, 'You do not own this playlist', 'FORBIDDEN');
    }

    if (playlist.isSystem) {
      throw new AppError(400, 'Cannot delete system playlists', 'SYSTEM_PLAYLIST');
    }

    await prisma.playlist.delete({
      where: { id: playlistId },
    });

    logger.info('Playlist deleted', { playlistId, userId });

    // Clear cache
    await cache.delete(`playlists:user:${userId}`);

    return { success: true };
  }

  /**
   * Add video to playlist
   */
  static async addVideoToPlaylist(data: AddVideoToPlaylistDTO) {
    const { playlistId, videoId, userId } = data;

    // Check playlist ownership
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        _count: {
          select: { videos: true },
        },
      },
    });

    if (!playlist) {
      throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
    }

    if (playlist.userId !== userId) {
      throw new AppError(403, 'You do not own this playlist', 'FORBIDDEN');
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new AppError(404, 'Video not found', 'VIDEO_NOT_FOUND');
    }

    // Check if video already in playlist
    const existing = await prisma.playlistVideo.findUnique({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    });

    if (existing) {
      throw new AppError(400, 'Video already in playlist', 'DUPLICATE_VIDEO');
    }

    // Add video at the end (position = current count)
    const playlistVideo = await prisma.playlistVideo.create({
      data: {
        playlistId,
        videoId,
        position: playlist._count.videos,
      },
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
    });

    // Update playlist stats
    await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        videosCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    logger.info('Video added to playlist', { playlistId, videoId, userId });

    // Clear cache
    await cache.delete(`playlists:user:${userId}`);
    await cache.delete(`playlist:${playlistId}`);

    return playlistVideo;
  }

  /**
   * Remove video from playlist
   */
  static async removeVideoFromPlaylist(playlistId: string, videoId: string, userId: string) {
    // Check ownership
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
    }

    if (playlist.userId !== userId) {
      throw new AppError(403, 'You do not own this playlist', 'FORBIDDEN');
    }

    // Check if video in playlist
    const playlistVideo = await prisma.playlistVideo.findUnique({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    });

    if (!playlistVideo) {
      throw new AppError(404, 'Video not in playlist', 'VIDEO_NOT_IN_PLAYLIST');
    }

    // Remove video
    await prisma.playlistVideo.delete({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    });

    // Update positions of videos after this one
    await prisma.playlistVideo.updateMany({
      where: {
        playlistId,
        position: { gt: playlistVideo.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    // Update playlist stats
    await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        videosCount: { decrement: 1 },
        updatedAt: new Date(),
      },
    });

    logger.info('Video removed from playlist', { playlistId, videoId, userId });

    // Clear cache
    await cache.delete(`playlists:user:${userId}`);
    await cache.delete(`playlist:${playlistId}`);

    return { success: true };
  }

  /**
   * Reorder videos in playlist
   */
  static async reorderPlaylist(
    playlistId: string,
    userId: string,
    videoOrders: { videoId: string; position: number }[]
  ) {
    // Check ownership
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
    }

    if (playlist.userId !== userId) {
      throw new AppError(403, 'You do not own this playlist', 'FORBIDDEN');
    }

    // Update positions in transaction
    await prisma.$transaction(
      videoOrders.map((order) =>
        prisma.playlistVideo.update({
          where: {
            playlistId_videoId: {
              playlistId,
              videoId: order.videoId,
            },
          },
          data: {
            position: order.position,
          },
        })
      )
    );

    logger.info('Playlist reordered', { playlistId, userId, count: videoOrders.length });

    // Clear cache
    await cache.delete(`playlists:user:${userId}`);
    await cache.delete(`playlist:${playlistId}`);

    return { success: true };
  }

  /**
   * Get or create "Liked Videos" system playlist
   */
  static async getLikedVideosPlaylist(userId: string) {
    let playlist = await prisma.playlist.findFirst({
      where: {
        userId,
        isSystem: true,
        name: 'Liked Videos',
      },
    });

    if (!playlist) {
      playlist = await prisma.playlist.create({
        data: {
          userId,
          name: 'Liked Videos',
          description: 'Videos you have liked',
          isSystem: true,
          isPublic: false,
        },
      });
    }

    return playlist;
  }

  /**
   * Get public playlists (discover)
   */
  static async getPublicPlaylists(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where: {
          isPublic: true,
          isSystem: false,
          videosCount: { gt: 0 }, // Only playlists with videos
        },
        skip,
        take: limit,
        orderBy: [
          { viewsCount: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              videos: true,
            },
          },
        },
      }),
      prisma.playlist.count({
        where: {
          isPublic: true,
          isSystem: false,
          videosCount: { gt: 0 },
        },
      }),
    ]);

    // Get thumbnails
    for (const playlist of playlists) {
      if (!playlist.thumbnailUrl) {
        const firstVideo = await prisma.playlistVideo.findFirst({
          where: { playlistId: playlist.id },
          orderBy: { position: 'asc' },
          include: {
            video: {
              select: {
                thumbnailUrl: true,
              },
            },
          },
        });

        if (firstVideo) {
          playlist.thumbnailUrl = firstVideo.video.thumbnailUrl;
        }
      }
    }

    return {
      playlists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
