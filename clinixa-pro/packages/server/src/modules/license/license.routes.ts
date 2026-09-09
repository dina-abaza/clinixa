import { Router } from 'express';
import {
  getLicenseStatusController,
  activateLicenseController,
  verifySetupKeyController,
} from './license.controller';

const router = Router();

router.get('/status', getLicenseStatusController);
router.post('/activate', activateLicenseController);
router.post('/verify-setup-key', verifySetupKeyController);

export default router;
