import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import {
  listInventory,
  createItem,
  updateItem,
  adjustQty,
} from './inventory.controller';

const router = Router();

// تطبيق ميدلوير المصادقة على جميع مسارات المخزون
router.use(authMiddleware);

// مسارات إدارة المخزون
router.get('/', requirePermission('inv.view'), listInventory);
router.post('/', requirePermission('inv.add'), createItem);
router.put('/:id', requirePermission('inv.edit'), updateItem);
router.patch('/:id/adjust-qty', requirePermission('inv.edit'), adjustQty);

export default router;
