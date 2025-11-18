import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-this',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '500000000', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedFormats: (process.env.ALLOWED_VIDEO_FORMATS || 'mp4,mov,avi,mkv,webm').split(','),
  },

  // Storage
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'anime-shorts-videos',
    },
    cdnUrl: process.env.CDN_URL || '',
  },

  // Video Processing
  video: {
    ffmpegPath: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
    qualities: (process.env.VIDEO_QUALITIES || '1080p,720p,480p').split(','),
    thumbnailCount: parseInt(process.env.THUMBNAIL_COUNT || '3', 10),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    sessionSecret: process.env.SESSION_SECRET || 'session-secret-change-this',
  },

  // Age Verification
  ageVerification: {
    minimumAge: parseInt(process.env.MINIMUM_AGE || '18', 10),
    required: process.env.AGE_VERIFICATION_REQUIRED === 'true',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

// Validate critical configuration
function validateConfig() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateConfig();

export default config;
