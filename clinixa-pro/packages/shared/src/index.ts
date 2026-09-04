/**
 * @fileoverview نقطة الدخول المركزية لحزمة @clinixa/shared
 * @description يُصدِّر كل ما يحتاجه السيرفر والفرونت من صلاحيات وثوابت وأنواع
 */

// الصلاحيات
export { PERMISSIONS, isValidPermission } from './permissions';
export type { Permission } from './permissions';

// الثوابت
export {
  CHARGE_TYPES,
  PAYMENT_METHODS,
  ATTENDANCE_STATUSES,
  ROLES,
  INVENTORY_TYPES,
  SPECIALTIES,
  FOLLOW_UP_STATUSES,
  MEDICAL_ALERT_TYPES,
  MEDICAL_HISTORY_CATEGORIES,
  LAB_STATUSES,
  MEDICATION_STATUSES,
  DOCUMENT_TYPES,
  SYNC_STATUSES,
  SYNCABLE_TABLES,
  GENDER,
  EMERGENCY_CONTACT_RELATION,
  SYSTEM_ALERT_TYPES,
  BACKUP_STATUS,
  BACKUP_KIND,
  BACKUP_DESTINATION,
  BACKUP_FAIL_REASON,
  SYNC_MODES,
} from './constants';

// الأنواع
export type {
  // فروع
  Branch,
  // موظفون
  Employee,
  AuthSession,
  // مرضى
  Patient,
  EmergencyContact,
  PatientFollowUp,
  // سجل طبي
  MedicalAlert,
  MedicalHistory,
  Diagnosis,
  Medication,
  Prescription,
  PrescriptionItem,
  Lab,
  Radiology,
  Document,
  // حضور
  Attendance,
  // مدفوعات وإقفال
  Charge,
  Payment,
  DayClosure,
  // مخزون
  InventoryItem,
  // إعدادات العيادة
  ClinicSettings,
  ClinicPrice,
  // مزامنة
  SyncOutboxRecord,
  // تنبيهات ونخ احتياطي
  SystemAlert,
  BackupRecord,
  GoogleDriveSettings,
  UpdateGoogleDriveSettingsInput,
  // مشتركة
  PaginatedResponse,
  ApiSuccess,
  ApiWarning,
  ApiError,
  ApiResponse,
  // أنواع مشتقة من الثوابت
  AttendanceStatus,
  BackupDestination,
  BackupFailReason,
  BackupKind,
  BackupStatus,
  ChargeType,
  DocumentType,
  EmergencyContactRelation,
  EmployeeRole,
  FollowUpStatus,
  Gender,
  InventoryType,
  LabStatus,
  MedicalAlertType,
  MedicalHistoryCategory,
  MedicationStatus,
  PaymentMethod,
  Specialty,
  SyncMode,
  SyncStatus,
  SyncableTable,
  SystemAlertType,
} from './types';
