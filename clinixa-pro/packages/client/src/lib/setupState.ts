/**
 * علامة "الإعداد الأول اتعمل على الجهاز ده" — منفصلة عمدًا عن `authStore`
 * (اللي بيتصفر عند تسجيل الخروج). الإعداد **مايتكررش** لما المستخدم يسجّل
 * خروج، فمينفعش نعتمد على وجود توكن للحكم على كده.
 *
 * ⚠ الباك مفيهوش `GET /api/setup/status` (ولا أي endpoint تاني يقول
 * "العيادة متظبّطة بالفعل؟") — العلامة دي أفضل بديل من غير endpoint جديد،
 * وهي مضبوطة لموديل النظام الفعلي: تطبيق Desktop على جهاز واحد بالعيادة
 * (راجع docs/04-design-system.md §0)، مش متصفح مشترك بين أجهزة متعددة.
 * لو الـ localStorage اتمسح على نفس الجهاز، محاولة `POST /api/setup/first-run`
 * تاني هترجع 409 CONFLICT من الباك برضه (`clinic_settings` لسه موجودة) —
 * يعني الحماية الحقيقية من التكرار الفعلي موجودة في الباك أصلًا، والعلامة
 * دي بس بتوفّر على المستخدم إنه يعدّي على ٤ خطوات عشان يوصل للرفض ده.
 */
const SETUP_COMPLETE_KEY = 'clinixa.setup_complete';

export function markSetupComplete(): void {
  try {
    localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
  } catch {
    // localStorage ممكن يكون مقفول (وضع خاص متشدد) — مفيش داعي نكسر التطبيق عشانه
  }
}

export function isSetupComplete(): boolean {
  try {
    return localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';
  } catch {
    return false;
  }
}
