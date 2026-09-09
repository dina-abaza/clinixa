import query from '../../db/sqlite/query';

/**
 * @description مستودع بيانات لوحة التحكم - يحتوي على الاستعلامات المجمعة للإحصائيات
 */
export const dashboardRepository = {
  /**
   * @description حساب إجمالي الحالات المسجلة اليوم في فرع معين
   */
  async getTodayAttendanceCount(branchId: string, date: string): Promise<number> {
    const result = await query('attendance')
      .where({ branch_id: branchId, date })
      .count('id as count')
      .first();
    return Number(result?.count || 0);
  },

  /**
   * @description حساب عدد المرضى الموجودين في قائمة الانتظار حالياً
   */
  async getWaitingCount(branchId: string, date: string): Promise<number> {
    const result = await query('attendance')
      .where({ branch_id: branchId, date, status: 'waiting' })
      .count('id as count')
      .first();
    return Number(result?.count || 0);
  },

  /**
   * @description حساب إجمالي المبالغ المحصلة اليوم
   */
  async getTodayPaymentsTotal(branchId: string, date: string): Promise<number> {
    const result = await query('payments')
      .where({ branch_id: branchId, date })
      .sum('amount as total')
      .first();
    return Number(result?.total || 0);
  },

  /**
   * @description حساب عدد الأصناف التي وصلت للحد الأدنى في المخزون
   */
  async getLowStockCount(branchId: string): Promise<number> {
    const result = await query('inventory_items')
      .where({ branch_id: branchId, is_active: 1 })
      .andWhere(function() {
        this.whereNotNull('min_qty').andWhere('qty', '<=', query.ref('min_qty'));
      })
      .count('id as count')
      .first();
    return Number(result?.count || 0);
  },

  /**
   * @description جلب قائمة مرضى اليوم مع بياناتهم الأساسية وحالتهم
   */
  async getTodayPatientsList(branchId: string, date: string) {
    return query('attendance as a')
      .join('patients as p', 'a.patient_id', 'p.id')
      .where({ 'a.branch_id': branchId, 'a.date': date })
      .select(
        'a.id as attendance_id',
        'a.status',
        'a.time',
        'p.id as patient_id',
        'p.display_id',
        'p.name_ar',
        'p.phone'
      )
      .orderBy('a.time', 'asc');
  }
};
