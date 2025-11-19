import { Router } from 'express';
import authRoutes from './auth.routes';
import videoRoutes from './video.routes';
import commentRoutes from './comment.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import playlistRoutes from './playlist.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AnimeShorts API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/videos', videoRoutes);
router.use('/comments', commentRoutes);
router.use('/users', userRoutes);
router.use('/playlists', playlistRoutes);
router.use('/admin', adminRoutes);

export default router;
