"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arabicNormalizeMiddleware = arabicNormalizeMiddleware;
const arabicNormalize_1 = require("../shared/utils/arabicNormalize");
/**
 * @description Middleware توحيد النصوص العربية القادمة في body أو query تلقائياً
 */
function arabicNormalizeMiddleware(req, _res, next) {
    if (req.body && typeof req.body === 'object') {
        normalizeObject(req.body);
    }
    next();
}
function normalizeObject(obj) {
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string' && (key.endsWith('_ar') || key === 'name_ar')) {
            obj[`${key}_normalized`] = (0, arabicNormalize_1.normalizeArabicText)(obj[key]);
        }
        else if (typeof obj[key] === 'object' && obj[key] !== null) {
            normalizeObject(obj[key]);
        }
    }
}
