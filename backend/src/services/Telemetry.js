/**
 * Telemetry — dependency-free in-memory HTTP metrics registry.
 *
 * Collects per-route counters + latency histograms and process-level gauges,
 * and exposes them two ways:
 *   - snapshot():        JSON for the admin observability dashboard
 *   - prometheusText():  Prometheus text exposition format for /metrics
 *
 * Design notes:
 *   - Routes are keyed by "METHOD templatePath" where dynamic path segments
 *     (Mongo ObjectIds, UUIDs, plain numbers) are normalized to ":id" so
 *     /api/emr/patients/64ab.../summary and /api/emr/patients/6501.../summary
 *     aggregate under /api/emr/patients/:id/summary.
 *   - Latency histogram buckets are cumulative-on-read (stored as per-bucket
 *     counts, cumulated when rendering Prometheus text / percentiles).
 *   - A 60-slot ring buffer of 60s buckets keeps a rolling 60-minute window
 *     of {requests, 5xx} so windowed error rate / availability are honest
 *     (all-time counters never "recover" after an incident; the window does).
 *   - Everything is wrapped so record() can never throw into the request path.
 */

const BUCKET_BOUNDS_MS = [25, 50, 100, 250, 500, 1000, 2500, 5000]; // +Inf implicit
const MAX_ROUTES = 300; // memory guard against path-cardinality explosions
const RING_SLOTS = 60; // 60 x 60s buckets = rolling 60-minute window

const HEX24_RE = /^[0-9a-f]{24}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUM_RE = /^\d+$/;

function normalizePath(rawPath) {
    const path = String(rawPath || '/').split('?')[0].split('#')[0];
    const segments = path.split('/').map((seg) => {
        if (!seg) return seg;
        if (HEX24_RE.test(seg) || UUID_RE.test(seg) || NUM_RE.test(seg)) return ':id';
        return seg;
    });
    const normalized = segments.join('/') || '/';
    return normalized.length > 1 && normalized.endsWith('/')
        ? normalized.slice(0, -1)
        : normalized;
}

function newHistogram() {
    return {
        counts: new Array(BUCKET_BOUNDS_MS.length + 1).fill(0), // last slot = +Inf
        sumMs: 0,
        count: 0,
    };
}

function observe(hist, durationMs) {
    let idx = BUCKET_BOUNDS_MS.length; // +Inf by default
    for (let i = 0; i < BUCKET_BOUNDS_MS.length; i++) {
        if (durationMs <= BUCKET_BOUNDS_MS[i]) { idx = i; break; }
    }
    hist.counts[idx] += 1;
    hist.sumMs += durationMs;
    hist.count += 1;
}

/**
 * Percentile estimate from histogram buckets, Prometheus-style linear
 * interpolation inside the bucket. Requests in +Inf are reported at the
 * highest finite bound (5000ms) — an honest floor, not an invention.
 */
function percentile(hist, q) {
    if (!hist.count) return 0;
    const rank = q * hist.count;
    let cumulative = 0;
    for (let i = 0; i < hist.counts.length; i++) {
        const prevCumulative = cumulative;
        cumulative += hist.counts[i];
        if (cumulative >= rank) {
            if (i >= BUCKET_BOUNDS_MS.length) return BUCKET_BOUNDS_MS[BUCKET_BOUNDS_MS.length - 1];
            const lower = i === 0 ? 0 : BUCKET_BOUNDS_MS[i - 1];
            const upper = BUCKET_BOUNDS_MS[i];
            const bucketCount = hist.counts[i];
            if (!bucketCount) return upper;
            return lower + ((upper - lower) * (rank - prevCumulative)) / bucketCount;
        }
    }
    return BUCKET_BOUNDS_MS[BUCKET_BOUNDS_MS.length - 1];
}

class Telemetry {
    constructor() {
        this.startedAt = Date.now();
        /** @type {Map<string, object>} key: "METHOD path" */
        this.routes = new Map();
        this.overall = {
            count: 0,
            errors4xx: 0,
            errors5xx: 0,
            histogram: newHistogram(),
        };
        // Rolling 60-minute window: ring of per-minute {epochMinute, count, errors5xx}
        this.ring = new Array(RING_SLOTS).fill(null).map(() => ({ epochMinute: -1, count: 0, errors5xx: 0 }));

        // Event-loop-lag probe: how late does a 500ms timer fire?
        this.eventLoopLagMs = 0;
        this._lagExpected = Date.now() + 500;
        this._lagTimer = setInterval(() => {
            const now = Date.now();
            this.eventLoopLagMs = Math.max(0, now - this._lagExpected);
            this._lagExpected = now + 500;
        }, 500);
        if (this._lagTimer.unref) this._lagTimer.unref(); // never keep the process alive
    }

    record(method, path, status, durationMs) {
        try {
            const m = String(method || 'GET').toUpperCase();
            const route = normalizePath(path);
            const key = `${m} ${route}`;
            const statusNum = Number(status) || 0;
            const duration = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;

            let entry = this.routes.get(key);
            if (!entry) {
                if (this.routes.size >= MAX_ROUTES) {
                    // Cardinality guard: overflow routes aggregate under "other".
                    entry = this.routes.get(`${m} other`);
                    if (!entry) {
                        entry = this._newRouteEntry(m, 'other');
                        this.routes.set(`${m} other`, entry);
                    }
                } else {
                    entry = this._newRouteEntry(m, route);
                    this.routes.set(key, entry);
                }
            }

            const statusClass = `${Math.floor(statusNum / 100)}xx`;
            entry.count += 1;
            entry.statusClasses[statusClass] = (entry.statusClasses[statusClass] || 0) + 1;
            this.overall.count += 1;
            if (statusNum >= 500) {
                entry.errors5xx += 1;
                this.overall.errors5xx += 1;
            } else if (statusNum >= 400) {
                entry.errors4xx += 1;
                this.overall.errors4xx += 1;
            }
            observe(entry.histogram, duration);
            observe(this.overall.histogram, duration);

            // Rolling window ring buffer
            const epochMinute = Math.floor(Date.now() / 60000);
            const slot = this.ring[epochMinute % RING_SLOTS];
            if (slot.epochMinute !== epochMinute) {
                slot.epochMinute = epochMinute;
                slot.count = 0;
                slot.errors5xx = 0;
            }
            slot.count += 1;
            if (statusNum >= 500) slot.errors5xx += 1;
        } catch (_) {
            /* metrics must never break the request path */
        }
    }

    _newRouteEntry(method, route) {
        return {
            method,
            route,
            count: 0,
            errors4xx: 0,
            errors5xx: 0,
            statusClasses: {},
            histogram: newHistogram(),
        };
    }

    /** Rolling-window totals over the last `minutes` (max 60). */
    windowTotals(minutes = 60) {
        const span = Math.min(Math.max(1, minutes), RING_SLOTS);
        const nowMinute = Math.floor(Date.now() / 60000);
        let count = 0;
        let errors5xx = 0;
        let observedMinutes = 0;
        for (const slot of this.ring) {
            if (slot.epochMinute >= 0 && nowMinute - slot.epochMinute < span) {
                count += slot.count;
                errors5xx += slot.errors5xx;
                observedMinutes += 1;
            }
        }
        return { spanMinutes: span, observedMinutes, count, errors5xx };
    }

    snapshot() {
        const mem = process.memoryUsage();
        const uptimeSeconds = process.uptime();
        const window = this.windowTotals(60);
        const o = this.overall;

        const routeStats = [...this.routes.values()]
            .map((r) => ({
                method: r.method,
                route: r.route,
                count: r.count,
                errors4xx: r.errors4xx,
                errors5xx: r.errors5xx,
                errorRate: r.count ? (r.errors4xx + r.errors5xx) / r.count : 0,
                avgMs: r.histogram.count ? r.histogram.sumMs / r.histogram.count : 0,
                p50: percentile(r.histogram, 0.5),
                p90: percentile(r.histogram, 0.9),
                p99: percentile(r.histogram, 0.99),
            }))
            .sort((a, b) => b.count - a.count);

        return {
            generatedAt: new Date().toISOString(),
            process: {
                uptimeSeconds,
                startedAt: new Date(this.startedAt).toISOString(),
                memoryRssBytes: mem.rss,
                heapUsedBytes: mem.heapUsed,
                eventLoopLagMs: this.eventLoopLagMs,
            },
            totals: {
                count: o.count,
                errors4xx: o.errors4xx,
                errors5xx: o.errors5xx,
                errorRate: o.count ? (o.errors4xx + o.errors5xx) / o.count : 0,
                availability: o.count ? 1 - o.errors5xx / o.count : 1,
                avgMs: o.histogram.count ? o.histogram.sumMs / o.histogram.count : 0,
                p50: percentile(o.histogram, 0.5),
                p90: percentile(o.histogram, 0.9),
                p99: percentile(o.histogram, 0.99),
            },
            window: {
                spanMinutes: window.spanMinutes,
                observedMinutes: window.observedMinutes,
                count: window.count,
                errors5xx: window.errors5xx,
                availability: window.count ? 1 - window.errors5xx / window.count : 1,
                requestsPerMinute: window.observedMinutes ? window.count / window.observedMinutes : 0,
            },
            routes: routeStats,
        };
    }

    prometheusText() {
        const lines = [];
        const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

        lines.push('# HELP http_requests_total Total HTTP requests by route and status class.');
        lines.push('# TYPE http_requests_total counter');
        for (const r of this.routes.values()) {
            for (const [statusClass, n] of Object.entries(r.statusClasses)) {
                lines.push(
                    `http_requests_total{method="${esc(r.method)}",route="${esc(r.route)}",status_class="${esc(statusClass)}"} ${n}`
                );
            }
        }

        lines.push('# HELP http_request_duration_ms HTTP request duration in milliseconds.');
        lines.push('# TYPE http_request_duration_ms histogram');
        for (const r of this.routes.values()) {
            const labels = `method="${esc(r.method)}",route="${esc(r.route)}"`;
            let cumulative = 0;
            for (let i = 0; i < BUCKET_BOUNDS_MS.length; i++) {
                cumulative += r.histogram.counts[i];
                lines.push(`http_request_duration_ms_bucket{${labels},le="${BUCKET_BOUNDS_MS[i]}"} ${cumulative}`);
            }
            cumulative += r.histogram.counts[BUCKET_BOUNDS_MS.length];
            lines.push(`http_request_duration_ms_bucket{${labels},le="+Inf"} ${cumulative}`);
            lines.push(`http_request_duration_ms_sum{${labels}} ${r.histogram.sumMs.toFixed(3)}`);
            lines.push(`http_request_duration_ms_count{${labels}} ${r.histogram.count}`);
        }

        const mem = process.memoryUsage();
        lines.push('# HELP careconnect_process_uptime_seconds Process uptime in seconds.');
        lines.push('# TYPE careconnect_process_uptime_seconds gauge');
        lines.push(`careconnect_process_uptime_seconds ${process.uptime().toFixed(3)}`);
        lines.push('# HELP careconnect_process_memory_rss_bytes Resident set size in bytes.');
        lines.push('# TYPE careconnect_process_memory_rss_bytes gauge');
        lines.push(`careconnect_process_memory_rss_bytes ${mem.rss}`);
        lines.push('# HELP careconnect_process_heap_used_bytes V8 heap used in bytes.');
        lines.push('# TYPE careconnect_process_heap_used_bytes gauge');
        lines.push(`careconnect_process_heap_used_bytes ${mem.heapUsed}`);
        lines.push('# HELP careconnect_process_event_loop_lag_ms Event loop lag sampled every 500ms.');
        lines.push('# TYPE careconnect_process_event_loop_lag_ms gauge');
        lines.push(`careconnect_process_event_loop_lag_ms ${this.eventLoopLagMs}`);

        return `${lines.join('\n')}\n`;
    }
}

module.exports = new Telemetry();
module.exports.normalizePath = normalizePath; // exposed for tests
