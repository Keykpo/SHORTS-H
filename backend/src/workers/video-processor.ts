import Bull, { Job } from 'bull';
import ffmpeg from 'fluent-ffmpeg';
import { config } from '../config';
import { prisma } from '../config/database';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { logger } from '../config/logger';

// Set ffmpeg path if using @ffmpeg-installer
if (process.env.NODE_ENV === 'development') {
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// Initialize S3 client
const s3Client = new S3Client({
  region: config.storage.aws.region,
  credentials: {
    accessKeyId: config.storage.aws.accessKeyId || '',
    secretAccessKey: config.storage.aws.secretAccessKey || '',
  },
});

// Create video processing queue
export const videoQueue = new Bull('video-processing', {
  redis: {
    host: config.redisUrl.split(':')[0],
    port: parseInt(config.redisUrl.split(':')[1] || '6379'),
  },
});

interface VideoProcessingJob {
  videoId: string;
  inputPath: string;
  userId: string;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  format: string;
}

/**
 * Get video metadata using FFmpeg
 */
const getVideoMetadata = (filePath: string): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      resolve({
        duration: Math.floor(metadata.format.duration || 0),
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        format: metadata.format.format_name || 'unknown',
      });
    });
  });
};

/**
 * Transcode video to specific quality
 */
const transcodeVideo = (
  inputPath: string,
  outputPath: string,
  quality: '1080p' | '720p' | '480p'
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const resolutions = {
      '1080p': '1920x1080',
      '720p': '1280x720',
      '480p': '854x480',
    };

    const bitrates = {
      '1080p': '5000k',
      '720p': '2500k',
      '480p': '1000k',
    };

    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264', // Video codec
        '-preset medium', // Encoding speed/quality
        '-crf 23', // Constant Rate Factor (quality)
        `-b:v ${bitrates[quality]}`, // Video bitrate
        '-c:a aac', // Audio codec
        '-b:a 128k', // Audio bitrate
        '-movflags +faststart', // Enable streaming
        `-vf scale=${resolutions[quality]}:force_original_aspect_ratio=decrease,pad=${resolutions[quality]}:(ow-iw)/2:(oh-ih)/2`, // Scale and pad
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};

/**
 * Generate thumbnail from video
 */
const generateThumbnail = (
  inputPath: string,
  outputPath: string,
  timestamp: string = '00:00:02'
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720',
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
};

/**
 * Upload file to S3
 */
const uploadToS3 = async (
  filePath: string,
  s3Key: string,
  contentType: string
): Promise<string> => {
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: config.storage.aws.bucket,
    Key: s3Key,
    Body: fileContent,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return CDN URL
  return `${config.storage.cdnUrl}/${s3Key}`;
};

/**
 * Process video job
 */
videoQueue.process(async (job: Job<VideoProcessingJob>) => {
  const { videoId, inputPath, userId } = job.data;

  logger.info('Processing video', { videoId, userId });

  try {
    // Update status to processing
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'PROCESSING' },
    });

    // 1. Get video metadata
    job.progress(10);
    const metadata = await getVideoMetadata(inputPath);
    logger.info('Video metadata extracted', { videoId, metadata });

    // 2. Create temporary directory for processing
    const tempDir = path.join(config.upload.uploadDir, 'temp', videoId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 3. Transcode to multiple qualities
    const qualities = ['1080p', '720p', '480p'] as const;
    const videoUrls: Record<string, string> = {};

    for (let i = 0; i < qualities.length; i++) {
      const quality = qualities[i];
      job.progress(20 + i * 20);

      const outputPath = path.join(tempDir, `${quality}.mp4`);
      logger.info('Transcoding video', { videoId, quality });

      await transcodeVideo(inputPath, outputPath, quality);

      // Upload to S3 if configured
      if (config.storage.provider === 's3') {
        const s3Key = `videos/processed/${videoId}/${quality}.mp4`;
        videoUrls[quality] = await uploadToS3(outputPath, s3Key, 'video/mp4');
        fs.unlinkSync(outputPath); // Clean up local file
      } else {
        videoUrls[quality] = `/uploads/videos/processed/${videoId}/${quality}.mp4`;
      }

      logger.info('Video transcoded successfully', { videoId, quality });
    }

    // 4. Generate thumbnails
    job.progress(80);
    const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
    logger.info('Generating thumbnail', { videoId });

    await generateThumbnail(inputPath, thumbnailPath);

    // Optimize thumbnail with sharp
    await sharp(thumbnailPath)
      .resize(1280, 720, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath.replace('.jpg', '_optimized.jpg'));

    // Upload thumbnail to S3
    let thumbnailUrl: string;
    if (config.storage.provider === 's3') {
      const s3Key = `thumbnails/${videoId}.jpg`;
      thumbnailUrl = await uploadToS3(
        thumbnailPath.replace('.jpg', '_optimized.jpg'),
        s3Key,
        'image/jpeg'
      );
      fs.unlinkSync(thumbnailPath);
      fs.unlinkSync(thumbnailPath.replace('.jpg', '_optimized.jpg'));
    } else {
      thumbnailUrl = `/uploads/thumbnails/${videoId}.jpg`;
    }

    logger.info('Thumbnail generated successfully', { videoId });

    // 5. Update video in database
    job.progress(95);
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'READY',
        videoUrl: videoUrls['720p'], // Default quality
        video1080pUrl: videoUrls['1080p'],
        video720pUrl: videoUrls['720p'],
        video480pUrl: videoUrls['480p'],
        thumbnailUrl,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        publishedAt: new Date(),
      },
    });

    // 6. Clean up
    if (config.storage.provider === 's3') {
      fs.unlinkSync(inputPath); // Remove original file
    }
    fs.rmdirSync(tempDir, { recursive: true });

    logger.info('Video processed successfully', { videoId });
    job.progress(100);

    return {
      success: true,
      videoId,
      urls: videoUrls,
      thumbnailUrl,
      metadata,
    };
  } catch (error) {
    logger.error('Error processing video', { videoId, error });

    // Update status to failed
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'FAILED' },
    });

    throw error;
  }
});

// Event listeners
videoQueue.on('completed', (job, result) => {
  logger.info('Video processing job completed', { jobId: job.id, result });
});

videoQueue.on('failed', (job, err) => {
  logger.error('Video processing job failed', { jobId: job?.id, error: err });
});

videoQueue.on('progress', (job, progress) => {
  logger.debug('Video processing job progress', { jobId: job.id, progress });
});

/**
 * Add video to processing queue
 */
export const addVideoToQueue = async (
  videoId: string,
  inputPath: string,
  userId: string
) => {
  const job = await videoQueue.add(
    {
      videoId,
      inputPath,
      userId,
    },
    {
      attempts: 3, // Retry up to 3 times on failure
      backoff: {
        type: 'exponential',
        delay: 5000, // 5 seconds
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 200, // Keep last 200 failed jobs
    }
  );

  logger.info('Added video to processing queue', { jobId: job.id, videoId });
  return job;
};

export default videoQueue;
