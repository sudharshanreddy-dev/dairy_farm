import { Router } from 'express';
import { listMilk, createMilk, deleteMilk } from '../controllers/milk.controller';
import { listHealth, createHealth, listVaccinations, createVaccination, deleteHealthRecord, deleteVaccination } from '../controllers/health.controller';
import { listInventory, createInventory, updateInventory, listTransactions, deleteInventory } from '../controllers/inventory.controller';
import { listSales, createSale, deleteSale } from '../controllers/sales.controller';
import { listAlerts, markRead, checkAlerts, markAllRead } from '../controllers/alert.controller';
import { getAnalytics } from '../controllers/analytics.controller';
import { listPosts, getPost, createPost, createComment } from '../controllers/community.controller';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { listFeedingLogs, logBulkFeeding } from '../controllers/feeding.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Dashboard
router.get('/dashboard', authenticate, getDashboardStats as any);

// Feeding
router.get('/feeding', authenticate, listFeedingLogs as any);
router.post('/feeding', authenticate, logBulkFeeding as any);

// Milk
router.get('/milk', authenticate, listMilk as any);
router.post('/milk', authenticate, createMilk as any);
router.delete('/milk/:id', authenticate, deleteMilk as any);

// Health & Vax
router.get('/health', authenticate, listHealth as any);
router.post('/health', authenticate, createHealth as any);
router.delete('/health/:id', authenticate, deleteHealthRecord as any);
router.get('/vaccinations', authenticate, listVaccinations as any);
router.post('/vaccinations', authenticate, createVaccination as any);
router.delete('/vaccinations/:id', authenticate, deleteVaccination as any);

// Inventory
router.get('/inventory', authenticate, listInventory as any);
router.post('/inventory', authenticate, createInventory as any);
router.put('/inventory/:id', authenticate, updateInventory as any);
router.delete('/inventory/:id', authenticate, deleteInventory as any);
router.get('/inventory/:inventoryId/transactions', authenticate, listTransactions as any);

// Sales
router.get('/sales', authenticate, listSales as any);
router.post('/sales', authenticate, createSale as any);
router.delete('/sales/:id', authenticate, deleteSale as any);

// Alerts
router.get('/alerts', authenticate, listAlerts as any);
router.post('/alerts/:id/read', authenticate, markRead as any);
router.post('/alerts/read-all', authenticate, markAllRead as any);
router.post('/alerts/check', authenticate, checkAlerts as any);

// Analytics
router.get('/analytics', authenticate, getAnalytics as any);

// Community
router.get('/community', authenticate, listPosts as any);
router.get('/community/:id', authenticate, getPost as any);
router.post('/community', authenticate, createPost as any);
router.post('/community/:postId/comments', authenticate, createComment as any);

export default router;
