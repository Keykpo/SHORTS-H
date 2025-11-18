import { Router } from 'express';
import authRoutes from './auth.routes';
import videoRoutes from './video.routes';

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

export default router;
