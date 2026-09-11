/**
 * @fileoverview الأنواع المشتركة (TypeScript Types) لمشروع Clinixa
 * @description تُستورد هذه الأنواع من @clinixa/shared في السيرفر والفرونت
 */
import type { Permission } from './permissions';
import type { AttendanceStatus, BackupDestination, BackupFailReason, BackupKind, BackupStatus, ChargeType, DocumentType, EmergencyContactRelation, EmployeeRole, FollowUpStatus, Gender, InventoryType, LabStatus, MedicalAlertType, MedicalHistoryCategory, MedicationStatus, PaymentMethod, Specialty, SyncMode, SyncStatus, SyncableTable, SystemAlertType } from './constants';
export type { Permission, AttendanceStatus, BackupDestination, BackupFailReason, BackupKind, BackupStatus, ChargeType, DocumentType, EmergencyContactRelation, EmployeeRole, FollowUpStatus, Gender, InventoryType, LabStatus, MedicalAlertType, MedicalHistoryCategory, MedicationStatus, PaymentMethod, Specialty, SyncMode, SyncStatus, SyncableTable, SystemAlertType, };
/** @description نوع الفرع كما يُرجعه الـ API */
export interface Branch {
    id: string;
    name_ar: string;
    address_ar: string | null;
    phone: string;
    opens_at: string;
    closes_at: string;
    is_host: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
/** @description نوع الموظف كما يُرجعه الـ API (بدون كلمة السر) */
export interface Employee {
    id: string;
    name_ar: string;
    username: string;
    role: EmployeeRole;
    branch_id: string | null;
    is_owner: boolean;
    is_active: boolean;
    permissions: Permission[];
    created_at: string;
    updated_at: string;
}
/** @description بيانات الجلسة بعد تسجيل الدخول */
export interface AuthSession {
    token: string;
    employee: Omit<Employee, 'created_at' | 'updated_at'>;
    active_branch: Pick<Branch, 'id' | 'name_ar'>;
}
/** @description نوع المريض كما يُرجعه الـ API */
export interface Patient {
    id: string;
    display_id: string;
    name_ar: string;
    name_en: string | null;
    phone: string;
    age: number;
    gender: Gender;
    address: string | null;
    notes: string | null;
    home_branch_id: string | null;
    is_active: boolean;
    due: number;
    created_at: string;
    updated_at: string;
}
/** @description جهة الاتصال الطارئة */
export interface EmergencyContact {
    id: string;
    patient_id: string;
    name: string | null;
    relation: EmergencyContactRelation | null;
    phone: string | null;
    updated_at: string;
}
/** @description موعد المتابعة */
export interface PatientFollowUp {
    id: string;
    patient_id: string;
    branch_id: string;
    due_date: string;
    reason: string | null;
    fee: number | null;
    status: FollowUpStatus;
    created_at: string;
    updated_at: string;
}
/** @description تنبيه طبي (حساسية، دواء حرج، ملاحظة مهمة) */
export interface MedicalAlert {
    id: string;
    patient_id: string;
    type: MedicalAlertType;
    text_ar: string;
    text_en: string | null;
    created_at: string;
    updated_at: string;
}
/** @description سجل التاريخ المرضي */
export interface MedicalHistory {
    id: string;
    patient_id: string;
    category: MedicalHistoryCategory;
    text_ar: string;
    text_en: string | null;
    updated_at: string;
}
/** @description تشخيص طبي */
export interface Diagnosis {
    id: string;
    patient_id: string;
    date: string;
    text_ar: string;
    text_en: string | null;
    created_at: string;
}
/** @description دواء في قائمة الأدوية الحالية */
export interface Medication {
    id: string;
    patient_id: string;
    name: string;
    dose: string | null;
    frequency: string | null;
    since: string | null;
    status: MedicationStatus;
    updated_at: string;
}
/** @description وصفة طبية */
export interface Prescription {
    id: string;
    patient_id: string;
    date: string;
    doctor_id: string | null;
    created_at: string;
    items: PrescriptionItem[];
}
/** @description بند في الوصفة الطبية */
export interface PrescriptionItem {
    id: string;
    prescription_id: string;
    drug: string;
    dose: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
}
/** @description تحليل طبي */
export interface Lab {
    id: string;
    patient_id: string;
    name: string;
    date: string;
    status: LabStatus;
    doctor_id: string | null;
    has_attachment: boolean;
}
/** @description أشعة طبية */
export interface Radiology {
    id: string;
    patient_id: string;
    type: string;
    date: string;
    report: string | null;
    has_attachment: boolean;
}
/** @description وثيقة / مرفق */
export interface Document {
    id: string;
    patient_id: string;
    file_name: string;
    type: DocumentType;
    date: string;
    source: string | null;
    file_ref: string;
    created_at: string;
}
/** @description سجل حضور — Append-Only */
export interface Attendance {
    id: string;
    patient_id: string;
    patient_name: string;
    patient_display_id: string;
    branch_id: string;
    date: string;
    time: string;
    status: AttendanceStatus;
    items: number[];
    created_by: string;
    updated_at: string;
}
/** @description بند رسوم طبية */
export interface Charge {
    id: string;
    patient_id: string;
    branch_id: string;
    type: ChargeType;
    amount: number;
    date: string;
    time: string;
    attendance_id: string | null;
    created_by: string;
    created_at: string;
}
/** @description دفعة مالية */
export interface Payment {
    id: string;
    patient_id: string;
    branch_id: string;
    amount: number;
    method: PaymentMethod;
    date: string;
    time: string;
    recorded_by: string;
    after_day_close: boolean;
    created_at: string;
}
/** @description سجل إقفال اليوم */
export interface DayClosure {
    id: string;
    branch_id: string;
    date: string;
    closed_by: string;
    closed_at: string;
    reopened_by: string | null;
    reopened_at: string | null;
}
/** @description صنف في المخزون */
export interface InventoryItem {
    id: string;
    branch_id: string;
    name_ar: string;
    name_en: string | null;
    type: InventoryType;
    qty: number;
    min_qty: number | null;
    unit: string;
    is_active: boolean;
    low_stock: boolean;
    updated_at: string;
}
/** @description صف في جدول sync_outbox */
export interface SyncOutboxRecord {
    id: string;
    table_name: SyncableTable;
    record_id: string;
    branch_id: string;
    status: SyncStatus;
    attempts: number;
    last_error: string | null;
    created_at: string;
    updated_at: string;
    synced_at: string | null;
}
/** @description تنبيه نظام (فشل النسخ الاحتياطي / نقص المخزون) */
export interface SystemAlert {
    id: string;
    type: SystemAlertType;
    title: string;
    detail: string | null;
    branch_id: string | null;
    is_read: boolean;
    created_at: string;
}
/** @description سجل عملية النسخ الاحتياطي */
export interface BackupRecord {
    id: string;
    date: string;
    time: string;
    status: BackupStatus;
    fail_reason: BackupFailReason | null;
    size_mb: number | null;
    kind: BackupKind;
    destination: BackupDestination;
}
/** @description إعدادات النسخ الاحتياطي السحابي عبر Google Drive */
export interface GoogleDriveSettings {
    id: string;
    script_url: string | null;
    has_secret_key: boolean;
    has_backup_password: boolean;
    is_enabled: boolean;
    updated_at: string | null;
}
/** @description مدخلات تحديث إعدادات Google Drive */
export interface UpdateGoogleDriveSettingsInput {
    script_url?: string | null;
    secret_key?: string | null;
    backup_password?: string | null;
    is_enabled?: boolean;
}
/** @description إعدادات العيادة العامة */
export interface ClinicSettings {
    id: string;
    name_ar: string;
    specialty: Specialty;
    phone: string | null;
    address: string | null;
    license_key: string;
    security_question: string | null;
    security_answer_hash: string | null;
    sync_mode: SyncMode;
    updated_at: string;
}
/** @description سعر خدمة أو رسوم طبية في العيادة */
export interface ClinicPrice {
    id: string;
    charge_type: ChargeType;
    default_amount: number;
}
/** @description شكل الاستجابة المُصفَّحة للقوائم الطويلة */
export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
}
/** @description شكل الاستجابة الناجحة */
export interface ApiSuccess<T = unknown> {
    ok: true;
    data: T;
    warning: ApiWarning | null;
}
/** @description شكل التحذير غير المانع */
export interface ApiWarning {
    code: string;
    message: string;
    meta?: Record<string, unknown>;
}
/** @description شكل استجابة الخطأ */
export interface ApiError {
    ok: false;
    error: {
        code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'LOCKED' | 'SERVER_ERROR';
        message: string;
        field?: string;
    };
}
/** @description النوع الموحد لكل استجابة API */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
