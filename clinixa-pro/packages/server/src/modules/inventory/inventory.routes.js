"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const inventory_controller_1 = require("./inventory.controller");
const router = (0, express_1.Router)();
// تطبيق ميدلوير المصادقة على جميع مسارات المخزون
router.use(auth_middleware_1.authMiddleware);
// مسارات إدارة المخزون
router.get('/', (0, permission_middleware_1.requirePermission)('inv.view'), inventory_controller_1.listInventory);
router.post('/', (0, permission_middleware_1.requirePermission)('inv.add'), inventory_controller_1.createItem);
router.put('/:id', (0, permission_middleware_1.requirePermission)('inv.edit'), inventory_controller_1.updateItem);
router.patch('/:id/adjust-qty', (0, permission_middleware_1.requirePermission)('inv.edit'), inventory_controller_1.adjustQty);
exports.default = router;
