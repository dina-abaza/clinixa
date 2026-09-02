"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const branches_controller_1 = require("./branches.controller");
const router = (0, express_1.Router)();
// تطبيق ميدلوير المصادقة على جميع مسارات الفروع
router.use(auth_middleware_1.authMiddleware);
// مسارات إدارة الفروع
router.get('/', (0, permission_middleware_1.requirePermission)('admin.view'), branches_controller_1.listBranches);
router.post('/', (0, permission_middleware_1.requirePermission)('admin.edit'), branches_controller_1.createNewBranch);
router.put('/:id', (0, permission_middleware_1.requirePermission)('admin.edit'), branches_controller_1.updateBranchInfo);
exports.default = router;
