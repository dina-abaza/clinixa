import type { Permission } from '@clinixa/shared';

/**
 * فحص صلاحية واحدة في مصفوفة صلاحيات الموظف الحالي (`employee.permissions`
 * من `GET /api/auth/session` أو `POST /api/auth/login`) — نفس منطق إخفاء
 * عناصر الـ Sidebar في البروتوتايب: "اللي المستخدم مش من صلاحيته بيتخفي
 * بالكامل — مش Disabled".
 */
export function hasPermission(permissions: Permission[] | undefined, required: Permission): boolean {
  return Boolean(permissions?.includes(required));
}
