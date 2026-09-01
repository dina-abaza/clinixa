import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { listSystemAlerts, readAlert } from './system-alerts.controller';

const router = Router();

// تطبيق ميدلوير المصادقة على مسارات تنبيهات النظام
router.use(authMiddleware);

// مسارات استرجاع وتعليم التنبيهات كمقروءة
router.get('/', listSystemAlerts);
router.patch('/:id/read', readAlert);

export default router;
