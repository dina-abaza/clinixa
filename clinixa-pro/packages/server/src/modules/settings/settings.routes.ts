import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { getSettings, updateSettings } from './settings.controller';

const router = Router();

// تطبيق ميدلوير المصادقة على جميع مسارات الإعدادات
router.use(authMiddleware);

// مسارات قراءة وتعديل الإعدادات والأسعار
router.get('/', getSettings);
router.put('/', requirePermission('admin.edit'), updateSettings);

export default router;
