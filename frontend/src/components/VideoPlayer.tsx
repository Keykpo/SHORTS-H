'use client';

import { useRef, useEffect, useState } from 'react';
import { Video } from '@/types';
import { VideoService } from '@/services/video.service';
import { watchHistoryService } from '@/services/watch-history.service';

interface VideoPlayerProps {
  video: Video;
  isActive: boolean;
  onVideoEnd?: () => void;
}

export default function VideoPlayer({ video, isActive, onVideoEnd }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(video.isLiked || false);
  const [likesCount, setLikesCount] = useState(video.likesCount);
  const watchStartTime = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      // Play video when it becomes active
      videoElement.play().then(() => {
        setIsPlaying(true);
        watchStartTime.current = Date.now();
      }).catch(console.error);

      // Start tracking watch progress every 5 seconds
      progressIntervalRef.current = setInterval(() => {
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;

        if (duration > 0 && currentTime > 0) {
          watchHistoryService.updateProgress({
            videoId: video.id,
            watchedDuration: Math.floor(currentTime),
            totalDuration: Math.floor(duration),
          }).catch(console.error);
        }
      }, 5000);
    } else {
      // Pause when not active
      videoElement.pause();
      setIsPlaying(false);

      // Clear progress tracking interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Record final watch duration
      if (watchStartTime.current > 0) {
        const watchDuration = Math.floor((Date.now() - watchStartTime.current) / 1000);
        if (watchDuration > 0) {
          VideoService.recordView(video.id, watchDuration).catch(console.error);

          // Update watch history with final progress
          const currentTime = videoElement.currentTime;
          const duration = videoElement.duration;
          if (duration > 0 && currentTime > 0) {
            watchHistoryService.updateProgress({
              videoId: video.id,
              watchedDuration: Math.floor(currentTime),
              totalDuration: Math.floor(duration),
            }).catch(console.error);
          }
        }
        watchStartTime.current = 0;
      }
    }

    // Cleanup on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isActive, video.id]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
      setIsPlaying(false);
    } else {
      videoElement.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const toggleMute = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleLike = async () => {
    try {
      const result = await VideoService.toggleLike(video.id);
      setIsLiked(result.liked);
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="relative w-full h-screen bg-black snap-start snap-always">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        src={video.video720pUrl || video.videoUrl}
        loop
        playsInline
        muted={isMuted}
        onEnded={onVideoEnd}
        onClick={togglePlay}
      />

      {/* NSFW Warning Overlay */}
      {video.isNsfw && video.nsfwLevel === 'EXPLICIT' && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          18+ EXPLICIT
        </div>
      )}

      {/* User Info - Top Left */}
      <div className="absolute top-4 left-4 right-20 z-10">
        <div className="flex items-center gap-3">
          <img
            src={video.user.avatarUrl || '/default-avatar.png'}
            alt={video.user.username}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm">
                @{video.user.username}
              </p>
              {video.user.isPremium && (
                <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">
                  PRO
                </span>
              )}
            </div>
            <p className="text-white text-xs truncate">{video.title}</p>
          </div>
          <button className="px-4 py-1.5 bg-primary-600 text-white rounded-full text-sm font-semibold hover:bg-primary-700 transition-colors">
            Seguir
          </button>
        </div>

        {/* Description */}
        {video.description && (
          <p className="text-white text-sm mt-2 line-clamp-2">
            {video.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {video.tags.slice(0, 5).map((tag) => (
            <span
              key={tag.id}
              className="text-primary-300 text-xs hover:underline cursor-pointer"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons - Right Side */}
      <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-6">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 group"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isLiked ? 'bg-primary-600' : 'bg-dark-700 bg-opacity-80'
          } hover:bg-primary-600`}>
            <svg
              className="w-6 h-6 text-white"
              fill={isLiked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <span className="text-white text-xs font-semibold">
            {formatNumber(likesCount)}
          </span>
        </button>

        {/* Comment Button */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-dark-700 bg-opacity-80 flex items-center justify-center hover:bg-primary-600 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <span className="text-white text-xs font-semibold">
            {formatNumber(video.commentsCount)}
          </span>
        </button>

        {/* Share Button */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-dark-700 bg-opacity-80 flex items-center justify-center hover:bg-primary-600 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </div>
          <span className="text-white text-xs font-semibold">
            {formatNumber(video.sharesCount)}
          </span>
        </button>

        {/* Mute/Unmute Button */}
        <button onClick={toggleMute} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-dark-700 bg-opacity-80 flex items-center justify-center hover:bg-primary-600 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMuted ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              )}
            </svg>
          </div>
        </button>
      </div>

      {/* Play/Pause Indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Stats - Bottom Left */}
      <div className="absolute bottom-4 left-4 text-white text-xs">
        <div className="flex items-center gap-2">
          <span>{formatNumber(video.viewsCount)} views</span>
          <span>•</span>
          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
