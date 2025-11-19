'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recommendationService } from '@/services/recommendation.service';
import VideoPlayer from '@/components/VideoPlayer';
import Navigation from '@/components/Navigation';

export default function ForYouPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationService.getForYou({ limit: 20, excludeWatched: true }),
  });

  // Handle scroll to detect current video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const windowHeight = window.innerHeight;
      const newIndex = Math.round(scrollPosition / windowHeight);

      if (newIndex !== currentIndex && recommendations && newIndex < recommendations.length) {
        setCurrentIndex(newIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex, recommendations]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container || !recommendations) return;

      if (e.key === 'ArrowUp' && currentIndex > 0) {
        container.scrollTo({
          top: (currentIndex - 1) * window.innerHeight,
          behavior: 'smooth',
        });
      } else if (e.key === 'ArrowDown' && currentIndex < recommendations.length - 1) {
        container.scrollTo({
          top: (currentIndex + 1) * window.innerHeight,
          behavior: 'smooth',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, recommendations]);

  if (isLoading || !recommendations) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando recomendaciones personalizadas...</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
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
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">
            No hay recomendaciones disponibles
          </h3>
          <p className="text-dark-400 mb-6">
            Mira algunos videos para recibir recomendaciones personalizadas
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Explorar Videos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative">
      {/* Navigation overlay */}
      <div className="fixed top-4 left-4 z-50">
        <a
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-dark-900 bg-opacity-80 rounded-lg hover:bg-opacity-100 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-white font-semibold">Volver</span>
        </a>
      </div>

      {/* Title overlay */}
      <div className="fixed top-4 right-4 z-50">
        <div className="px-4 py-2 bg-primary-600 bg-opacity-90 rounded-lg">
          <span className="text-white font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            Para Ti
          </span>
        </div>
      </div>

      {/* Video Feed */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {recommendations.map((video: any, index: number) => (
          <VideoPlayer
            key={video.id}
            video={video}
            isActive={index === currentIndex}
            onVideoEnd={() => {
              if (index < recommendations.length - 1 && containerRef.current) {
                containerRef.current.scrollTo({
                  top: (index + 1) * window.innerHeight,
                  behavior: 'smooth',
                });
              }
            }}
          />
        ))}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Navigation />
      </div>
    </div>
  );
}
