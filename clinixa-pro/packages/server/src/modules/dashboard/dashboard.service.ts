import { dashboardRepository } from './dashboard.repository';

/**
 * @description خدمة لوحة التحكم - تجميع البيانات المطلوبة للشاشة الرئيسية
 */
export const dashboardService = {
  /**
   * @description الحصول على ملخص إحصائيات اليوم لفرع معين
   * @param branchId - معرف الفرع
   */
  async getDashboardSummary(branchId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [todayCount, waitingCount, payTotal, lowStockCount, patients] = await Promise.all([
      dashboardRepository.getTodayAttendanceCount(branchId, today),
      dashboardRepository.getWaitingCount(branchId, today),
      dashboardRepository.getTodayPaymentsTotal(branchId, today),
      dashboardRepository.getLowStockCount(branchId),
      dashboardRepository.getTodayPatientsList(branchId, today)
    ]);

    return {
      stats: {
        today_attendance: todayCount,
        waiting_count: waitingCount,
        today_payments: payTotal,
        low_stock_count: lowStockCount,
      },
      today_patients: patients
    };
  }
};
