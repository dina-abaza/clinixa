import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import query from '../../db/sqlite/query';

/**
 * @description متحكم لوحة التحكم - معالجة طلبات الإحصائيات
 */
export const dashboardController = {
  /**
   * @description جلب بيانات ملخص لوحة التحكم
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      let branchId = req.employee?.branch_id;

      // لو المالك داخل من غير فرع محدد، نستخدم الفرع الرئيسي (Host)
      if (!branchId && req.employee?.is_owner) {
        const hostBranch = await query('branches').where({ is_host: 1 }).first();
        branchId = hostBranch?.id;
      }

      if (!branchId) {
        return res.status(400).json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'يجب تحديد فرع لعرض لوحة التحكم'
          }
        });
      }

      const data = await dashboardService.getDashboardSummary(branchId);

      res.json({
        ok: true,
        data,
        warning: null
      });
    } catch (error) {
      next(error);
    }
  }
};
