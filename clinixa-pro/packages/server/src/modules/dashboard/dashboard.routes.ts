import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * @description مسارات لوحة التحكم
 * GET /api/dashboard/summary - جلب إحصائيات ومرضى اليوم
 */
router.get('/summary', authMiddleware, dashboardController.getSummary);

export default router;
