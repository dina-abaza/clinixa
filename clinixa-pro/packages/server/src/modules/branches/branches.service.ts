import crypto from 'crypto';
import query from '../../db/sqlite/query';
import { AppError } from '../../middlewares/error-handler.middleware';
import type { Branch } from '@clinixa/shared';
import type { CreateBranchInput, UpdateBranchInput } from './branches.validation';

/**
 * @description استرجاع قائمة جميع الفروع المسجلة في النظام
 * @returns {Promise<{ items: Branch[] }>} قائمة الفروع
 */
export async function getBranches(): Promise<{ items: Branch[] }> {
  const rows = await query('branches').orderBy('created_at', 'asc');

  const items: Branch[] = rows.map((r) => ({
    id: r.id,
    name_ar: r.name_ar,
    address_ar: r.address_ar ?? null,
    phone: r.phone,
    opens_at: r.opens_at,
    closes_at: r.closes_at,
    is_host: Boolean(r.is_host),
    is_active: Boolean(r.is_active),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return { items };
}

/**
 * @description إنشاء فرع جديد في النظام
 * @param {CreateBranchInput} input - بيانات الفرع الجديد
 * @returns {Promise<{ id: string; name_ar: string; is_host: boolean; is_active: boolean }>} بيانات الفرع الأساسية بعد الإنشاء
 */
export async function createBranch(
  input: CreateBranchInput
): Promise<{ id: string; name_ar: string; is_host: boolean; is_active: boolean }> {
  const branchId = `br_${crypto.randomUUID()}`;

  await query('branches').insert({
    id: branchId,
    name_ar: input.name_ar,
    address_ar: input.address_ar ?? null,
    phone: input.phone,
    opens_at: input.opens_at,
    closes_at: input.closes_at,
    is_host: 0,
    is_active: 1,
  });

  return {
    id: branchId,
    name_ar: input.name_ar,
    is_host: false,
    is_active: true,
  };
}

/**
 * @description تعديل بيانات فرع مع حماية عدم تعطيل آخر فرع نشط
 * @param {string} id - معرّف الفرع المراد تعديله
 * @param {UpdateBranchInput} input - البيانات الجديدة للفرع
 * @returns {Promise<Branch>} بيانات الفرع المحدثة
 * @throws {AppError} 404 NOT_FOUND إذا لم يوجد الفرع
 * @throws {AppError} 400 VALIDATION_ERROR إذا كانت محاولة التعطيل ستترك النظام بدون فروع نشطة
 */
export async function updateBranch(id: string, input: UpdateBranchInput): Promise<Branch> {
  const branch = await query('branches').where({ id }).first();
  if (!branch) {
    throw new AppError('NOT_FOUND', 'الفرع غير موجود', 404);
  }

  // في حال طلب تعطيل الفرع، التحقق من وجود فرع نشط آخر على الأقل
  if (input.is_active === false && Boolean(branch.is_active)) {
    const activeCountResult = await query('branches')
      .where('is_active', 1)
      .whereNot('id', id)
      .count('id as count')
      .first();

    const otherActiveCount = Number(activeCountResult?.count ?? 0);
    if (otherActiveCount === 0) {
      throw new AppError('VALIDATION_ERROR', 'لا يمكن تعطيل الفرع الوحيد النشط في النظام', 400, 'is_active');
    }
  }

  const updateData: Record<string, any> = {
    updated_at: query.raw("(datetime('now'))"),
  };

  if (input.name_ar !== undefined) updateData.name_ar = input.name_ar;
  if (input.address_ar !== undefined) updateData.address_ar = input.address_ar;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.opens_at !== undefined) updateData.opens_at = input.opens_at;
  if (input.closes_at !== undefined) updateData.closes_at = input.closes_at;
  if (input.is_active !== undefined) updateData.is_active = input.is_active ? 1 : 0;

  await query('branches').where({ id }).update(updateData);

  const updated = await query('branches').where({ id }).first();

  return {
    id: updated.id,
    name_ar: updated.name_ar,
    address_ar: updated.address_ar ?? null,
    phone: updated.phone,
    opens_at: updated.opens_at,
    closes_at: updated.closes_at,
    is_host: Boolean(updated.is_host),
    is_active: Boolean(updated.is_active),
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  };
}
