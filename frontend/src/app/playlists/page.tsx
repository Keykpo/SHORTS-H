'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { playlistService } from '@/services/playlist.service';
import Navigation from '@/components/Navigation';
import { FiPlus, FiList, FiLock, FiGlobe } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';
import CreatePlaylistModal from '@/components/CreatePlaylistModal';

export default function PlaylistsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: playlists, isLoading, refetch } = useQuery({
    queryKey: ['myPlaylists'],
    queryFn: () => playlistService.getMyPlaylists(),
  });

  const { data: likedVideosPlaylist } = useQuery({
    queryKey: ['likedVideosPlaylist'],
    queryFn: () => playlistService.getLikedVideos(),
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Mis Listas de Reproducción</h1>
              <p className="text-dark-400">Organiza y comparte tus videos favoritos</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <FiPlus className="w-5 h-5" />
              <span>Nueva Lista</span>
            </button>
          </div>

          {/* Liked Videos Playlist (System) */}
          {likedVideosPlaylist && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Favoritos</h2>
              <Link
                href={`/playlists/${likedVideosPlaylist.id}`}
                className="block bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg p-6 hover:scale-105 transition-transform"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-1">Videos Favoritos</h3>
                    <p className="text-white text-opacity-90 mb-2">Tus videos más queridos</p>
                    <p className="text-white text-opacity-75 text-sm">
                      {likedVideosPlaylist.videosCount} videos
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* User Playlists */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-dark-800 rounded-lg p-4 animate-pulse">
                  <div className="aspect-video bg-dark-700 rounded-lg mb-3"></div>
                  <div className="h-6 bg-dark-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-dark-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : playlists && playlists.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Mis Listas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map((playlist: any) => (
                  <Link
                    key={playlist.id}
                    href={`/playlists/${playlist.id}`}
                    className="bg-dark-800 rounded-lg overflow-hidden hover:bg-dark-700 transition-colors group"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-dark-700 relative overflow-hidden">
                      {playlist.thumbnailUrl ? (
                        <img
                          src={playlist.thumbnailUrl}
                          alt={playlist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiList className="w-16 h-16 text-dark-500" />
                        </div>
                      )}
                      {/* Privacy Indicator */}
                      <div className="absolute top-2 right-2">
                        {playlist.isPublic ? (
                          <div className="bg-green-600 bg-opacity-90 px-2 py-1 rounded flex items-center gap-1">
                            <FiGlobe className="w-3 h-3 text-white" />
                            <span className="text-white text-xs">Público</span>
                          </div>
                        ) : (
                          <div className="bg-dark-900 bg-opacity-90 px-2 py-1 rounded flex items-center gap-1">
                            <FiLock className="w-3 h-3 text-white" />
                            <span className="text-white text-xs">Privado</span>
                          </div>
                        )}
                      </div>
                      {/* Video Count Overlay */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded">
                        <span className="text-white text-xs font-semibold">
                          {playlist.videosCount} videos
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-white font-semibold text-lg mb-1 truncate">
                        {playlist.name}
                      </h3>
                      {playlist.description && (
                        <p className="text-dark-400 text-sm line-clamp-2 mb-2">
                          {playlist.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-dark-400 text-sm">
                        <span>{formatNumber(playlist.viewsCount)} views</span>
                        {playlist.sharesCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatNumber(playlist.sharesCount)} shares</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <FiList className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No tienes listas de reproducción
              </h3>
              <p className="text-dark-400 mb-6">
                Crea tu primera lista para organizar tus videos favoritos
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
              >
                <FiPlus className="w-5 h-5" />
                <span>Crear Lista</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          refetch();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
