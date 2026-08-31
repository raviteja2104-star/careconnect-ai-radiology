/**
 * Telemetry middleware — records method, normalized route, status code and
 * wall-clock duration for every HTTP request into the in-memory Telemetry
 * registry. Guaranteed to never throw into the request pipeline.
 */
const Telemetry = require('../services/Telemetry');

module.exports = function telemetryMiddleware(req, res, next) {
    try {
        const start = process.hrtime.bigint();
        res.on('finish', () => {
            try {
                const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
                Telemetry.record(req.method, req.originalUrl || req.url, res.statusCode, durationMs);
            } catch (_) {
                /* metrics must never break responses */
            }
        });
    } catch (_) {
        /* metrics must never break requests */
    }
    next();
};
