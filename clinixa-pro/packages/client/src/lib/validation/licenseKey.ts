/** الشكل: CLX-XXXX-XXXX-XXXX — التحقق على الشكل بس، والتفعيل الحقيقي شغل الباك */
export const LICENSE_KEY_RE = /^CLX-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/**
 * تنسيق مفتاح الترخيص أثناء الكتابة — الشرطات بتتحط لوحدها والحروف كابيتال.
 * نفس fmtKey() في البروتوتايب.
 */
export function formatLicenseKey(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
  const parts = [clean.slice(0, 3)];
  if (clean.length > 3) parts.push(clean.slice(3, 7));
  if (clean.length > 7) parts.push(clean.slice(7, 11));
  if (clean.length > 11) parts.push(clean.slice(11, 15));
  return parts.join('-');
}
