/**
 * @fileoverview القوائم الثابتة لمشروع Clinixa
 * @description المصدر الوحيد للحقيقة لكل القوائم المرجعية — يُستورد في السيرفر والفرونت
 *              لا يوجد جدول database لهذه القوائم — هي ثوابت كود فقط
 */
/**
 * @description قائمة أنواع الرسوم الطبية المعتمدة
 */
export declare const CHARGE_TYPES: readonly [{
    readonly key: "consultation";
    readonly label_ar: "كشف";
}, {
    readonly key: "follow_up_visit";
    readonly label_ar: "إعادة كشف";
}, {
    readonly key: "procedure";
    readonly label_ar: "إجراء / علاج";
}, {
    readonly key: "radiology";
    readonly label_ar: "أشعة";
}, {
    readonly key: "labs";
    readonly label_ar: "تحاليل";
}, {
    readonly key: "follow_up";
    readonly label_ar: "متابعة";
}, {
    readonly key: "other";
    readonly label_ar: "أخرى";
}];
/** @description النوع المشتق لمفاتيح أنواع الرسوم */
export type ChargeType = (typeof CHARGE_TYPES)[number]['key'];
/**
 * @description قائمة طرق الدفع المقبولة
 */
export declare const PAYMENT_METHODS: readonly [{
    readonly key: "cash";
    readonly label_ar: "كاش";
}, {
    readonly key: "card";
    readonly label_ar: "فيزا (ماكينة)";
}, {
    readonly key: "wallet";
    readonly label_ar: "محفظة إلكترونية";
}, {
    readonly key: "bank_transfer";
    readonly label_ar: "تحويل بنكي";
}];
/** @description النوع المشتق لمفاتيح طرق الدفع */
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['key'];
/**
 * @description قائمة حالات الحضور المتاحة — الجدول Append-Only
 *              التسلسل الطبيعي: waiting → in_progress → done
 *              التسلسلات البديلة: waiting → noshow / waiting → left
 */
export declare const ATTENDANCE_STATUSES: readonly ["waiting", "in_progress", "done", "noshow", "left"];
/** @description النوع المشتق لحالات الحضور */
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
/**
 * @description أدوار الموظفين المتاحة — للعرض فقط، الصلاحيات الفعلية في employee_permissions
 */
export declare const ROLES: readonly ["doctor", "nurse", "secretary"];
/** @description النوع المشتق لأدوار الموظفين */
export type EmployeeRole = (typeof ROLES)[number];
/**
 * @description أنواع أصناف المخزون الطبي
 */
export declare const INVENTORY_TYPES: readonly [{
    readonly key: "supplies";
    readonly label_ar: "مستلزمات طبية";
}, {
    readonly key: "equipment";
    readonly label_ar: "معدات طبية";
}];
/** @description النوع المشتق لأنواع المخزون */
export type InventoryType = (typeof INVENTORY_TYPES)[number]['key'];
/**
 * @description قائمة التخصصات الطبية المتاحة — ثوابت كود فقط، لا جدول DB
 */
export declare const SPECIALTIES: readonly [{
    readonly key: "cardio";
    readonly label_ar: "قلب وأوعية دموية";
    readonly group: "أمراض مزمنة";
}, {
    readonly key: "diabetes";
    readonly label_ar: "سكر وغدد صماء";
    readonly group: "أمراض مزمنة";
}, {
    readonly key: "nephrology";
    readonly label_ar: "كلى";
    readonly group: "أمراض مزمنة";
}, {
    readonly key: "chest";
    readonly label_ar: "صدر وجهاز تنفسي";
    readonly group: "أمراض مزمنة";
}, {
    readonly key: "neurology";
    readonly label_ar: "مخ وأعصاب";
    readonly group: "أمراض مزمنة";
}, {
    readonly key: "rheumatology";
    readonly label_ar: "روماتيزم ومفاصل";
    readonly group: "أمراض مزمنة";
}, {
    readonly key: "gastro";
    readonly label_ar: "جهاز هضمي وكبد";
    readonly group: "أمراض مزمنة";
}, {
    readonly key: "hematology";
    readonly label_ar: "دم وأورام";
    readonly group: "أمراض مزمنة";
}, {
    readonly key: "general";
    readonly label_ar: "طب عام وعائلي";
    readonly group: "طب عام";
}, {
    readonly key: "internal";
    readonly label_ar: "باطنة عامة";
    readonly group: "طب عام";
}, {
    readonly key: "ortho";
    readonly label_ar: "عظام ومفاصل";
    readonly group: "جراحة وتخصصات أخرى";
}, {
    readonly key: "surgery";
    readonly label_ar: "جراحة عامة";
    readonly group: "جراحة وتخصصات أخرى";
}, {
    readonly key: "urology";
    readonly label_ar: "مسالك بولية وذكورة";
    readonly group: "جراحة وتخصصات أخرى";
}, {
    readonly key: "gynecology";
    readonly label_ar: "نساء وتوليد";
    readonly group: "جراحة وتخصصات أخرى";
}, {
    readonly key: "pediatrics";
    readonly label_ar: "أطفال";
    readonly group: "جراحة وتخصصات أخرى";
}, {
    readonly key: "dermatology";
    readonly label_ar: "جلدية وتجميل";
    readonly group: "جراحة وتخصصات أخرى";
}, {
    readonly key: "ent";
    readonly label_ar: "أنف وأذن وحنجرة";
    readonly group: "جراحة وتخصصات أخرى";
}, {
    readonly key: "ophthalmology";
    readonly label_ar: "عيون";
    readonly group: "جراحة وتخصصات أخرى";
}, {
    readonly key: "psychiatry";
    readonly label_ar: "طب نفسي";
    readonly group: "جراحة وتخصصات أخرى";
}, {
    readonly key: "dentistry";
    readonly label_ar: "أسنان";
    readonly group: "جراحة وتخصصات أخرى";
}];
/** @description النوع المشتق لمفاتيح التخصصات */
export type Specialty = (typeof SPECIALTIES)[number]['key'];
/** @description حالات موعد المتابعة */
export declare const FOLLOW_UP_STATUSES: readonly ["scheduled", "completed", "cancelled"];
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];
/** @description أنواع التنبيهات الطبية */
export declare const MEDICAL_ALERT_TYPES: readonly ["allergy", "chronic", "active_medication", "important_note"];
export type MedicalAlertType = (typeof MEDICAL_ALERT_TYPES)[number];
/** @description فئات التاريخ المرضي */
export declare const MEDICAL_HISTORY_CATEGORIES: readonly ["chronic", "past", "surgery", "hospitalization", "allergy", "family", "risk_factor", "note"];
export type MedicalHistoryCategory = (typeof MEDICAL_HISTORY_CATEGORIES)[number];
/** @description حالات نتيجة التحاليل */
export declare const LAB_STATUSES: readonly ["normal", "abnormal", "pending"];
export type LabStatus = (typeof LAB_STATUSES)[number];
/** @description حالات الدواء */
export declare const MEDICATION_STATUSES: readonly ["active", "completed"];
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];
/** @description أنواع وثائق المريض */
export declare const DOCUMENT_TYPES: readonly ["pdf", "jpg", "png"];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
/** @description حالات صف المزامنة في sync_outbox */
export declare const SYNC_STATUSES: readonly ["pending", "syncing", "synced", "failed"];
export type SyncStatus = (typeof SYNC_STATUSES)[number];
/** @description الجداول القابلة للمزامنة مع MongoDB Atlas */
export declare const SYNCABLE_TABLES: readonly ["patients", "patient_emergency_contacts", "patient_follow_ups", "medical_alerts", "medical_history", "diagnoses", "medications", "prescriptions", "prescription_items", "labs", "radiology", "documents", "attendance", "charges", "payments", "inventory_items", "branches"];
export type SyncableTable = (typeof SYNCABLE_TABLES)[number];
/** @description خيارات الجنس للمريض */
export declare const GENDER: readonly ["male", "female"];
export type Gender = (typeof GENDER)[number];
/** @description صلة القرابة لجهة الاتصال الطارئة */
export declare const EMERGENCY_CONTACT_RELATION: readonly ["father", "mother", "spouse", "sibling", "other"];
export type EmergencyContactRelation = (typeof EMERGENCY_CONTACT_RELATION)[number];
/** @description أنواع تنبيهات النظام */
export declare const SYSTEM_ALERT_TYPES: readonly ["backup_failed", "low_stock"];
export type SystemAlertType = (typeof SYSTEM_ALERT_TYPES)[number];
/** @description حالات عمليات النسخ الاحتياطي */
export declare const BACKUP_STATUS: readonly ["ok", "fail"];
export type BackupStatus = (typeof BACKUP_STATUS)[number];
/** @description نوع عملية النسخ الاحتياطي (تلقائي / يدوي) */
export declare const BACKUP_KIND: readonly ["auto", "manual"];
export type BackupKind = (typeof BACKUP_KIND)[number];
/** @description وجهة حفظ النسخة الاحتياطية */
export declare const BACKUP_DESTINATION: readonly ["local_device", "usb", "google_drive"];
export type BackupDestination = (typeof BACKUP_DESTINATION)[number];
/** @description سبب فشل عملية النسخ الاحتياطي */
export declare const BACKUP_FAIL_REASON: readonly ["token", "offline", "device"];
export type BackupFailReason = (typeof BACKUP_FAIL_REASON)[number];
/** @description أنماط المزامنة المتاحة للعيادة */
export declare const SYNC_MODES: readonly ["none", "local_server", "external_hosting"];
export type SyncMode = (typeof SYNC_MODES)[number];
