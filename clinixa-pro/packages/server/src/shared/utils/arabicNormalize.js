"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeArabicText = normalizeArabicText;
/**
 * @description دالة توحيد الحروف العربية للبحث والحفظ (Normalizer)
 * تقوم بتحويل: (أ / إ / آ ➔ ا)، (ة ➔ ه)، (ى ➔ ي) وإزالة التشكيل
 * @param {string} text - النص العربي المراد توحيده
 * @returns {string} النص بعد التوحيد
 */
function normalizeArabicText(text) {
    if (!text)
        return '';
    return text
        .replace(/[\u064B-\u0652]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .trim();
}
