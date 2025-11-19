'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

/**
 * Optimized Image component with automatic fallback and loading states
 */
export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/default-avatar.png',
  className,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-dark-700 animate-pulse" />
      )}
      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        className={className}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc);
          setIsLoading(false);
        }}
        loading="lazy"
        quality={75}
      />
    </div>
  );
}

/**
 * Avatar component with optimized loading
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src || '/default-avatar.png'}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      fallbackSrc="/default-avatar.png"
    />
  );
}

/**
 * Video Thumbnail component with optimized loading
 */
export function OptimizedThumbnail({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1280}
      height={720}
      className={`object-cover ${className}`}
      fallbackSrc="/default-thumbnail.png"
      priority={false}
    />
  );
}
