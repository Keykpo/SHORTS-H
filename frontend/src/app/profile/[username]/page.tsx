'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/services/user.service';
import Navigation from '@/components/Navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiCalendar, FiVideo, FiHeart, FiUsers, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'videos' | 'playlists'>('videos');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => UserService.getProfile(username),
  });

  const { data: videos } = useQuery({
    queryKey: ['userVideos', username],
    queryFn: () => UserService.getUserVideos(username, { page: 1, limit: 20 }),
    enabled: activeTab === 'videos',
  });

  const { data: playlists } = useQuery({
    queryKey: ['userPlaylists', username],
    queryFn: () => UserService.getUserPlaylists(username),
    enabled: activeTab === 'playlists',
  });

  const followMutation = useMutation({
    mutationFn: () => UserService.toggleFollow(profile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      toast.success(profile.isFollowing ? 'Has dejado de seguir' : 'Ahora sigues a este usuario');
    },
  });

  const isOwnProfile = currentUser?.username === username;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <main className="md:ml-64 pb-20 md:pb-0">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Banner */}
          {profile.bannerUrl && (
            <div className="w-full h-48 md:h-64 rounded-lg overflow-hidden mb-6">
              <img
                src={profile.bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={profile.avatarUrl || '/default-avatar.png'}
                alt={profile.username}
                className="w-32 h-32 rounded-full border-4 border-dark-700"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {profile.displayName || profile.username}
                  </h1>
                  <p className="text-dark-400">@{profile.username}</p>
                  {profile.isPremium && (
                    <span className="inline-block mt-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                      PRO CREATOR
                    </span>
                  )}
                </div>

                {isOwnProfile ? (
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-6 py-2 bg-dark-800 text-white rounded-lg font-semibold hover:bg-dark-700 transition-colors"
                  >
                    <FiSettings className="w-5 h-5" />
                    <span>Editar Perfil</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => followMutation.mutate()}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      profile.isFollowing
                        ? 'bg-dark-800 text-white hover:bg-dark-700'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {profile.isFollowing ? 'Siguiendo' : 'Seguir'}
                  </button>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-white mb-4 whitespace-pre-wrap">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-white">
                <div className="flex items-center gap-2">
                  <FiVideo className="w-5 h-5 text-dark-400" />
                  <span className="font-semibold">{formatNumber(profile.videosCount || 0)}</span>
                  <span className="text-dark-400">videos</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUsers className="w-5 h-5 text-dark-400" />
                  <span className="font-semibold">{formatNumber(profile.followersCount || 0)}</span>
                  <span className="text-dark-400">seguidores</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUsers className="w-5 h-5 text-dark-400" />
                  <span className="font-semibold">{formatNumber(profile.followingCount || 0)}</span>
                  <span className="text-dark-400">siguiendo</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-5 h-5 text-dark-400" />
                  <span className="text-dark-400">
                    Se unió {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-dark-700 mb-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('videos')}
                className={`pb-4 px-2 font-semibold transition-colors relative ${
                  activeTab === 'videos'
                    ? 'text-primary-500'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Videos
                {activeTab === 'videos' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('playlists')}
                className={`pb-4 px-2 font-semibold transition-colors relative ${
                  activeTab === 'playlists'
                    ? 'text-primary-500'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Listas
                {activeTab === 'playlists' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'videos' && (
            <div>
              {videos && videos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {videos.map((video: any) => (
                    <Link
                      key={video.id}
                      href={`/video/${video.id}`}
                      className="group bg-dark-800 rounded-lg overflow-hidden hover:bg-dark-700 transition-colors"
                    >
                      <div className="relative aspect-video bg-dark-700 overflow-hidden">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {video.isNsfw && (
                          <div className="absolute top-2 left-2 bg-red-600 px-2 py-1 rounded text-xs text-white font-bold">
                            18+
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs text-white">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 text-dark-400 text-xs">
                          <span>{formatNumber(video.viewsCount)} views</span>
                          <span>•</span>
                          <span>{formatNumber(video.likesCount)} likes</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FiVideo className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No hay videos aún
                  </h3>
                  <p className="text-dark-400">
                    {isOwnProfile
                      ? 'Comienza a subir tu contenido'
                      : 'Este usuario aún no ha publicado videos'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'playlists' && (
            <div>
              {playlists && playlists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists.map((playlist: any) => (
                    <Link
                      key={playlist.id}
                      href={`/playlists/${playlist.id}`}
                      className="bg-dark-800 rounded-lg overflow-hidden hover:bg-dark-700 transition-colors"
                    >
                      <div className="relative aspect-video bg-dark-700">
                        {playlist.thumbnailUrl ? (
                          <img
                            src={playlist.thumbnailUrl}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiHeart className="w-16 h-16 text-dark-500" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs text-white">
                          {playlist.videosCount} videos
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold text-lg mb-1 truncate">
                          {playlist.name}
                        </h3>
                        {playlist.description && (
                          <p className="text-dark-400 text-sm line-clamp-2">
                            {playlist.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FiHeart className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No hay listas de reproducción
                  </h3>
                  <p className="text-dark-400">
                    {isOwnProfile
                      ? 'Crea tu primera lista de reproducción'
                      : 'Este usuario no tiene listas públicas'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
