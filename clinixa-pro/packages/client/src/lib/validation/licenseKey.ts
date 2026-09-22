/**
 * التحقق من صيغة مفتاح الترخيص:
 *   CLX-[DUR4]-[SIG4]-[SIG4]-[SIG4]  (Setup Key)
 *   ACT-[DUR4]-[SIG4]-[SIG4]-[SIG4]  (Activation Code)
 * مثال: ACT-006M-A1B2-C3D4-E5F6
 */
export const LICENSE_KEY_RE = /^(CLX|ACT)-\d{3}[IHDWMY]-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

/**
 * تنسيق مفتاح الترخيص تلقائياً أثناء الكتابة
 * يضيف الشُرَط (-) ويحوّل الحروف إلى كابيتال
 */
export function formatLicenseKey(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const parts: string[] = [];

  if (clean.length > 0) parts.push(clean.slice(0, 3));   // CLX or ACT
  if (clean.length > 3) parts.push(clean.slice(3, 7));   // 006M
  if (clean.length > 7) parts.push(clean.slice(7, 11));  // A1B2
  if (clean.length > 11) parts.push(clean.slice(11, 15)); // C3D4
  if (clean.length > 15) parts.push(clean.slice(15, 19)); // E5F6

  return parts.join('-');
}

