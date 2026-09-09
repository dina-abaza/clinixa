/** الشكل: CLX-[DUR4]-[SIG4]-[SIG4]-[SIG4] مثال: CLX-007D-C26A-1250-CEDC */
export const LICENSE_KEY_RE = /^CLX-\d{3}[IHDWMY]-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/**
 * تنسيق مفتاح الترخيص أثناء الكتابة — الشرطات بتتحط لوحدها والحروف كابيتال.
 * الصيغة الجديدة: CLX-[4]-[4]-[4]-[4] = 19 حرف بدون شرطات
 * القطعة الأولى: CLX (3 أحرف ثابتة)
 * ثم 4 قطع كل منها 4 أحرف
 */
export function formatLicenseKey(raw: string): string {
  // نحافظ على الأرقام والحروف فقط، ونقصر على 19 حرف (CLX + 4*4)
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 19);

  const parts: string[] = [];

  // القطعة الأولى: CLX (3 أحرف)
  if (clean.length > 0) parts.push(clean.slice(0, 3));
  // القطعة الثانية: DUR (4 أحرف — وحدة الزمن)
  if (clean.length > 3) parts.push(clean.slice(3, 7));
  // القطعة الثالثة: SIG1
  if (clean.length > 7) parts.push(clean.slice(7, 11));
  // القطعة الرابعة: SIG2
  if (clean.length > 11) parts.push(clean.slice(11, 15));
  // القطعة الخامسة: SIG3
  if (clean.length > 15) parts.push(clean.slice(15, 19));

  return parts.join('-');
}
