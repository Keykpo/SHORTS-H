'use client';

import { useQuery } from '@tanstack/react-query';
import { watchHistoryService } from '@/services/watch-history.service';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FiClock, FiTrash2, FiPlay } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function WatchHistoryPage() {
  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['watchHistory'],
    queryFn: () => watchHistoryService.getHistory({ page: 1, limit: 50 }),
  });

  const { data: continueWatching } = useQuery({
    queryKey: ['continueWatching'],
    queryFn: () => watchHistoryService.getContinueWatching(),
  });

  const { data: stats } = useQuery({
    queryKey: ['watchStats'],
    queryFn: () => watchHistoryService.getStats(),
  });

  const handleClearHistory = async () => {
    if (confirm('¿Estás seguro de que quieres borrar todo tu historial?')) {
      try {
        await watchHistoryService.clearHistory();
        toast.success('Historial borrado');
        refetch();
      } catch (error) {
        toast.error('Error al borrar el historial');
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

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
              <h1 className="text-3xl font-bold text-white mb-2">Historial de Reproducción</h1>
              <p className="text-dark-400">Sigue viendo donde lo dejaste</p>
            </div>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-600 hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <FiTrash2 className="w-4 h-4" />
              <span>Borrar Historial</span>
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <p className="text-dark-400 text-sm mb-1">Videos Vistos</p>
                <p className="text-white text-3xl font-bold">{stats.totalVideos}</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <p className="text-dark-400 text-sm mb-1">Tiempo Total</p>
                <p className="text-white text-3xl font-bold">{formatDuration(stats.totalWatchTime)}</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <p className="text-dark-400 text-sm mb-1">Tasa de Finalización</p>
                <p className="text-white text-3xl font-bold">{stats.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Continue Watching */}
          {continueWatching && continueWatching.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Continuar Viendo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {continueWatching.map((item: any) => (
                  <Link
                    key={item.video.id}
                    href={`/video/${item.video.id}`}
                    className="group bg-dark-800 rounded-lg overflow-hidden hover:bg-dark-700 transition-colors"
                  >
                    <div className="relative aspect-video bg-dark-700">
                      <img
                        src={item.video.thumbnailUrl}
                        alt={item.video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40">
                        <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center">
                          <FiPlay className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-600">
                        <div
                          className="h-full bg-primary-600"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1 line-clamp-2">
                        {item.video.title}
                      </h3>
                      <p className="text-dark-400 text-sm mb-2">
                        @{item.video.user.username}
                      </p>
                      <p className="text-primary-400 text-sm">
                        {item.progressPercent.toFixed(0)}% completado
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Full History */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : history && history.length > 0 ? (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">Historial Completo</h2>
              <div className="space-y-4">
                {history.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex gap-4 bg-dark-800 rounded-lg p-4 hover:bg-dark-700 transition-colors"
                  >
                    <Link href={`/video/${item.video.id}`} className="flex-shrink-0">
                      <div className="relative w-40 aspect-video bg-dark-700 rounded overflow-hidden">
                        <img
                          src={item.video.thumbnailUrl}
                          alt={item.video.title}
                          className="w-full h-full object-cover"
                        />
                        {item.completed && (
                          <div className="absolute top-2 left-2 bg-green-600 px-2 py-1 rounded text-xs text-white font-semibold">
                            Completado
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/video/${item.video.id}`}>
                        <h3 className="text-white font-semibold mb-1 hover:text-primary-400 transition-colors">
                          {item.video.title}
                        </h3>
                      </Link>
                      <p className="text-dark-400 text-sm mb-2">
                        @{item.video.user.username}
                      </p>
                      <div className="flex items-center gap-4 text-dark-400 text-sm">
                        <span>{formatNumber(item.video.viewsCount)} vistas</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          {new Date(item.lastWatchedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <FiClock className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay historial de reproducción
              </h3>
              <p className="text-dark-400 mb-6">
                Los videos que veas aparecerán aquí
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Explorar Videos
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
