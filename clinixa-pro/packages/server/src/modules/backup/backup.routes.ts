import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import {
  listBackupHistory,
  triggerBackup,
  setBackupDestination,
  restoreBackupData,
  getGoogleDriveSettingsHandler,
  updateGoogleDriveSettingsHandler,
  deleteGoogleDriveSettingsHandler,
} from './backup.controller';

const router = Router();

// تطبيق ميدلوير المصادقة على مسارات النسخ الاحتياطي
router.use(authMiddleware);

// مسارات إدارة النسخ الاحتياطي
router.get('/history', requirePermission('admin.view'), listBackupHistory);
router.post('/run', requirePermission('admin.edit'), triggerBackup);
router.put('/destination', requirePermission('admin.edit'), setBackupDestination);
router.post('/restore', requirePermission('admin.edit'), restoreBackupData);

// مسارات إدارة إعدادات Google Drive
router.get('/google-drive', requirePermission('admin.view'), getGoogleDriveSettingsHandler);
router.put('/google-drive', requirePermission('admin.edit'), updateGoogleDriveSettingsHandler);
router.delete('/google-drive', requirePermission('admin.edit'), deleteGoogleDriveSettingsHandler);

export default router;
