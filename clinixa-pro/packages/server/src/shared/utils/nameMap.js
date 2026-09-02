"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapArabicNameToEnglish = void 0;
exports.generateEnglishName = generateEnglishName;
const arabicNormalize_1 = require("./arabicNormalize");
/**
 * @description قاموس الكلمات والأسماء الشائعة للتحويل الدقيق
 */
const COMMON_NAMES_MAP = {
    'محمد': 'Mohamed',
    'محمود': 'Mahmoud',
    'أحمد': 'Ahmed',
    'احمد': 'Ahmed',
    'مصطفى': 'Mustafa',
    'مصطفي': 'Mustafa',
    'علي': 'Ali',
    'حسن': 'Hassan',
    'حسين': 'Hussein',
    'إبراهيم': 'Ibrahim',
    'ابراهيم': 'Ibrahim',
    'عبدالله': 'Abdallah',
    'عبد الله': 'Abdallah',
    'عبدالرحمن': 'Abdelrahman',
    'عبد الرحمن': 'Abdelrahman',
    'عمر': 'Omar',
    'عمرو': 'Amr',
    'خالد': 'Khaled',
    'سعيد': 'Said',
    'طارق': 'Tarek',
    'يوسف': 'Youssef',
    'أيمن': 'Ayman',
    'ايمن': 'Ayman',
    'سامح': 'Sameh',
    'وليد': 'Waleed',
    'فاطمة': 'Fatma',
    'فاطمه': 'Fatma',
    'منى': 'Mona',
    'منه': 'Menna',
    'منة': 'Menna',
    'سارة': 'Sara',
    'ساره': 'Sara',
    'مريم': 'Mariam',
    'نورة': 'Noura',
    'نوره': 'Noura',
    'رانيا': 'Rania',
    'دينا': 'Dina',
    'هدى': 'Hoda',
    'هدي': 'Hoda',
};
/**
 * @description تحويل تلقائي ذكي من الاسم العربي للاسم الإنجليزي
 * 1. يبحث أولاً في قاموس الأسماء الشائعة (مثل: "محمد" ➔ "Mohamed", "أحمد" ➔ "Ahmed")
 * 2. إذا لم تكن الكلمة في القاموس، يطبق النقل الحرفي (Character-by-character transliteration)
 * @param {string} nameAr - الاسم العربي
 * @returns {string} الاسم بالحروف اللاتينية
 */
function generateEnglishName(nameAr) {
    if (!nameAr)
        return '';
    const charMap = {
        'أ': 'a', 'إ': 'i', 'آ': 'a', 'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
        'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
        'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
        'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'y', 'ة': 'h',
    };
    const words = nameAr.trim().split(/\s+/);
    const translatedWords = words.map((word) => {
        const cleanWord = (0, arabicNormalize_1.normalizeArabicText)(word);
        if (COMMON_NAMES_MAP[word])
            return COMMON_NAMES_MAP[word];
        if (COMMON_NAMES_MAP[cleanWord])
            return COMMON_NAMES_MAP[cleanWord];
        const transliterated = word
            .split('')
            .map((char) => charMap[char] ?? char)
            .join('');
        return transliterated.charAt(0).toUpperCase() + transliterated.slice(1).toLowerCase();
    });
    return translatedWords.join(' ');
}
exports.mapArabicNameToEnglish = generateEnglishName;
