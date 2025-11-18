import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Request } from 'express';
import path from 'path';
import { config } from '../config';
import { AppError } from './error.middleware';

// Initialize S3 client
const s3Client = new S3Client({
  region: config.storage.aws.region,
  credentials: {
    accessKeyId: config.storage.aws.accessKeyId || '',
    secretAccessKey: config.storage.aws.secretAccessKey || '',
  },
});

// File filter for videos
const videoFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        'Invalid file type. Only video files are allowed (mp4, mov, avi, mkv, webm)',
        'INVALID_FILE_TYPE'
      ) as any
    );
  }
};

// File filter for images (thumbnails, avatars)
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        'Invalid file type. Only image files are allowed (jpg, png, webp)',
        'INVALID_FILE_TYPE'
      ) as any
    );
  }
};

// Storage configuration based on provider
const getStorage = (folder: string) => {
  if (config.storage.provider === 's3') {
    // S3 storage
    return multerS3({
      s3: s3Client,
      bucket: config.storage.aws.bucket,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req: Request, file: Express.Multer.File, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const fileName = `${folder}/${uniqueSuffix}${ext}`;
        cb(null, fileName);
      },
    });
  } else {
    // Local storage (development)
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, `${config.upload.uploadDir}/${folder}`);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    });
  }
};

// Video upload middleware
export const uploadVideo = multer({
  storage: getStorage('videos/raw'),
  fileFilter: videoFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 500MB default
  },
}).single('video');

// Thumbnail upload middleware
export const uploadThumbnail = multer({
  storage: getStorage('thumbnails'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('thumbnail');

// Avatar upload middleware
export const uploadAvatar = multer({
  storage: getStorage('avatars'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
}).single('avatar');

// Banner upload middleware
export const uploadBanner = multer({
  storage: getStorage('banners'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('banner');

// Multiple files upload (for future use)
export const uploadMultiple = (fieldName: string, maxCount: number) => {
  return multer({
    storage: getStorage('uploads'),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
    },
  }).array(fieldName, maxCount);
};

// Helper to get file URL
export const getFileUrl = (filePath: string): string => {
  if (config.storage.provider === 's3') {
    return `${config.storage.cdnUrl}/${filePath}`;
  } else {
    return `${config.apiUrl}/uploads/${filePath}`;
  }
};
