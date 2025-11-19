'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VideoService } from '@/services/video.service';
import { shareService } from '@/services/share.service';
import Navigation from '@/components/Navigation';
import CommentSection from '@/components/CommentSection';
import ShareModal from '@/components/ShareModal';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiHeart, FiMessageCircle, FiShare2, FiList, FiPlay } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

export default function VideoPage() {
  const params = useParams();
  const videoId = params.id as string;
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const { data: video, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => VideoService.getById(videoId),
  });

  const likeMutation = useMutation({
    mutationFn: () => VideoService.toggleLike(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      toast.success(video?.isLiked ? 'Like removido' : 'Video marcado como favorito');
    },
  });

  const handleShare = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para compartir');
      return;
    }
    setShowShareModal(true);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !video) {
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player Column */}
            <div className="lg:col-span-2">
              {/* Video Container */}
              <div className="bg-black rounded-lg overflow-hidden mb-6">
                <div className="relative aspect-video">
                  <video
                    controls
                    autoPlay
                    className="w-full h-full"
                    src={video.video720pUrl || video.videoUrl}
                    poster={video.thumbnailUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>

              {/* Video Info */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  {video.title}
                </h1>

                {/* Stats and Actions */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span className="text-dark-400 text-sm">
                    {formatNumber(video.viewsCount)} visualizaciones
                  </span>
                  <span className="text-dark-400 text-sm">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                  {video.isNsfw && (
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      18+ {video.nsfwLevel}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => likeMutation.mutate()}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                      video.isLiked
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-dark-800 text-white hover:bg-dark-700'
                    }`}
                  >
                    <FiHeart className={`w-5 h-5 ${video.isLiked ? 'fill-current' : ''}`} />
                    <span>{formatNumber(video.likesCount)}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg font-semibold hover:bg-dark-700 transition-colors"
                  >
                    <FiShare2 className="w-5 h-5" />
                    <span>{formatNumber(video.sharesCount)}</span>
                  </button>

                  <button
                    onClick={() => setShowAddToPlaylist(true)}
                    disabled={!isAuthenticated}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg font-semibold hover:bg-dark-700 transition-colors"
                  >
                    <FiList className="w-5 h-5" />
                    <span>Guardar</span>
                  </button>
                </div>
              </div>

              {/* Creator Info */}
              <div className="bg-dark-800 rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Link href={`/profile/${video.user.username}`}>
                      <img
                        src={video.user.avatarUrl || '/default-avatar.png'}
                        alt={video.user.username}
                        className="w-14 h-14 rounded-full"
                      />
                    </Link>
                    <div>
                      <Link
                        href={`/profile/${video.user.username}`}
                        className="text-white font-semibold text-lg hover:text-primary-400 transition-colors"
                      >
                        {video.user.displayName || video.user.username}
                      </Link>
                      <p className="text-dark-400 text-sm">@{video.user.username}</p>
                    </div>
                  </div>
                  {user?.id !== video.user.id && (
                    <button className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                      Seguir
                    </button>
                  )}
                </div>

                {video.description && (
                  <div className="mt-4 pt-4 border-t border-dark-700">
                    <p className="text-white whitespace-pre-wrap">{video.description}</p>
                  </div>
                )}

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {video.tags.map((tag: any) => (
                      <Link
                        key={tag.id}
                        href={`/discover?tag=${tag.slug}`}
                        className="text-primary-400 text-sm hover:underline"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <CommentSection videoId={videoId} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <h2 className="text-xl font-bold text-white mb-4">Videos Relacionados</h2>
                <div className="space-y-4">
                  {/* Placeholder for related videos - would be loaded from API */}
                  <p className="text-dark-400 text-sm">Cargando videos relacionados...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          videoId={videoId}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
