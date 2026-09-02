"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstRun = firstRun;
const setup_validation_1 = require("./setup.validation");
const setup_service_1 = require("./setup.service");
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
async function firstRun(req, res, next) {
    try {
        const parsed = setup_validation_1.firstRunSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, setup_service_1.firstRunSetup)(parsed.data);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
