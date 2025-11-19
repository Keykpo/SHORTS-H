'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import Navigation from '@/components/Navigation';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiEye, FiHeart, FiMessageCircle, FiUsers, FiTrendingUp } from 'react-icons/fi';

export default function AnalyticsPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analyticsOverview'],
    queryFn: () => analyticsService.getOverview(),
  });

  const { data: growth } = useQuery({
    queryKey: ['analyticsGrowth'],
    queryFn: () => analyticsService.getGrowth({ days: 30 }),
  });

  const { data: bestTime } = useQuery({
    queryKey: ['analyticsBestTime'],
    queryFn: () => analyticsService.getBestTimeToPost(),
  });

  const { data: topVideos } = useQuery({
    queryKey: ['analyticsTopVideos'],
    queryFn: () => analyticsService.getTopVideos({ limit: 5, metric: 'views' }),
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
    <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-600 bg-opacity-20`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            <FiTrendingUp className={`w-4 h-4 ${trend < 0 ? 'transform rotate-180' : ''}`} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-dark-400 text-sm mb-1">{label}</p>
      <p className="text-white text-3xl font-bold">{value}</p>
    </div>
  );

  if (isLoading || !overview) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <main className="md:ml-64 pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
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
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard de Creador</h1>
            <p className="text-dark-400">Analiza el rendimiento de tu contenido</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={FiEye}
              label="Vistas Totales"
              value={formatNumber(overview.totalViews)}
              color="blue"
            />
            <StatCard
              icon={FiHeart}
              label="Me Gusta"
              value={formatNumber(overview.totalLikes)}
              color="red"
            />
            <StatCard
              icon={FiMessageCircle}
              label="Comentarios"
              value={formatNumber(overview.totalComments)}
              color="green"
            />
            <StatCard
              icon={FiUsers}
              label="Seguidores"
              value={formatNumber(overview.totalFollowers)}
              color="purple"
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <p className="text-dark-400 text-sm mb-1">Tasa de Engagement</p>
              <p className="text-white text-2xl font-bold">{overview.engagementRate.toFixed(2)}%</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <p className="text-dark-400 text-sm mb-1">Tasa de Finalización</p>
              <p className="text-white text-2xl font-bold">{overview.averageCompletionRate.toFixed(1)}%</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <p className="text-dark-400 text-sm mb-1">Videos Publicados</p>
              <p className="text-white text-2xl font-bold">{overview.totalVideos}</p>
            </div>
          </div>

          {/* Growth Chart */}
          {growth && growth.length > 0 && (
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700 mb-8">
              <h2 className="text-xl font-semibold text-white mb-6">Crecimiento (Últimos 30 días)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} name="Vistas" />
                  <Line type="monotone" dataKey="followers" stroke="#8B5CF6" strokeWidth={2} name="Seguidores" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Best Time to Post */}
          {bestTime && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <h2 className="text-xl font-semibold text-white mb-6">Mejor Hora para Publicar</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={bestTime.byHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                    <Bar dataKey="avgEngagement" fill="#10B981" name="Engagement Promedio" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <h2 className="text-xl font-semibold text-white mb-6">Mejor Día para Publicar</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={bestTime.byDayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="dayName" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                    <Bar dataKey="avgEngagement" fill="#F59E0B" name="Engagement Promedio" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Videos */}
          {topVideos && topVideos.length > 0 && (
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h2 className="text-xl font-semibold text-white mb-6">Videos Más Populares</h2>
              <div className="space-y-4">
                {topVideos.map((video: any, index: number) => (
                  <div key={video.id} className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-bold">
                      {index + 1}
                    </div>
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{video.title}</h3>
                      <div className="flex items-center gap-4 text-dark-400 text-sm mt-1">
                        <span>{formatNumber(video.viewsCount)} vistas</span>
                        <span>{formatNumber(video.likesCount)} likes</span>
                        <span>{formatNumber(video.commentsCount)} comentarios</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
