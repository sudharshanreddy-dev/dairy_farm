import { Router } from 'express';
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register as any);
router.post('/login', login as any);
router.get('/profile', authenticate, getProfile as any);
router.put('/profile', authenticate, updateProfile as any);
router.post('/change-password', authenticate, changePassword as any);

export default router;
