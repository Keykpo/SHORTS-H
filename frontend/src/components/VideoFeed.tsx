'use client';

import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Video } from '@/types';
import { VideoService } from '@/services/video.service';
import VideoPlayer from './VideoPlayer';
import { useAuthStore } from '@/store/useAuthStore';

export default function VideoFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  // Load initial videos
  useEffect(() => {
    loadVideos(1);
  }, []);

  const loadVideos = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await VideoService.getFeed({
        page: pageNum,
        limit: 10,
        sortBy: 'recent',
      });

      if (pageNum === 1) {
        setVideos(response.videos);
      } else {
        setVideos(prev => [...prev, ...response.videos]);
      }

      setHasMore(response.pagination.hasMore);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load videos:', error);
      setLoading(false);
    }
  };

  // Handle scroll to detect current video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const windowHeight = window.innerHeight;
      const newIndex = Math.round(scrollPosition / windowHeight);

      if (newIndex !== currentIndex && newIndex < videos.length) {
        setCurrentIndex(newIndex);

        // Load more videos when approaching the end
        if (newIndex >= videos.length - 3 && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadVideos(nextPage);
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex, videos.length, hasMore, loading, page]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (e.key === 'ArrowUp' && currentIndex > 0) {
        container.scrollTo({
          top: (currentIndex - 1) * window.innerHeight,
          behavior: 'smooth',
        });
      } else if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) {
        container.scrollTo({
          top: (currentIndex + 1) * window.innerHeight,
          behavior: 'smooth',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length]);

  if (loading && videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando videos...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center px-4">
          <svg
            className="w-16 h-16 text-dark-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">
            No hay videos disponibles
          </h3>
          <p className="text-dark-400">
            Intenta ajustar tus filtros o vuelve más tarde
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollBehavior: 'smooth' }}
    >
      {videos.map((video, index) => (
        <VideoPlayer
          key={video.id}
          video={video}
          isActive={index === currentIndex}
          onVideoEnd={() => {
            // Auto-scroll to next video on end
            if (index < videos.length - 1 && containerRef.current) {
              containerRef.current.scrollTo({
                top: (index + 1) * window.innerHeight,
                behavior: 'smooth',
              });
            }
          }}
        />
      ))}

      {/* Loading indicator at the end */}
      {loading && videos.length > 0 && (
        <div className="h-screen flex items-center justify-center bg-black snap-start">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* End of feed message */}
      {!hasMore && videos.length > 0 && (
        <div className="h-screen flex items-center justify-center bg-black snap-start">
          <div className="text-center px-4">
            <p className="text-white text-lg mb-2">¡Has visto todos los videos!</p>
            <p className="text-dark-400">Vuelve más tarde para más contenido</p>
          </div>
        </div>
      )}
    </div>
  );
}
