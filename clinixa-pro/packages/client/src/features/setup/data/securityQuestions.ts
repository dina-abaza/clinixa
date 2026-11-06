/** أسئلة الأمان الست — نفس الترتيب والمفاتيح في البروتوتايب */
export const SECURITY_QUESTION_KEYS = [
  'school',
  'mother',
  'city',
  'pet',
  'friend',
  'teacher',
] as const;

export type SecurityQuestionKey = (typeof SECURITY_QUESTION_KEYS)[number];
