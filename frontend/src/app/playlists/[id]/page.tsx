'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { playlistService } from '@/services/playlist.service';
import Navigation from '@/components/Navigation';
import ShareModal from '@/components/ShareModal';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPlay, FiShare2, FiEdit2, FiTrash2, FiLock, FiGlobe, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => playlistService.getPlaylistById(playlistId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => playlistService.deletePlaylist(playlistId),
    onSuccess: () => {
      toast.success('Lista eliminada');
      router.push('/playlists');
    },
    onError: () => {
      toast.error('Error al eliminar la lista');
    },
  });

  const removeVideoMutation = useMutation({
    mutationFn: (videoId: string) =>
      playlistService.removeVideoFromPlaylist(playlistId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      toast.success('Video eliminado de la lista');
    },
  });

  const isOwner = user?.id === playlist?.userId;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (isLoading || !playlist) {
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Playlist Header */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <div className="w-64 aspect-video bg-black bg-opacity-30 rounded-lg overflow-hidden">
                  {playlist.thumbnailUrl ? (
                    <img
                      src={playlist.thumbnailUrl}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiPlay className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {playlist.isPublic ? (
                        <div className="flex items-center gap-1 text-white text-sm">
                          <FiGlobe className="w-4 h-4" />
                          <span>Pública</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-white text-sm">
                          <FiLock className="w-4 h-4" />
                          <span>Privada</span>
                        </div>
                      )}
                      {playlist.isSystem && (
                        <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                          SISTEMA
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                      {playlist.name}
                    </h1>
                    {playlist.description && (
                      <p className="text-white text-opacity-90 mb-3">
                        {playlist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-white text-opacity-75 text-sm">
                      <Link
                        href={`/profile/${playlist.user.username}`}
                        className="hover:text-white transition-colors"
                      >
                        @{playlist.user.username}
                      </Link>
                      <span>•</span>
                      <span>{playlist.videosCount} videos</span>
                      <span>•</span>
                      <span>{formatNumber(playlist.viewsCount)} vistas</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {playlist.videosCount > 0 && (
                    <Link
                      href={`/video/${playlist.videos[0].video.id}`}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      <FiPlay className="w-5 h-5" />
                      <span>Reproducir Todo</span>
                    </Link>
                  )}

                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white bg-opacity-20 text-white rounded-lg font-semibold hover:bg-opacity-30 transition-colors"
                  >
                    <FiShare2 className="w-5 h-5" />
                    <span>Compartir</span>
                  </button>

                  {isOwner && !playlist.isSystem && (
                    <>
                      <button className="flex items-center gap-2 px-6 py-3 bg-white bg-opacity-20 text-white rounded-lg font-semibold hover:bg-opacity-30 transition-colors">
                        <FiEdit2 className="w-5 h-5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 bg-opacity-80 text-white rounded-lg font-semibold hover:bg-opacity-100 transition-colors"
                      >
                        <FiTrash2 className="w-5 h-5" />
                        <span>Eliminar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Videos List */}
          {playlist.videos && playlist.videos.length > 0 ? (
            <div className="space-y-4">
              {playlist.videos.map((item: any, index: number) => {
                const video = item.video;
                return (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 bg-dark-800 rounded-lg p-4 hover:bg-dark-700 transition-colors"
                  >
                    {/* Index */}
                    <div className="flex-shrink-0 w-8 text-center">
                      <span className="text-dark-400 font-semibold">{index + 1}</span>
                    </div>

                    {/* Thumbnail */}
                    <Link href={`/video/${video.id}`} className="flex-shrink-0">
                      <div className="relative w-40 aspect-video bg-dark-700 rounded overflow-hidden group">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40">
                          <FiPlay className="w-12 h-12 text-white" />
                        </div>
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/video/${video.id}`}>
                        <h3 className="text-white font-semibold mb-1 hover:text-primary-400 transition-colors line-clamp-2">
                          {video.title}
                        </h3>
                      </Link>
                      <p className="text-dark-400 text-sm mb-1">
                        @{video.user.username}
                      </p>
                      <div className="flex items-center gap-3 text-dark-400 text-sm">
                        <span>{formatNumber(video.viewsCount)} vistas</span>
                        <span>•</span>
                        <span>{formatNumber(video.likesCount)} likes</span>
                        <span>•</span>
                        <span>
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    {isOwner && !playlist.isSystem && (
                      <button
                        onClick={() => removeVideoMutation.mutate(video.id)}
                        className="flex-shrink-0 p-2 text-dark-400 hover:text-red-500 transition-colors"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-dark-800 rounded-lg">
              <FiPlay className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay videos en esta lista
              </h3>
              <p className="text-dark-400">
                {isOwner
                  ? 'Comienza a agregar videos a tu lista'
                  : 'Esta lista está vacía'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          playlistId={playlistId}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
          <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md border border-dark-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Confirmar Eliminación</h2>
            <p className="text-dark-300 mb-6">
              ¿Estás seguro de que quieres eliminar esta lista? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-dark-700 text-white rounded-lg font-semibold hover:bg-dark-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
