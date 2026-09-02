"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const setup_controller_1 = require("./setup.controller");
const router = (0, express_1.Router)();
router.post('/first-run', setup_controller_1.firstRun);
exports.default = router;
