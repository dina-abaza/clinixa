/**
 * حروف وألوان الـ Avatar — نفس منطق `initials()`/`avatarClass()` بالحرف من
 * البروتوتايب (prototype/screens/patients/03-patients-list.html) — مفيش رفع
 * صور شخصية في أي مكان في النظام (Design System §3، مكوّن Avatar).
 */

/** أول حرف من أول كلمتين، مع تخطي "ال" التعريف: "سارة الجندي" ← "س ج" */
export function getAvatarInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => (p.startsWith('ال') && p.length > 2 ? p[2] : p[0])).join(' ');
}

/** لون الـ Avatar من الاسم نفسه (٦ ألوان ثابتة `.av-1`..`.av-6`) — نفس الشخص بياخد نفس اللون دايمًا */
export function getAvatarColorClass(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return `av-${(h % 6) + 1}`;
}
