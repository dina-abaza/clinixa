"use strict";
/**
 * @fileoverview القوائم الثابتة لمشروع Clinixa
 * @description المصدر الوحيد للحقيقة لكل القوائم المرجعية — يُستورد في السيرفر والفرونت
 *              لا يوجد جدول database لهذه القوائم — هي ثوابت كود فقط
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYNC_MODES = exports.BACKUP_FAIL_REASON = exports.BACKUP_DESTINATION = exports.BACKUP_KIND = exports.BACKUP_STATUS = exports.SYSTEM_ALERT_TYPES = exports.EMERGENCY_CONTACT_RELATION = exports.GENDER = exports.SYNCABLE_TABLES = exports.SYNC_STATUSES = exports.DOCUMENT_TYPES = exports.MEDICATION_STATUSES = exports.LAB_STATUSES = exports.MEDICAL_HISTORY_CATEGORIES = exports.MEDICAL_ALERT_TYPES = exports.FOLLOW_UP_STATUSES = exports.SPECIALTIES = exports.INVENTORY_TYPES = exports.ROLES = exports.ATTENDANCE_STATUSES = exports.PAYMENT_METHODS = exports.CHARGE_TYPES = void 0;
// ─────────────────────────────────────────────────────────────
// أنواع الرسوم (Charge Types)
// ─────────────────────────────────────────────────────────────
/**
 * @description قائمة أنواع الرسوم الطبية المعتمدة
 */
exports.CHARGE_TYPES = [
    { key: 'consultation', label_ar: 'كشف' },
    { key: 'follow_up_visit', label_ar: 'إعادة كشف' },
    { key: 'procedure', label_ar: 'إجراء / علاج' },
    { key: 'radiology', label_ar: 'أشعة' },
    { key: 'labs', label_ar: 'تحاليل' },
    { key: 'follow_up', label_ar: 'متابعة' },
    { key: 'other', label_ar: 'أخرى' },
];
// ─────────────────────────────────────────────────────────────
// طرق الدفع (Payment Methods)
// ─────────────────────────────────────────────────────────────
/**
 * @description قائمة طرق الدفع المقبولة
 */
exports.PAYMENT_METHODS = [
    { key: 'cash', label_ar: 'كاش' },
    { key: 'card', label_ar: 'فيزا (ماكينة)' },
    { key: 'wallet', label_ar: 'محفظة إلكترونية' },
    { key: 'bank_transfer', label_ar: 'تحويل بنكي' },
];
// ─────────────────────────────────────────────────────────────
// حالات الحضور (Attendance Statuses)
// ─────────────────────────────────────────────────────────────
/**
 * @description قائمة حالات الحضور المتاحة — الجدول Append-Only
 *              التسلسل الطبيعي: waiting → in_progress → done
 *              التسلسلات البديلة: waiting → noshow / waiting → left
 */
exports.ATTENDANCE_STATUSES = [
    'waiting',
    'in_progress',
    'done',
    'noshow',
    'left',
];
// ─────────────────────────────────────────────────────────────
// أدوار الموظفين (Employee Roles)
// ─────────────────────────────────────────────────────────────
/**
 * @description أدوار الموظفين المتاحة — للعرض فقط، الصلاحيات الفعلية في employee_permissions
 */
exports.ROLES = ['doctor', 'nurse', 'secretary'];
// ─────────────────────────────────────────────────────────────
// أنواع المخزون (Inventory Types)
// ─────────────────────────────────────────────────────────────
/**
 * @description أنواع أصناف المخزون الطبي
 */
exports.INVENTORY_TYPES = [
    { key: 'supplies', label_ar: 'مستلزمات طبية' },
    { key: 'equipment', label_ar: 'معدات طبية' },
];
// ─────────────────────────────────────────────────────────────
// التخصصات الطبية (Medical Specialties)
// ─────────────────────────────────────────────────────────────
/**
 * @description قائمة التخصصات الطبية المتاحة — ثوابت كود فقط، لا جدول DB
 */
exports.SPECIALTIES = [
    { key: 'cardio', label_ar: 'قلب وأوعية دموية', group: 'أمراض مزمنة' },
    { key: 'diabetes', label_ar: 'سكر وغدد صماء', group: 'أمراض مزمنة' },
    { key: 'nephrology', label_ar: 'كلى', group: 'أمراض مزمنة' },
    { key: 'chest', label_ar: 'صدر وجهاز تنفسي', group: 'أمراض مزمنة' },
    { key: 'neurology', label_ar: 'مخ وأعصاب', group: 'أمراض مزمنة' },
    { key: 'rheumatology', label_ar: 'روماتيزم ومفاصل', group: 'أمراض مزمنة' },
    { key: 'gastro', label_ar: 'جهاز هضمي وكبد', group: 'أمراض مزمنة' },
    { key: 'hematology', label_ar: 'دم وأورام', group: 'أمراض مزمنة' },
    { key: 'general', label_ar: 'طب عام وعائلي', group: 'طب عام' },
    { key: 'internal', label_ar: 'باطنة عامة', group: 'طب عام' },
    { key: 'ortho', label_ar: 'عظام ومفاصل', group: 'جراحة وتخصصات أخرى' },
    { key: 'surgery', label_ar: 'جراحة عامة', group: 'جراحة وتخصصات أخرى' },
    { key: 'urology', label_ar: 'مسالك بولية وذكورة', group: 'جراحة وتخصصات أخرى' },
    { key: 'gynecology', label_ar: 'نساء وتوليد', group: 'جراحة وتخصصات أخرى' },
    { key: 'pediatrics', label_ar: 'أطفال', group: 'جراحة وتخصصات أخرى' },
    { key: 'dermatology', label_ar: 'جلدية وتجميل', group: 'جراحة وتخصصات أخرى' },
    { key: 'ent', label_ar: 'أنف وأذن وحنجرة', group: 'جراحة وتخصصات أخرى' },
    { key: 'ophthalmology', label_ar: 'عيون', group: 'جراحة وتخصصات أخرى' },
    { key: 'psychiatry', label_ar: 'طب نفسي', group: 'جراحة وتخصصات أخرى' },
    { key: 'dentistry', label_ar: 'أسنان', group: 'جراحة وتخصصات أخرى' },
];
// ─────────────────────────────────────────────────────────────
// حالات المتابعة (Follow-up Statuses)
// ─────────────────────────────────────────────────────────────
/** @description حالات موعد المتابعة */
exports.FOLLOW_UP_STATUSES = ['scheduled', 'completed', 'cancelled'];
// ─────────────────────────────────────────────────────────────
// فئات السجل الطبي (Medical Record Categories)
// ─────────────────────────────────────────────────────────────
/** @description أنواع التنبيهات الطبية */
exports.MEDICAL_ALERT_TYPES = [
    'allergy',
    'chronic',
    'active_medication',
    'important_note',
];
/** @description فئات التاريخ المرضي */
exports.MEDICAL_HISTORY_CATEGORIES = [
    'chronic',
    'past',
    'surgery',
    'hospitalization',
    'allergy',
    'family',
    'risk_factor',
    'note',
];
/** @description حالات نتيجة التحاليل */
exports.LAB_STATUSES = ['normal', 'abnormal', 'pending'];
/** @description حالات الدواء */
exports.MEDICATION_STATUSES = ['active', 'completed'];
/** @description أنواع وثائق المريض */
exports.DOCUMENT_TYPES = ['pdf', 'jpg', 'png'];
// ─────────────────────────────────────────────────────────────
// حالات المزامنة (Sync Statuses)
// ─────────────────────────────────────────────────────────────
/** @description حالات صف المزامنة في sync_outbox */
exports.SYNC_STATUSES = ['pending', 'syncing', 'synced', 'failed'];
/** @description الجداول القابلة للمزامنة مع MongoDB Atlas */
exports.SYNCABLE_TABLES = [
    'patients',
    'patient_emergency_contacts',
    'patient_follow_ups',
    'medical_alerts',
    'medical_history',
    'diagnoses',
    'medications',
    'prescriptions',
    'prescription_items',
    'labs',
    'radiology',
    'documents',
    'attendance',
    'charges',
    'payments',
    'inventory_items',
    'branches',
];
// ─────────────────────────────────────────────────────────────
// الجنس وصلة القرابة (Gender & Emergency Contact Relation)
// ─────────────────────────────────────────────────────────────
/** @description خيارات الجنس للمريض */
exports.GENDER = ['male', 'female'];
/** @description صلة القرابة لجهة الاتصال الطارئة */
exports.EMERGENCY_CONTACT_RELATION = [
    'father',
    'mother',
    'spouse',
    'sibling',
    'other',
];
// ─────────────────────────────────────────────────────────────
// تنبيهات النظام والنسخ الاحتياطي (System Alerts & Backups)
// ─────────────────────────────────────────────────────────────
/** @description أنواع تنبيهات النظام */
exports.SYSTEM_ALERT_TYPES = ['backup_failed', 'low_stock'];
/** @description حالات عمليات النسخ الاحتياطي */
exports.BACKUP_STATUS = ['ok', 'fail'];
/** @description نوع عملية النسخ الاحتياطي (تلقائي / يدوي) */
exports.BACKUP_KIND = ['auto', 'manual'];
/** @description وجهة حفظ النسخة الاحتياطية */
exports.BACKUP_DESTINATION = ['local_device', 'usb', 'google_drive'];
/** @description سبب فشل عملية النسخ الاحتياطي */
exports.BACKUP_FAIL_REASON = ['token', 'offline', 'device'];
// ─────────────────────────────────────────────────────────────
// أنماط المزامنة للعيادة (Sync Modes)
// ─────────────────────────────────────────────────────────────
/** @description أنماط المزامنة المتاحة للعيادة */
exports.SYNC_MODES = ['none', 'local_server', 'external_hosting'];
//# sourceMappingURL=constants.js.map