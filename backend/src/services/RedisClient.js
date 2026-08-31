/**
 * RedisClient — lazy shared singleton for the monolith.
 *
 * Design goals:
 *  - The app must keep working exactly as before when Redis is absent.
 *    Consumers therefore check `isReady()` and skip Redis entirely when false.
 *  - `enableOfflineQueue: false` ensures commands fail fast instead of
 *    buffering forever while Redis is down.
 *  - The 'error' listener logs once per outage instead of spamming on every
 *    failed reconnect attempt.
 */
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let client = null;
let errorLogged = false;

function getClient() {
    if (!client) {
        client = new Redis(REDIS_URL, {
            enableOfflineQueue: false,      // fail fast when disconnected
            connectTimeout: 2000,            // short connect timeout
            maxRetriesPerRequest: 1,
            retryStrategy(times) {
                // Back off up to 30s between reconnect attempts, retry forever.
                return Math.min(times * 1000, 30000);
            },
            lazyConnect: false,
        });

        client.on('error', (err) => {
            if (!errorLogged) {
                console.warn(`[Redis] Unavailable (${err.code || err.message}) — continuing without cache/rate-limit. Will keep retrying quietly.`);
                errorLogged = true;
            }
        });

        client.on('ready', () => {
            errorLogged = false; // re-arm the one-shot error log for the next outage
            console.log('[Redis] Connected and ready');
        });
    }
    return client;
}

/**
 * True only when the connection is established and commands can be issued.
 * Every consumer must treat `false` as "behave as if Redis does not exist".
 */
function isReady() {
    return client !== null && client.status === 'ready';
}

module.exports = { getClient, isReady };
