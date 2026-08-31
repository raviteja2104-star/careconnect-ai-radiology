/**
 * Fixed-window rate limiter backed by Redis INCR + EXPIRE.
 *
 * Key shape: rl:${ip}:${bucket} where bucket = floor(now / windowMs).
 * Default: 300 requests per 60s window per IP. On breach: 429 with a
 * Retry-After header pointing at the start of the next window.
 *
 * Pass-through when Redis is unavailable — rate limiting is a protection
 * layer, not a dependency; the app must keep serving without it.
 */
const { getClient, isReady } = require('../services/RedisClient');

function rateLimit({ windowMs = 60 * 1000, max = 300 } = {}) {
    return async (req, res, next) => {
        if (!isReady()) return next();

        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const bucket = Math.floor(Date.now() / windowMs);
        const key = `rl:${ip}:${bucket}`;

        try {
            const redis = getClient();
            const count = await redis.incr(key);
            if (count === 1) {
                // First hit in this window — set the window expiry (+1s slack).
                await redis.expire(key, Math.ceil(windowMs / 1000) + 1);
            }

            if (count > max) {
                const retryAfterSec = Math.ceil(((bucket + 1) * windowMs - Date.now()) / 1000);
                res.set('Retry-After', String(Math.max(retryAfterSec, 1)));
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests, please slow down.',
                });
            }
        } catch (err) {
            // Redis hiccup — never block traffic because the limiter is down.
        }

        next();
    };
}

module.exports = { rateLimit };
