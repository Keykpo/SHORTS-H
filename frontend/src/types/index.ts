// User types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isAgeVerified: boolean;
  isPremium: boolean;
  createdAt: string;
}

// Video types
export interface Video {
  id: string;
  userId: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  video1080pUrl?: string;
  video720pUrl?: string;
  video480pUrl?: string;
  duration: number;
  width?: number;
  height?: number;
  isNsfw: boolean;
  nsfwLevel: 'SOFT' | 'MODERATE' | 'EXPLICIT';
  contentWarnings: string[];
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';
  viewsCount: number;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  publishedAt?: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isPremium: boolean;
  };
  tags: Tag[];
  isLiked?: boolean;
  isFavorited?: boolean;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  category: 'GENRE' | 'CHARACTER' | 'STYLE' | 'THEME' | 'CONTENT';
  isNsfw: boolean;
}

// Comment types
export interface Comment {
  id: string;
  userId: string;
  videoId: string;
  parentId?: string;
  content: string;
  likesCount: number;
  isPinned: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  replies?: Comment[];
}

// Auth types
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  birthDate: string;
  agreedToTerms: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Video Feed types
export interface VideoFeedParams {
  page?: number;
  limit?: number;
  tags?: string[];
  nsfwOnly?: boolean;
  sortBy?: 'recent' | 'popular' | 'trending';
}

export interface VideoFeedResponse {
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
