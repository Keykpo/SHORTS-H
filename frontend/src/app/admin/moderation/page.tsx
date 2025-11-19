'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService } from '@/services/admin.service';
import Navigation from '@/components/Navigation';
import { FiCheck, FiX, FiAlertTriangle, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: queue, isLoading } = useQuery({
    queryKey: ['moderationQueue'],
    queryFn: () => AdminService.getModerationQueue({ limit: 20 }),
  });

  const approveMutation = useMutation({
    mutationFn: (videoId: string) => AdminService.moderateVideo(videoId, 'approve'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationQueue'] });
      toast.success('Video aprobado');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ videoId, reason }: { videoId: string; reason: string }) =>
      AdminService.moderateVideo(videoId, 'reject', reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationQueue'] });
      toast.success('Video rechazado');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedVideo(null);
    },
  });

  const handleApprove = (video: any) => {
    if (confirm(`¿Aprobar el video "${video.title}"?`)) {
      approveMutation.mutate(video.id);
    }
  };

  const handleReject = (video: any) => {
    setSelectedVideo(video);
    setShowRejectModal(true);
  };

  const submitReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Debes proporcionar una razón para el rechazo');
      return;
    }
    rejectMutation.mutate({
      videoId: selectedVideo.id,
      reason: rejectReason,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-ES');
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Cola de Moderación</h1>
                <p className="text-dark-400">
                  Revisa y aprueba contenido antes de publicación
                </p>
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
              >
                Volver al Panel
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <p className="text-dark-400 text-sm mb-1">Videos Pendientes</p>
              <p className="text-white text-3xl font-bold">{queue?.length || 0}</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <p className="text-dark-400 text-sm mb-1">Hoy Aprobados</p>
              <p className="text-white text-3xl font-bold text-green-500">0</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <p className="text-dark-400 text-sm mb-1">Hoy Rechazados</p>
              <p className="text-white text-3xl font-bold text-red-500">0</p>
            </div>
          </div>

          {/* Videos Queue */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : queue && queue.length > 0 ? (
            <div className="space-y-6">
              {queue.map((video: any) => (
                <div
                  key={video.id}
                  className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                    {/* Video Preview */}
                    <div className="md:col-span-1">
                      <div className="relative aspect-video bg-dark-700 rounded-lg overflow-hidden mb-3">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        {video.isNsfw && (
                          <div className="absolute top-2 left-2 bg-red-600 px-2 py-1 rounded text-xs text-white font-bold">
                            18+ {video.nsfwLevel}
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/video/${video.id}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        <span>Ver Video</span>
                      </Link>
                    </div>

                    {/* Video Info */}
                    <div className="md:col-span-2">
                      <h3 className="text-xl font-bold text-white mb-2">{video.title}</h3>

                      {video.description && (
                        <p className="text-dark-300 mb-4 line-clamp-3">{video.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-dark-400 text-sm">Creador</p>
                          <p className="text-white">@{video.user.username}</p>
                        </div>
                        <div>
                          <p className="text-dark-400 text-sm">Subido</p>
                          <p className="text-white">{formatDate(video.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-dark-400 text-sm">Duración</p>
                          <p className="text-white">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                        <div>
                          <p className="text-dark-400 text-sm">Tamaño</p>
                          <p className="text-white">{video.width}x{video.height}</p>
                        </div>
                      </div>

                      {/* Tags */}
                      {video.tags && video.tags.length > 0 && (
                        <div className="mb-4">
                          <p className="text-dark-400 text-sm mb-2">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {video.tags.map((tag: any) => (
                              <span
                                key={tag.id}
                                className="px-3 py-1 bg-dark-700 text-dark-300 rounded-full text-sm"
                              >
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content Warnings */}
                      {video.contentWarnings && video.contentWarnings.length > 0 && (
                        <div className="mb-4">
                          <p className="text-dark-400 text-sm mb-2">Advertencias de Contenido</p>
                          <div className="flex flex-wrap gap-2">
                            {video.contentWarnings.map((warning: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-yellow-600 bg-opacity-20 text-yellow-500 rounded-full text-sm flex items-center gap-1"
                              >
                                <FiAlertTriangle className="w-3 h-3" />
                                {warning}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(video)}
                          disabled={approveMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          <FiCheck className="w-5 h-5" />
                          <span>Aprobar</span>
                        </button>
                        <button
                          onClick={() => handleReject(video)}
                          disabled={rejectMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          <FiX className="w-5 h-5" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-dark-800 rounded-lg border border-dark-700">
              <FiCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                ¡Todo al día!
              </h3>
              <p className="text-dark-400">
                No hay videos pendientes de moderación
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
          <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md border border-dark-700">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Rechazar Video</h2>
              <p className="text-dark-300 mb-4">
                Estás rechazando: <span className="text-white font-semibold">{selectedVideo.title}</span>
              </p>

              <div className="mb-6">
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Razón del rechazo *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Explica por qué se rechaza este video..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedVideo(null);
                  }}
                  className="flex-1 px-4 py-3 bg-dark-700 text-white rounded-lg font-semibold hover:bg-dark-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitReject}
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {rejectMutation.isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
