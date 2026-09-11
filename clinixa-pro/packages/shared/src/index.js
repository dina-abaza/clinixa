"use strict";
/**
 * @fileoverview نقطة الدخول المركزية لحزمة @clinixa/shared
 * @description يُصدِّر كل ما يحتاجه السيرفر والفرونت من صلاحيات وثوابت وأنواع
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYNC_MODES = exports.BACKUP_FAIL_REASON = exports.BACKUP_DESTINATION = exports.BACKUP_KIND = exports.BACKUP_STATUS = exports.SYSTEM_ALERT_TYPES = exports.EMERGENCY_CONTACT_RELATION = exports.GENDER = exports.SYNCABLE_TABLES = exports.SYNC_STATUSES = exports.DOCUMENT_TYPES = exports.MEDICATION_STATUSES = exports.LAB_STATUSES = exports.MEDICAL_HISTORY_CATEGORIES = exports.MEDICAL_ALERT_TYPES = exports.FOLLOW_UP_STATUSES = exports.SPECIALTIES = exports.INVENTORY_TYPES = exports.ROLES = exports.ATTENDANCE_STATUSES = exports.PAYMENT_METHODS = exports.CHARGE_TYPES = exports.isValidPermission = exports.PERMISSIONS = void 0;
// الصلاحيات
var permissions_1 = require("./permissions");
Object.defineProperty(exports, "PERMISSIONS", { enumerable: true, get: function () { return permissions_1.PERMISSIONS; } });
Object.defineProperty(exports, "isValidPermission", { enumerable: true, get: function () { return permissions_1.isValidPermission; } });
// الثوابت
var constants_1 = require("./constants");
Object.defineProperty(exports, "CHARGE_TYPES", { enumerable: true, get: function () { return constants_1.CHARGE_TYPES; } });
Object.defineProperty(exports, "PAYMENT_METHODS", { enumerable: true, get: function () { return constants_1.PAYMENT_METHODS; } });
Object.defineProperty(exports, "ATTENDANCE_STATUSES", { enumerable: true, get: function () { return constants_1.ATTENDANCE_STATUSES; } });
Object.defineProperty(exports, "ROLES", { enumerable: true, get: function () { return constants_1.ROLES; } });
Object.defineProperty(exports, "INVENTORY_TYPES", { enumerable: true, get: function () { return constants_1.INVENTORY_TYPES; } });
Object.defineProperty(exports, "SPECIALTIES", { enumerable: true, get: function () { return constants_1.SPECIALTIES; } });
Object.defineProperty(exports, "FOLLOW_UP_STATUSES", { enumerable: true, get: function () { return constants_1.FOLLOW_UP_STATUSES; } });
Object.defineProperty(exports, "MEDICAL_ALERT_TYPES", { enumerable: true, get: function () { return constants_1.MEDICAL_ALERT_TYPES; } });
Object.defineProperty(exports, "MEDICAL_HISTORY_CATEGORIES", { enumerable: true, get: function () { return constants_1.MEDICAL_HISTORY_CATEGORIES; } });
Object.defineProperty(exports, "LAB_STATUSES", { enumerable: true, get: function () { return constants_1.LAB_STATUSES; } });
Object.defineProperty(exports, "MEDICATION_STATUSES", { enumerable: true, get: function () { return constants_1.MEDICATION_STATUSES; } });
Object.defineProperty(exports, "DOCUMENT_TYPES", { enumerable: true, get: function () { return constants_1.DOCUMENT_TYPES; } });
Object.defineProperty(exports, "SYNC_STATUSES", { enumerable: true, get: function () { return constants_1.SYNC_STATUSES; } });
Object.defineProperty(exports, "SYNCABLE_TABLES", { enumerable: true, get: function () { return constants_1.SYNCABLE_TABLES; } });
Object.defineProperty(exports, "GENDER", { enumerable: true, get: function () { return constants_1.GENDER; } });
Object.defineProperty(exports, "EMERGENCY_CONTACT_RELATION", { enumerable: true, get: function () { return constants_1.EMERGENCY_CONTACT_RELATION; } });
Object.defineProperty(exports, "SYSTEM_ALERT_TYPES", { enumerable: true, get: function () { return constants_1.SYSTEM_ALERT_TYPES; } });
Object.defineProperty(exports, "BACKUP_STATUS", { enumerable: true, get: function () { return constants_1.BACKUP_STATUS; } });
Object.defineProperty(exports, "BACKUP_KIND", { enumerable: true, get: function () { return constants_1.BACKUP_KIND; } });
Object.defineProperty(exports, "BACKUP_DESTINATION", { enumerable: true, get: function () { return constants_1.BACKUP_DESTINATION; } });
Object.defineProperty(exports, "BACKUP_FAIL_REASON", { enumerable: true, get: function () { return constants_1.BACKUP_FAIL_REASON; } });
Object.defineProperty(exports, "SYNC_MODES", { enumerable: true, get: function () { return constants_1.SYNC_MODES; } });
//# sourceMappingURL=index.js.map