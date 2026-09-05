/**
 * GeoSearch — provider discovery: distance ranking + open-now/attribute
 * filtering for "CareConnect Nearby".
 *
 * haversineKm() is a pure function (no I/O, no mongoose) so it can be unit
 * tested with known-distance fixtures.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
    return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance in km between two [lng, lat] points. Pure/testable.
 */
function haversineKm([lng1, lat1], [lng2, lat2]) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

/**
 * Is `provider` open right now, per its workingHours entries?
 *
 * NOTE (TZ simplification): this compares against the server's local wall
 * clock (`new Date()`), not the provider's actual timezone. Fine for an MVP
 * that only serves Visakhapatnam (IST) as long as the server also runs in
 * IST or UTC-with-an-IST-offset-aware deploy; a multi-timezone rollout would
 * need to store/compare in the provider's timezone explicitly.
 */
function isOpenNow(workingHours, now = new Date()) {
    if (!Array.isArray(workingHours) || workingHours.length === 0) return false;
    const day = now.getDay(); // 0=Sunday, matches ProviderSchedule.dayOfWeek
    const todays = workingHours.filter((w) => w.day === day);
    if (todays.length === 0) return false;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return todays.some((w) => {
        if (w.is24h) return true;
        if (!w.open || !w.close) return false;
        const [oh, om] = w.open.split(':').map(Number);
        const [ch, cm] = w.close.split(':').map(Number);
        const openMinutes = oh * 60 + om;
        const closeMinutes = ch * 60 + cm;
        if (closeMinutes <= openMinutes) {
            // Overnight window (e.g. 20:00-06:00).
            return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
        }
        return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
    });
}

/** Build the plain (non-geo) Mongo filter shared by both search strategies. */
function buildBaseQuery(filters) {
    const {
        type,
        specialty,
        q,
        verifiedOnly,
        homeCollection,
        teleconsultation,
        emergency,
        maxFee,
    } = filters;

    const query = { active: { $ne: false } };
    if (type) query.type = type;
    if (specialty) query.specialties = specialty;
    if (verifiedOnly) query.verificationStatus = 'VERIFIED';
    if (homeCollection) query.homeCollection = true;
    if (teleconsultation) query.teleconsultation = true;
    if (emergency) query.emergencyAvailable = true;
    if (maxFee != null && Number.isFinite(Number(maxFee))) {
        query['consultationFeeRange.min'] = { $lte: Number(maxFee) };
    }
    if (q && String(q).trim()) {
        const needle = String(q).trim();
        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(escaped, 'i');
        query.$or = [{ name: rx }, { servicesOffered: rx }, { specialties: rx }, { locality: rx }];
    }
    return query;
}

class GeoSearch {
    /**
     * searchProviders — ranked provider search.
     *
     * @param {object} params
     * @param {number} [params.lat] @param {number} [params.lng]
     * @param {number} [params.radiusKm=15]
     * @param {string} [params.type] @param {string} [params.specialty] @param {string} [params.q]
     * @param {boolean} [params.openNow] — filter to providers open right now
     * @param {boolean} [params.availableToday] — filter to providers with >=1 free slot today
     * @param {boolean} [params.verifiedOnly] @param {boolean} [params.homeCollection]
     * @param {boolean} [params.teleconsultation] @param {boolean} [params.emergency]
     * @param {number} [params.maxFee]
     * @param {number} [params.page=1] @param {number} [params.limit=20]
     * @returns {Promise<{results: Array, total: number}>}
     */
    async searchProviders(params = {}) {
        const Provider = require('../models/Provider');
        const {
            lat,
            lng,
            radiusKm = 15,
            openNow,
            availableToday,
            page = 1,
            limit = 20,
        } = params;

        const query = buildBaseQuery(params);
        const hasGeo = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

        let docs;
        if (hasGeo) {
            docs = await this._geoQuery(Provider, query, Number(lng), Number(lat), radiusKm);
        } else {
            docs = await Provider.find(query).lean();
            docs = docs.map((d) => ({ ...d, distanceKm: null }));
        }

        let results = docs.map((d) => ({ ...d, openNow: isOpenNow(d.workingHours) }));

        if (openNow) results = results.filter((d) => d.openNow);

        if (availableToday) {
            const AvailabilityEngine = require('./AvailabilityEngine');
            const checks = await Promise.all(
                results.map((d) => AvailabilityEngine.hasAvailabilityToday(d._id))
            );
            results = results.filter((_, i) => checks[i]);
        }

        // Rank: nearest first when we have distances, else by name.
        results.sort((a, b) => {
            if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
            return String(a.name || '').localeCompare(String(b.name || ''));
        });

        const total = results.length;
        const p = Math.max(1, Number(page) || 1);
        const l = Math.max(1, Math.min(100, Number(limit) || 20));
        const paged = results.slice((p - 1) * l, (p - 1) * l + l);

        return { results: paged, total };
    }

    /**
     * Geo-constrained lookup. Prefers the $geoNear aggregation (uses the
     * 2dsphere index, computes precise spherical distance server-side); falls
     * back to an in-app haversine filter/sort when the geo index/aggregation
     * is unavailable (e.g. mocked models in tests, or a deployment that
     * hasn't built the index yet).
     */
    async _geoQuery(Provider, query, lng, lat, radiusKm) {
        try {
            const docs = await Provider.aggregate([
                {
                    $geoNear: {
                        near: { type: 'Point', coordinates: [lng, lat] },
                        distanceField: 'distanceMeters',
                        maxDistance: radiusKm * 1000,
                        spherical: true,
                        query,
                    },
                },
            ]);
            return docs.map((d) => ({ ...d, distanceKm: d.distanceMeters / 1000 }));
        } catch (err) {
            console.warn('[GeoSearch] $geoNear unavailable, falling back to in-app haversine:', err.message);
            const all = await Provider.find(query).lean();
            return all
                .map((d) => {
                    const coords = d.geo?.coordinates;
                    const distanceKm = Array.isArray(coords) && coords.length === 2
                        ? haversineKm([lng, lat], coords)
                        : null;
                    return { ...d, distanceKm };
                })
                .filter((d) => d.distanceKm != null && d.distanceKm <= radiusKm);
        }
    }
}

const instance = new GeoSearch();
module.exports = instance;
module.exports.haversineKm = haversineKm;
module.exports.isOpenNow = isOpenNow;
module.exports.buildBaseQuery = buildBaseQuery;
