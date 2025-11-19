import { Metadata } from 'next';

export const siteConfig = {
  name: 'AnimeShorts',
  description: 'Plataforma de videos cortos de anime para adultos (+18)',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://animeshorts.com',
  ogImage: '/og-image.png',
  keywords: [
    'anime',
    'shorts',
    'videos',
    'adult',
    'hentai',
    'ecchi',
    'anime videos',
    'short videos',
    'adult anime',
  ],
};

/**
 * Generate metadata for pages
 */
export function generateMetadata({
  title,
  description,
  image,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const pageDescription = description || siteConfig.description;
  const pageImage = image || siteConfig.ogImage;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: siteConfig.keywords,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      type: 'website',
      locale: 'es_ES',
      url: siteConfig.url,
      title: pageTitle,
      description: pageDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
  };
}

/**
 * Generate metadata for video pages
 */
export function generateVideoMetadata({
  title,
  description,
  thumbnail,
  username,
  tags,
}: {
  title: string;
  description?: string;
  thumbnail: string;
  username: string;
  tags?: string[];
}): Metadata {
  const pageTitle = `${title} por @${username}`;
  const pageDescription =
    description || `Mira este video de ${username} en ${siteConfig.name}`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [...siteConfig.keywords, ...(tags || [])],
    robots: 'noindex, nofollow', // Adult content - don't index
    openGraph: {
      type: 'video.other',
      locale: 'es_ES',
      url: siteConfig.url,
      title: pageTitle,
      description: pageDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: thumbnail,
          width: 1280,
          height: 720,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'player',
      title: pageTitle,
      description: pageDescription,
      images: [thumbnail],
    },
  };
}

/**
 * Generate metadata for profile pages
 */
export function generateProfileMetadata({
  username,
  displayName,
  bio,
  avatar,
  videosCount,
  followersCount,
}: {
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  videosCount?: number;
  followersCount?: number;
}): Metadata {
  const name = displayName || username;
  const pageTitle = `${name} (@${username})`;
  const pageDescription =
    bio ||
    `Perfil de ${name} en ${siteConfig.name}. ${videosCount || 0} videos, ${followersCount || 0} seguidores.`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [...siteConfig.keywords, username, displayName || username],
    robots: 'noindex, nofollow', // Adult content - don't index
    openGraph: {
      type: 'profile',
      locale: 'es_ES',
      url: `${siteConfig.url}/profile/${username}`,
      title: pageTitle,
      description: pageDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: avatar || siteConfig.ogImage,
          width: 400,
          height: 400,
          alt: name,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: pageDescription,
      images: [avatar || siteConfig.ogImage],
    },
  };
}
