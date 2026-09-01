import { Router } from 'express';
import {
  CHARGE_TYPES,
  PAYMENT_METHODS,
  ATTENDANCE_STATUSES,
  ROLES,
  SPECIALTIES,
  PERMISSIONS,
} from '@clinixa/shared';

const router = Router();

/**
 * @description استرجاع القوائم المرجعية الثابتة للنظام
 * GET /api/config/constants
 */
router.get('/constants', (_req, res) => {
  res.status(200).json({
    ok: true,
    data: {
      charge_types: CHARGE_TYPES,
      payment_methods: PAYMENT_METHODS,
      attendance_status: ATTENDANCE_STATUSES,
      roles: ROLES,
      permissions: PERMISSIONS,
      specialties: SPECIALTIES,
    },
    warning: null,
  });
});

export default router;
