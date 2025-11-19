'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminService } from '@/services/admin.service';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import {
  FiUsers,
  FiVideo,
  FiFlag,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
    // TODO: Check if user is admin when role system is implemented
  }, [isAuthenticated, router]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => AdminService.getStats(),
  });

  const { data: recentVideos } = useQuery({
    queryKey: ['adminRecentVideos'],
    queryFn: () => AdminService.getRecentVideos({ limit: 5 }),
  });

  const { data: pendingReports } = useQuery({
    queryKey: ['adminPendingReports'],
    queryFn: () => AdminService.getPendingReports({ limit: 5 }),
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (isLoading || !stats) {
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Panel de Administración</h1>
            <p className="text-dark-400">Gestiona la plataforma y modera contenido</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-600 bg-opacity-20 rounded-lg">
                  <FiUsers className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <p className="text-dark-400 text-sm mb-1">Total Usuarios</p>
              <p className="text-white text-3xl font-bold">{formatNumber(stats.totalUsers)}</p>
              <p className="text-green-500 text-sm mt-2">
                +{stats.newUsersToday} hoy
              </p>
            </div>

            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-600 bg-opacity-20 rounded-lg">
                  <FiVideo className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <p className="text-dark-400 text-sm mb-1">Total Videos</p>
              <p className="text-white text-3xl font-bold">{formatNumber(stats.totalVideos)}</p>
              <p className="text-green-500 text-sm mt-2">
                +{stats.newVideosToday} hoy
              </p>
            </div>

            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-600 bg-opacity-20 rounded-lg">
                  <FiClock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              <p className="text-dark-400 text-sm mb-1">Videos Pendientes</p>
              <p className="text-white text-3xl font-bold">{stats.pendingVideos}</p>
              <p className="text-yellow-500 text-sm mt-2">
                Requieren revisión
              </p>
            </div>

            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-600 bg-opacity-20 rounded-lg">
                  <FiFlag className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <p className="text-dark-400 text-sm mb-1">Reportes Pendientes</p>
              <p className="text-white text-3xl font-bold">{stats.pendingReports}</p>
              <p className="text-red-500 text-sm mt-2">
                Necesitan atención
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/admin/moderation"
              className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <FiVideo className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Moderar Videos</h3>
                  <p className="text-white text-opacity-80 text-sm">
                    {stats.pendingVideos} videos pendientes
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/reports"
              className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-6 hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <FiFlag className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Revisar Reportes</h3>
                  <p className="text-white text-opacity-80 text-sm">
                    {stats.pendingReports} reportes activos
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <FiUsers className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Gestionar Usuarios</h3>
                  <p className="text-white text-opacity-80 text-sm">
                    {formatNumber(stats.totalUsers)} usuarios totales
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Videos */}
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FiVideo className="w-5 h-5" />
                Videos Recientes
              </h2>
              {recentVideos && recentVideos.length > 0 ? (
                <div className="space-y-4">
                  {recentVideos.map((video: any) => (
                    <div key={video.id} className="flex items-center gap-4 p-3 bg-dark-700 rounded-lg">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{video.title}</h3>
                        <p className="text-dark-400 text-sm">@{video.user.username}</p>
                      </div>
                      <div>
                        {video.status === 'READY' ? (
                          <FiCheckCircle className="w-5 h-5 text-green-500" />
                        ) : video.status === 'PROCESSING' ? (
                          <FiClock className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <FiAlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-center py-8">No hay videos recientes</p>
              )}
            </div>

            {/* Pending Reports */}
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FiFlag className="w-5 h-5" />
                Reportes Recientes
              </h2>
              {pendingReports && pendingReports.length > 0 ? (
                <div className="space-y-4">
                  {pendingReports.map((report: any) => (
                    <div key={report.id} className="p-3 bg-dark-700 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-medium">{report.reason}</p>
                          <p className="text-dark-400 text-sm">
                            Reportado por @{report.reporter.username}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-red-600 bg-opacity-20 text-red-500 text-xs rounded">
                          Pendiente
                        </span>
                      </div>
                      <p className="text-dark-400 text-sm line-clamp-2">{report.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-center py-8">No hay reportes pendientes</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
