/**
 * Response cache middleware backed by Redis.
 *
 * Usage: router.get('/hot/read', cacheSeconds(30), controller.handler)
 *
 * Key shape: cache:${originalUrl}:${userId|anon} — per-user because most hot
 * reads are permission-scoped (e.g. patient self-access vs clinician view).
 *
 * NOTE: mutations do NOT invalidate cached entries yet. The short TTLs
 * (15–30s) bound staleness; add explicit invalidation if that ever becomes
 * unacceptable for a route.
 *
 * When Redis isn't ready the middleware is a pure pass-through — the app
 * behaves exactly as it did before Redis existed.
 */
const { getClient, isReady } = require('../services/RedisClient');

function cacheSeconds(ttl) {
    return async (req, res, next) => {
        if (req.method !== 'GET' || !isReady()) return next();

        const userId = (req.user && req.user._id) ? String(req.user._id) : 'anon';
        const key = `cache:${req.originalUrl}:${userId}`;
        const redis = getClient();

        try {
            const hit = await redis.get(key);
            if (hit) {
                res.set('x-cache', 'HIT');
                res.type('application/json');
                return res.send(hit);
            }
        } catch (err) {
            return next(); // Redis hiccup mid-flight — serve uncached
        }

        // Miss: wrap res.json to store the serialized body on the way out.
        res.set('x-cache', 'MISS');
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300 && isReady()) {
                // Fire-and-forget; a failed SETEX must never affect the response.
                redis.setex(key, ttl, JSON.stringify(body)).catch(() => {});
            }
            return originalJson(body);
        };

        next();
    };
}

module.exports = { cacheSeconds };
