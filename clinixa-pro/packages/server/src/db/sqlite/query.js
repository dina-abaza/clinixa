"use strict";
/**
 * @fileoverview نسخة Knex query builder فعلية تُستخدم في كل الـ services
 * @description مبنية على نفس إعدادات knexfile.ts (بيئة التشغيل الحالية)
 *              ⚠️ منفصلة عن db/sqlite/client.ts (اتصال better-sqlite3 الخام المُستخدم لضبط الـ PRAGMAs الإضافية)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("knex"));
const knexfile_1 = __importDefault(require("../../../knexfile"));
const env_1 = require("../../config/env");
const environment = env_1.env.NODE_ENV;
const config = knexfile_1.default[environment];
const query = (0, knex_1.default)(config);
exports.default = query;
