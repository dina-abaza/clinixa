import type { Gender, LabStatus, MedicationStatus } from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/**
 * وحدة `/api/patients` — مطابقة لـ clinixa-api-reference.md §2. الأشكال هنا
 * اتراجعت على `packages/server/src/modules/patients/patients.service.ts`
 * مباشرة (مش الأنواع الكاملة في `@clinixa/shared`) لأن الباك بيرجّع مجموعة
 * فرعية من الحقول بس في أكتر من رد (مثلاً `addMedicalAlert` بترجّع
 * `{id,type,text_ar}` بس، مش الكيان الكامل). `employee_id`/`branch_id`
 * بيتم استنتاجهم من التوكن في الباك — الفرونت مايبعتهمش في أي Request هنا.
 *
 * ⚠ نوع التنبيه الطبي الفعلي في الباك (`patients.controller.ts` →
 * `createMedicalAlertSchema`) هو `allergy | warning | chronic | other` —
 * **مختلف** عن `MedicalAlertType` الموثّق في `@clinixa/shared`
 * (`allergy | chronic | active_medication | important_note`). اتبع القيم
 * الفعلية هنا عشان الفورم يشتغل مع السيرفر الحقيقي.
 */
export type MedicalAlertTypeBackend = 'allergy' | 'warning' | 'chronic' | 'other';

// ─────────────────────────────────────────────────────────────
// قائمة المرضى
// ─────────────────────────────────────────────────────────────

export interface PatientListItem {
  id: string;
  display_id: string;
  name_ar: string;
  name_en: string | null;
  phone: string;
  age: number;
  gender: Gender;
  home_branch_id: string | null;
  is_active: boolean;
  due: number;
}

export interface GetPatientsParams {
  search?: string;
  page?: number;
  page_size?: number;
  include_inactive?: boolean;
}

export interface PaginatedPatients {
  items: PatientListItem[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export async function getPatients(params: GetPatientsParams): Promise<ApiResponse<PaginatedPatients>> {
  try {
    const res = await apiClient.get<ApiResponse<PaginatedPatients>>('/patients', { params });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface PatientEmergencyContactInfo {
  name: string | null;
  relation: string | null;
  phone: string | null;
}

/** `GET /api/patients/:id` — راجع `getPatientById()` في patients.service.ts. */
export interface PatientDetail {
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
  emergency_contact: PatientEmergencyContactInfo | null;
  created_at: string;
}

export async function getPatient(id: string): Promise<ApiResponse<PatientDetail>> {
  try {
    const res = await apiClient.get<ApiResponse<PatientDetail>>(`/patients/${id}`);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// إضافة / تعديل / تعطيل
// ─────────────────────────────────────────────────────────────

export interface PatientEmergencyContactInput {
  name?: string | null;
  relation?: string | null;
  phone?: string | null;
}

export interface UpsertPatientRequest {
  name_ar: string;
  phone: string;
  age: number;
  gender: Gender;
  address?: string | null;
  notes?: string | null;
  emergency_contact?: PatientEmergencyContactInput;
}

/** `POST /api/patients` — راجع `createPatient()` في patients.service.ts (رد مختصر، مش المريض الكامل). */
export interface CreatePatientResponseData {
  id: string;
  display_id: string;
  name_ar: string;
  name_en: string | null;
  phone: string;
  age: number;
  gender: Gender;
  due: 0;
  is_active: true;
}

export async function createPatient(
  payload: UpsertPatientRequest,
): Promise<ApiResponse<CreatePatientResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<CreatePatientResponseData>>('/patients', payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

/** `PUT /api/patients/:id` — راجع `updatePatient()`، بيرجّع نفس شكل `getPatientById()` (`PatientDetail`). */
export async function updatePatient(
  id: string,
  payload: Partial<UpsertPatientRequest>,
): Promise<ApiResponse<PatientDetail>> {
  try {
    const res = await apiClient.put<ApiResponse<PatientDetail>>(`/patients/${id}`, payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface ToggleActiveResponseData {
  id: string;
  is_active: boolean;
}

export async function togglePatientActive(
  id: string,
  is_active: boolean,
): Promise<ApiResponse<ToggleActiveResponseData>> {
  try {
    const res = await apiClient.patch<ApiResponse<ToggleActiveResponseData>>(
      `/patients/${id}/toggle-active`,
      { is_active },
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// السجل الطبي الكامل — الحقول هنا مطابقة لـ getMedicalRecord() بالحرف
// ─────────────────────────────────────────────────────────────

export interface MedicalAlertRecord {
  id: string;
  type: MedicalAlertTypeBackend;
  text_ar: string;
  text_en: string | null;
}

export interface MedicalHistoryRecord {
  id: string;
  category: string;
  text_ar: string;
  text_en: string | null;
}

export interface DiagnosisRecord {
  id: string;
  date: string;
  text_ar: string;
  text_en: string | null;
}

export interface MedicationRecord {
  id: string;
  name: string;
  dose: string | null;
  frequency: string | null;
  status: MedicationStatus;
}

export interface LabRecord {
  id: string;
  name: string;
  date: string;
  status: LabStatus;
  has_attachment: boolean;
}

export interface RadiologyRecord {
  id: string;
  type: string;
  date: string;
  report: string | null;
  has_attachment: boolean;
}

export interface DocumentRecord {
  id: string;
  file_name: string;
  type: string;
  date: string;
}

export interface MedicalRecordResponseData {
  medical_alerts: MedicalAlertRecord[];
  medical_history: MedicalHistoryRecord[];
  diagnoses: DiagnosisRecord[];
  medications: MedicationRecord[];
  labs: LabRecord[];
  radiology: RadiologyRecord[];
  documents: DocumentRecord[];
}

export async function getMedicalRecord(
  patientId: string,
): Promise<ApiResponse<MedicalRecordResponseData>> {
  try {
    const res = await apiClient.get<ApiResponse<MedicalRecordResponseData>>(
      `/patients/${patientId}/medical-record`,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// تنبيه طبي
// ─────────────────────────────────────────────────────────────

export interface AddMedicalAlertRequest {
  type: MedicalAlertTypeBackend;
  text_ar: string;
  text_en?: string | null;
}

export async function addMedicalAlert(
  patientId: string,
  payload: AddMedicalAlertRequest,
): Promise<ApiResponse<{ id: string; type: MedicalAlertTypeBackend; text_ar: string }>> {
  try {
    const res = await apiClient.post<ApiResponse<{ id: string; type: MedicalAlertTypeBackend; text_ar: string }>>(
      `/patients/${patientId}/medical-alerts`,
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// التاريخ المرضي
// ─────────────────────────────────────────────────────────────

export interface AddMedicalHistoryRequest {
  category: string;
  text_ar: string;
  text_en?: string | null;
}

export async function addMedicalHistory(
  patientId: string,
  payload: AddMedicalHistoryRequest,
): Promise<ApiResponse<{ id: string; category: string; text_ar: string }>> {
  try {
    const res = await apiClient.post<ApiResponse<{ id: string; category: string; text_ar: string }>>(
      `/patients/${patientId}/medical-history`,
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// التشخيصات
// ─────────────────────────────────────────────────────────────

export interface AddDiagnosisRequest {
  text_ar: string;
  text_en?: string | null;
}

export async function addDiagnosis(
  patientId: string,
  payload: AddDiagnosisRequest,
): Promise<ApiResponse<{ id: string; date: string; text_ar: string }>> {
  try {
    const res = await apiClient.post<ApiResponse<{ id: string; date: string; text_ar: string }>>(
      `/patients/${patientId}/diagnoses`,
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// الأدوية
// ─────────────────────────────────────────────────────────────

export interface AddMedicationRequest {
  name: string;
  dose?: string | null;
  frequency?: string | null;
  status: MedicationStatus;
}

export async function addMedication(
  patientId: string,
  payload: AddMedicationRequest,
): Promise<ApiResponse<{ id: string; name: string; status: MedicationStatus }>> {
  try {
    const res = await apiClient.post<ApiResponse<{ id: string; name: string; status: MedicationStatus }>>(
      `/patients/${patientId}/medications`,
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface MedicationStatusResponseData {
  id: string;
  status: MedicationStatus;
}

export async function stopMedication(
  medicationId: string,
): Promise<ApiResponse<MedicationStatusResponseData>> {
  try {
    const res = await apiClient.patch<ApiResponse<MedicationStatusResponseData>>(
      `/medications/${medicationId}/stop`,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export async function refillMedication(
  medicationId: string,
): Promise<ApiResponse<MedicationStatusResponseData>> {
  try {
    const res = await apiClient.patch<ApiResponse<MedicationStatusResponseData>>(
      `/medications/${medicationId}/refill`,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// التحاليل والأشعة
// ─────────────────────────────────────────────────────────────

export interface AddLabRequest {
  name: string;
  date: string;
  status: LabStatus;
}

export async function addLab(
  patientId: string,
  payload: AddLabRequest,
): Promise<ApiResponse<{ id: string; name: string; status: LabStatus }>> {
  try {
    const res = await apiClient.post<ApiResponse<{ id: string; name: string; status: LabStatus }>>(
      `/patients/${patientId}/labs`,
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface AddRadiologyRequest {
  type: string;
  date: string;
  report?: string | null;
}

export async function addRadiology(
  patientId: string,
  payload: AddRadiologyRequest,
): Promise<ApiResponse<{ id: string; type: string; date: string }>> {
  try {
    const res = await apiClient.post<ApiResponse<{ id: string; type: string; date: string }>>(
      `/patients/${patientId}/radiology`,
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// الوصفات الطبية — ⭐ بترجّع تنبيهات الحساسية تلقائيًا مع كل حفظ (قرار ١١١)
// ─────────────────────────────────────────────────────────────

export interface PrescriptionItemInput {
  drug: string;
  dose?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export interface AddPrescriptionRequest {
  items: PrescriptionItemInput[];
}

export interface AddPrescriptionResponseData {
  prescription: {
    id: string;
    date: string;
    doctor_id: string | null;
    items: PrescriptionItemInput[];
  };
  medical_alerts: { type: string; text_ar: string }[];
}

export async function addPrescription(
  patientId: string,
  payload: AddPrescriptionRequest,
): Promise<ApiResponse<AddPrescriptionResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<AddPrescriptionResponseData>>(
      `/patients/${patientId}/prescriptions`,
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
