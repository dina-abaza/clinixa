import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import {
  listEmployees,
  createNewEmployee,
  updatePermissions,
  resetPassword,
  toggleActive,
} from './employees.controller';

const router = Router();

// تطبيق ميدلوير المصادقة على جميع مسارات الموظفين
router.use(authMiddleware);

// مسارات إدارة الموظفين
router.get('/', requirePermission('admin.view'), listEmployees);
router.post('/', requirePermission('admin.edit'), createNewEmployee);
router.put('/:id/permissions', requirePermission('admin.edit'), updatePermissions);
router.patch('/:id/reset-password', requirePermission('admin.edit'), resetPassword);
router.patch('/:id/toggle-active', requirePermission('admin.edit'), toggleActive);

export default router;
