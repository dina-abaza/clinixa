"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// مسار تسجيل الدخول
router.post('/login', auth_controller_1.login);
// مسار تسجيل الخروج (يتطلب توكن صالح)
router.post('/logout', auth_middleware_1.authMiddleware, auth_controller_1.logout);
// مسار جلب تفاصيل الجلسة الحالية (يتطلب توكن صالح)
router.get('/session', auth_middleware_1.authMiddleware, auth_controller_1.getSession);
// مسار جلب سؤال الأمان للمستخدم
router.get('/security-question', auth_controller_1.getSecurityQuestionHandler);
// مسار نسيت كلمة السر واستعادتها
router.post('/forgot-password', auth_controller_1.forgotPassword);
exports.default = router;
