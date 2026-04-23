import { Router } from 'express';
import { exportHerd, exportFinancials, exportCattleHistory } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/herd', authenticate, exportHerd as any);
router.get('/financials', authenticate, exportFinancials as any);
router.get('/cattle/:id', authenticate, exportCattleHistory as any);

export default router;
