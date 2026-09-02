"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@clinixa/shared");
const router = (0, express_1.Router)();
/**
 * @description استرجاع القوائم المرجعية الثابتة للنظام
 * GET /api/config/constants
 */
router.get('/constants', (_req, res) => {
    res.status(200).json({
        ok: true,
        data: {
            charge_types: shared_1.CHARGE_TYPES,
            payment_methods: shared_1.PAYMENT_METHODS,
            attendance_status: shared_1.ATTENDANCE_STATUSES,
            roles: shared_1.ROLES,
            permissions: shared_1.PERMISSIONS,
            specialties: shared_1.SPECIALTIES,
        },
        warning: null,
    });
});
exports.default = router;
