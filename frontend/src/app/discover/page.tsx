'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { VideoService } from '@/services/video.service';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FiSearch } from 'react-icons/fi';

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: videosData, isLoading } = useQuery({
    queryKey: ['discoverVideos', selectedTags],
    queryFn: () =>
      VideoService.getFeed({
        page: 1,
        limit: 20,
        sortBy: 'popular',
        tags: selectedTags,
      }),
  });

  const popularTags = [
    'Acción', 'Romance', 'Comedia', 'Ecchi', 'Hentai',
    'Shonen', 'Seinen', 'Mecha', 'Fantasy', 'Slice of Life'
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Descubrir</h1>
            <p className="text-dark-400">Explora contenido popular y tendencias</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar videos, tags, creadores..."
                className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Tag Filters */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Filtrar por categoría</h2>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Videos Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-dark-800 rounded-lg overflow-hidden animate-pulse">
                  <div className="aspect-video bg-dark-700"></div>
                  <div className="p-3">
                    <div className="h-4 bg-dark-700 rounded mb-2"></div>
                    <div className="h-3 bg-dark-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : videosData && videosData.videos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videosData.videos.map((video: any) => (
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
                    <p className="text-dark-400 text-xs mb-1">@{video.user.username}</p>
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
              <FiSearch className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No se encontraron videos
              </h3>
              <p className="text-dark-400">
                Intenta con otros filtros o busca algo diferente
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
