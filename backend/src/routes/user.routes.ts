import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// Get user profile
router.get('/:userId/profile', optionalAuth, UserController.getUserProfile);

// Follow/Unfollow
router.post('/:userId/follow', authenticate, UserController.followUser);
router.delete('/:userId/unfollow', authenticate, UserController.unfollowUser);

// Get followers/following lists
router.get('/:userId/followers', optionalAuth, UserController.getFollowers);
router.get('/:userId/following', optionalAuth, UserController.getFollowing);

export default router;
