/**
 * @fileoverview الصلاحيات المعتمدة في مشروع Clinixa
 * @description المصدر الوحيد للحقيقة للـ 16 صلاحية — يُستورد من هنا في السيرفر والفرونت
 *              تم التحقق من العدد بمراجعة كل endpoint في clinixa-backend-architecture.md
 */
/**
 * @description قائمة الـ 16 صلاحية المعتمدة في المشروع
 * pat×4: عرض/إضافة/تعديل/تعطيل المرضى
 * att×4: عرض/إضافة/تعديل/إنهاء كشف الحضور
 * pay×3: عرض/إضافة/تعديل المدفوعات
 * inv×3: عرض/إضافة/تعديل المخزون
 * admin×2: عرض/تعديل الإدارة (موظفون، فروع، إعدادات)
 */
export declare const PERMISSIONS: readonly ["pat.view", "pat.add", "pat.edit", "pat.off", "att.view", "att.add", "att.edit", "att.done", "pay.view", "pay.add", "pay.edit", "inv.view", "inv.add", "inv.edit", "admin.view", "admin.edit"];
/**
 * @description النوع المشتق من قائمة الصلاحيات — يُستخدم في كل مكان يحتاج صلاحية
 * @example const required: Permission = 'pat.add';
 */
export type Permission = (typeof PERMISSIONS)[number];
/**
 * @description دالة مساعدة للتحقق إذا كانت قيمة نصية هي صلاحية صحيحة
 * @param {string} value - القيمة المراد التحقق منها
 * @returns {boolean} true إذا كانت القيمة صلاحية معتمدة
 */
export declare function isValidPermission(value: string): value is Permission;
