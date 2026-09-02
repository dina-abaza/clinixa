"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const error_handler_middleware_1 = require("./middlewares/error-handler.middleware");
const arabic_normalize_middleware_1 = require("./middlewares/arabic-normalize.middleware");
const setup_routes_1 = __importDefault(require("./modules/setup/setup.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const patients_routes_1 = __importDefault(require("./modules/patients/patients.routes"));
const medications_routes_1 = __importDefault(require("./modules/patients/medications.routes"));
const attendance_routes_1 = __importDefault(require("./modules/attendance/attendance.routes"));
const payments_routes_1 = require("./modules/payments/payments.routes");
const inventory_routes_1 = __importDefault(require("./modules/inventory/inventory.routes"));
const employees_routes_1 = __importDefault(require("./modules/employees/employees.routes"));
const branches_routes_1 = __importDefault(require("./modules/branches/branches.routes"));
const settings_routes_1 = __importDefault(require("./modules/settings/settings.routes"));
const backup_routes_1 = __importDefault(require("./modules/backup/backup.routes"));
const system_alerts_routes_1 = __importDefault(require("./modules/system-alerts/system-alerts.routes"));
const config_routes_1 = __importDefault(require("./modules/config/config.routes"));
const sync_routes_1 = __importDefault(require("./modules/sync/sync.routes"));
const app = (0, express_1.default)();
// Middlewares الأساسية
app.use((0, cors_1.default)({ origin: env_1.env.CORS_ORIGIN }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(arabic_normalize_middleware_1.arabicNormalizeMiddleware);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        ok: true,
        data: {
            status: 'online',
            env: env_1.env.NODE_ENV,
            timestamp: new Date().toISOString(),
        },
        warning: null,
    });
});
// المسارات الأساسية (Phases 1, 2, 3)
app.use('/api/setup', setup_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/patients', patients_routes_1.default);
app.use('/api/medications', medications_routes_1.default);
app.use('/api/attendance', attendance_routes_1.default);
app.use('/api/payments', payments_routes_1.paymentsRouter);
app.use('/api/charges', payments_routes_1.chargesRouter);
app.use('/api/day-summary', payments_routes_1.daySummaryRouter);
// المسارات الداعمة (Phase 4)
app.use('/api/inventory', inventory_routes_1.default);
app.use('/api/employees', employees_routes_1.default);
app.use('/api/branches', branches_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/backup', backup_routes_1.default);
app.use('/api/system-alerts', system_alerts_routes_1.default);
app.use('/api/config', config_routes_1.default);
app.use('/api/sync', sync_routes_1.default);
// Middleware الأخطاء في النهاية
app.use(error_handler_middleware_1.errorHandler);
exports.default = app;
