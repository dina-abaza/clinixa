import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middlewares/error-handler.middleware';
import { arabicNormalizeMiddleware } from './middlewares/arabic-normalize.middleware';
import setupRoutes from './modules/setup/setup.routes';
import authRoutes from './modules/auth/auth.routes';
import patientsRoutes from './modules/patients/patients.routes';
import medicationsRouter from './modules/patients/medications.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import { paymentsRouter, chargesRouter, daySummaryRouter } from './modules/payments/payments.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import employeesRoutes from './modules/employees/employees.routes';
import branchesRoutes from './modules/branches/branches.routes';
import settingsRoutes from './modules/settings/settings.routes';
import backupRoutes from './modules/backup/backup.routes';
import systemAlertsRoutes from './modules/system-alerts/system-alerts.routes';
import configRoutes from './modules/config/config.routes';

const app = express();

// Middlewares الأساسية
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(arabicNormalizeMiddleware);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    data: {
      status: 'online',
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    warning: null,
  });
});

// المسارات الأساسية (Phases 1, 2, 3)
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/medications', medicationsRouter);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentsRouter);
app.use('/api/charges', chargesRouter);
app.use('/api/day-summary', daySummaryRouter);

// المسارات الداعمة (Phase 4)
app.use('/api/inventory', inventoryRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/system-alerts', systemAlertsRoutes);
app.use('/api/config', configRoutes);

// Middleware الأخطاء في النهاية
app.use(errorHandler);

export default app;
