import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { getSyncStatusController, retryPendingSyncController } from './sync.controller';

const router = Router();

router.use(authMiddleware);

router.get('/status', requirePermission('admin.view'), getSyncStatusController);
router.post('/retry', requirePermission('admin.edit'), retryPendingSyncController);

export default router;
