import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import {
  listBackupHistory,
  triggerBackup,
  setBackupDestination,
  restoreBackupData,
} from './backup.controller';

const router = Router();

// تطبيق ميدلوير المصادقة على مسارات النسخ الاحتياطي
router.use(authMiddleware);

// مسارات إدارة النسخ الاحتياطي
router.get('/history', requirePermission('admin.view'), listBackupHistory);
router.post('/run', requirePermission('admin.edit'), triggerBackup);
router.put('/destination', requirePermission('admin.edit'), setBackupDestination);
router.post('/restore', requirePermission('admin.edit'), restoreBackupData);

export default router;
