import { Router } from 'express';
import { 
  getCattlePublic, getCattleShareInfo, getCattleDetail,
  listCattle, createCattle, updateCattle, deleteCattle 
} from '../controllers/cattle.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { optionalAuthenticate } from '../middlewares/optionalAuth.middleware';

const router = Router();

// Public / QR routes
router.get('/public/:id', optionalAuthenticate, getCattlePublic as any);
router.get('/:id', authenticate, getCattleDetail as any);
router.get('/:id/share', authenticate, getCattleShareInfo as any);

// CRUD routes
router.get('/', authenticate, listCattle as any);
router.post('/', authenticate, createCattle as any);
router.put('/:id', authenticate, updateCattle as any);
router.delete('/:id', authenticate, deleteCattle as any);

export default router;
