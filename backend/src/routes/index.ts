import { Router } from 'express';
import authRoutes from './auth.routes';
import videoRoutes from './video.routes';
import commentRoutes from './comment.routes';
import userRoutes from './user.routes';

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

export default router;
