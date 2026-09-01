import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { listBranches, createNewBranch, updateBranchInfo } from './branches.controller';

const router = Router();

// تطبيق ميدلوير المصادقة على جميع مسارات الفروع
router.use(authMiddleware);

// مسارات إدارة الفروع
router.get('/', requirePermission('admin.view'), listBranches);
router.post('/', requirePermission('admin.edit'), createNewBranch);
router.put('/:id', requirePermission('admin.edit'), updateBranchInfo);

export default router;
