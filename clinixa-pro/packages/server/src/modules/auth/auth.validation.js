"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityQuestionSchema = exports.forgotPasswordSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
/**
 * @description سكيمة التحقق من البيانات عند تسجيل الدخول
 */
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'اسم المستخدم مطلوب'),
    password: zod_1.z.string().min(1, 'كلمة السر مطلوبة'),
});
/**
 * @description سكيمة التحقق من البيانات عند نسيت كلمة السر
 */
exports.forgotPasswordSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'اسم المستخدم مطلوب'),
    security_answer: zod_1.z.string().min(1, 'إجابة سؤال الأمان مطلوبة'),
    new_password: zod_1.z.string().min(6, 'كلمة السر الجديدة يجب أن تكون ٦ أحرف على الأقل'),
});
/**
 * @description سكيمة التحقق من البيانات عند طلب سؤال الأمان
 */
exports.getSecurityQuestionSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'اسم المستخدم مطلوب'),
});
