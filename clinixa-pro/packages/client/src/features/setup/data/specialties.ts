/**
 * قايمة تخصصات العيادة — ٢٠ تخصص في ٤ مجموعات، مطابقة بالحرف لـ
 * prototype/screens/auth/00-first-run-setup.html (قرار 265، ٢٣ أغسطس ٢٠٢٦).
 * النصوص المعروضة نفسها موجودة في lib/i18n/locales (setup.clinic.groups /
 * setup.clinic.specialties) — الملف ده بيحدد الترتيب والتجميع بس.
 *
 * ⚠⚠ تعارض عقد موثّق — لسه من غير حل:
 * `@clinixa/shared/constants.ts` (`SPECIALTIES`) لسه شايل قايمة أقدم من قرار
 * 265 (بمفاتيح مختلفة زي `pediatrics` بدل `pediatric`، `diabetes` بدل
 * `endocrine`، وفيها عناصر اتستبعدت بالقرار زي `dentistry`/`ent`/`surgery`)،
 * وهي نفس القايمة اللي الباك (`setup.validation.ts`) بيتحقق منها فعليًا.
 * التقاطع الحرفي بين القايمتين ٥ مفاتيح بس: cardio · chest · gastro · ortho ·
 * internal — أي اختيار تاني من الـ ١٥ الباقيين هيرجع 400 VALIDATION_ERROR
 * ("التخصص غير معروف") من السيرفر الحالي، لحد ما حد يحدّث القايمة في
 * `@clinixa/shared` لتطابق قرار 265 (مش من مسؤولية الفرونت — تعديل حزمة
 * مشتركة برّه `packages/client`).
 */
export interface SpecialtyGroup {
  key: 'general' | 'chronic' | 'ortho' | 'longterm';
  specialties: readonly string[];
}

export const SPECIALTY_GROUPS: readonly SpecialtyGroup[] = [
  { key: 'general', specialties: ['internal', 'family', 'geriatrics', 'pediatric'] },
  {
    key: 'chronic',
    specialties: [
      'cardio',
      'endocrine',
      'nephro',
      'gastro',
      'chest',
      'neuro',
      'rheum',
      'immuno',
      'hema',
    ],
  },
  { key: 'ortho', specialties: ['ortho', 'rehab'] },
  { key: 'longterm', specialties: ['derma', 'psych', 'nutrition', 'uro', 'obgyn'] },
] as const;

export const SPECIALTY_KEYS = SPECIALTY_GROUPS.flatMap((g) => g.specialties);
export type SpecialtyKey = (typeof SPECIALTY_KEYS)[number];
