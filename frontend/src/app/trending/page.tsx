'use client';

import { useQuery } from '@tanstack/react-query';
import { VideoService } from '@/services/video.service';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FiTrendingUp, FiEye, FiHeart } from 'react-icons/fi';

export default function TrendingPage() {
  const { data: videosData, isLoading } = useQuery({
    queryKey: ['trendingVideos'],
    queryFn: () =>
      VideoService.getFeed({
        page: 1,
        limit: 30,
        sortBy: 'trending',
      }),
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
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <FiTrendingUp className="w-8 h-8 text-primary-500" />
              <h1 className="text-3xl font-bold text-white">Tendencias</h1>
            </div>
            <p className="text-dark-400">Los videos más populares en este momento</p>
          </div>

          {/* Videos List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex gap-4 bg-dark-800 rounded-lg p-4 animate-pulse">
                  <div className="flex-shrink-0 w-12 h-12 bg-dark-700 rounded-full"></div>
                  <div className="flex-shrink-0 w-40 aspect-video bg-dark-700 rounded"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-dark-700 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-dark-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : videosData && videosData.videos.length > 0 ? (
            <div className="space-y-4">
              {videosData.videos.map((video: any, index: number) => (
                <div key={video.id} className="flex items-center gap-4 bg-dark-800 rounded-lg p-4 hover:bg-dark-700 transition-colors">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-dark-700 text-white'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <Link href={`/video/${video.id}`} className="flex-shrink-0">
                    <div className="relative w-40 aspect-video bg-dark-700 rounded overflow-hidden group">
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
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/video/${video.id}`}>
                      <h3 className="text-white font-semibold text-lg mb-1 hover:text-primary-400 transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                    </Link>
                    <p className="text-dark-400 text-sm mb-2">
                      @{video.user.username}
                      {video.user.isPremium && (
                        <span className="ml-2 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">
                          PRO
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-4 text-dark-400 text-sm">
                      <span className="flex items-center gap-1">
                        <FiEye className="w-4 h-4" />
                        {formatNumber(video.viewsCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiHeart className="w-4 h-4" />
                        {formatNumber(video.likesCount)}
                      </span>
                      <span>
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex-shrink-0">
                    <Link
                      href={`/video/${video.id}`}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Ver Ahora
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FiTrendingUp className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay tendencias disponibles
              </h3>
              <p className="text-dark-400">
                Vuelve más tarde para ver los videos más populares
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
