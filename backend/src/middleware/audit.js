const AuditLog = require('../models/AuditLog');

/**
 * audit(resourceName) — Express middleware factory that records an AuditLog
 * entry after the response finishes.
 *
 * Guarantees:
 *   - NEVER throws into the request path and never blocks the response:
 *     the append is fire-and-forget after res 'finish', all failures are
 *     swallowed with a console.warn.
 *   - Skips unauthenticated requests (no req.user) and health/metrics paths.
 *
 * Action is derived from the HTTP method (GET→READ, POST→CREATE, PUT/PATCH→
 * UPDATE, DELETE→DELETE); handlers may override via res.locals.auditAction
 * (e.g. 'SIGN', 'ORDER', 'LOGIN') before the response is sent.
 */

const METHOD_ACTIONS = {
    GET: 'READ',
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
};

// Params most likely to identify the acted-on resource, most specific first.
const ID_PARAM_PRIORITY = [
    'id', 'patientId', 'studyId', 'encounterId', 'noteId', 'orderId',
    'invoiceId', 'consentId', 'appointmentId', 'userId',
];

function pickResourceId(params) {
    if (!params || typeof params !== 'object') return undefined;
    for (const key of ID_PARAM_PRIORITY) {
        if (params[key] != null && params[key] !== '') return String(params[key]);
    }
    // Fallback heuristic: any remaining param that looks id-ish.
    const idish = Object.keys(params).find((k) => /(^id$|id$)/i.test(k) && params[k]);
    return idish ? String(params[idish]) : undefined;
}

function isSkippablePath(url) {
    const path = String(url || '').split('?')[0].toLowerCase();
    return path.includes('/health') || path.includes('/metrics');
}

function audit(resourceName) {
    return function auditMiddleware(req, res, next) {
        res.on('finish', () => {
            try {
                if (!req.user) return; // unauthenticated / public route
                if (isSkippablePath(req.originalUrl)) return;

                const entry = {
                    actorId: req.user._id,
                    actorRole: req.user.role,
                    action: res.locals.auditAction || METHOD_ACTIONS[req.method] || req.method,
                    resource: res.locals.auditResource || resourceName,
                    resourceId: pickResourceId(req.params),
                    method: req.method,
                    path: req.originalUrl,
                    statusCode: res.statusCode,
                    ip: req.ip,
                    traceId: req.headers['x-trace-id'],
                    tenantId: req.user.tenantId || 't-default',
                };

                // Fire-and-forget: audit failures must never affect the request.
                AuditLog.append(entry).catch((err) => {
                    console.warn(`[audit] append failed for ${req.method} ${req.originalUrl}:`, err.message);
                });
            } catch (err) {
                console.warn('[audit] entry skipped:', err.message);
            }
        });
        next();
    };
}

module.exports = audit;
