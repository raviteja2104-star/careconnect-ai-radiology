/**
 * CareConnect — Universal Search API
 * GET /api/search?q=...&type=...&city=...&page=...&limit=...
 *
 * Searches across: doctors/clinics/hospitals/labs (providers), lab tests,
 * and health articles. Returns a unified result set with a `resultType` field
 * on each item so the frontend can render mixed results.
 */
const express = require('express');
const router  = express.Router();

const isDB = () => {
    const m = require('mongoose');
    return m.connection.readyState === 1;
};

// Lazy-load models so this file is safe to require before DB connects.
const getProvider    = () => require('../models/Provider');
const getLabCatalog  = () => require('../models/LabCatalogItem');

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build a case-insensitive regex query across multiple fields. */
function textQuery(q, fields) {
    const re = { $regex: escapeRegex(q), $options: 'i' };
    return { $or: fields.map(f => ({ [f]: re })) };
}

/** Serialize a Provider document to a search result. */
function serializeProvider(p) {
    return {
        resultType: 'provider',
        _id: String(p._id),
        name: p.name,
        type: p.type,         // DOCTOR | CLINIC | HOSPITAL | LAB | PHARMACY
        subtype: p.subtype,
        specialties: p.specialties || [],
        locality: p.locality,
        city: p.city,
        state: p.state,
        address: p.address,
        rating: p.rating,
        reviewCount: p.reviewCount,
        consultationFeeRange: p.consultationFeeRange,
        careconnectVerified: !!p.careconnectVerified,
        openNow: !!p.openNow,
        photo: p.photo,
        profileImage: p.profileImage,
        slug: p.slug || String(p._id),
    };
}

/** Serialize a LabCatalogItem to a search result. */
function serializeTest(t) {
    return {
        resultType: 'test',
        _id: String(t._id),
        name: t.name,
        category: t.category,
        description: t.description,
        price: t.price,
        discountedPrice: t.discountedPrice,
        turnaroundTime: t.turnaroundTime,
        homeCollection: !!t.homeCollection,
        sampleType: t.sampleType,
        preparation: t.preparation,
        providerId: t.providerId ? String(t.providerId) : null,
        providerName: t.providerName,
        slug: t.slug || String(t._id),
    };
}

// ── GET /api/search ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    const {
        q = '',
        type,          // 'doctor' | 'clinic' | 'hospital' | 'lab' | 'pharmacy' | 'test' | 'all'
        city,
        specialty,
        page  = '1',
        limit = '20',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(50, parseInt(limit, 10) || 20);
    const skip     = (pageNum - 1) * limitNum;
    const qTrim    = q.trim();

    // Demo fallback when DB is not connected
    if (!isDB()) {
        return res.json({
            success: true,
            demo: true,
            data: { results: [], total: 0, page: pageNum, limit: limitNum, query: qTrim, type: type || 'all' },
        });
    }

    const Provider      = getProvider();
    const LabCatalog    = getLabCatalog();
    const results       = [];

    try {
        const searchType = (type || 'all').toLowerCase();
        const includeProviders = ['all', 'doctor', 'clinic', 'hospital', 'lab', 'pharmacy'].includes(searchType);
        const includeTests     = ['all', 'test', 'lab'].includes(searchType);

        // ── Providers ──────────────────────────────────────────────────────
        if (includeProviders) {
            // Provider is publicly visible once VERIFIED or CLAIMED (not UNVERIFIED/SUSPENDED/CLOSED)
            const providerFilter = { verificationStatus: { $in: ['VERIFIED', 'CLAIMED'] }, active: true };

            // Type filter
            if (searchType !== 'all') {
                providerFilter.type = searchType.toUpperCase();
            }
            // City filter
            if (city) providerFilter.city = { $regex: escapeRegex(city), $options: 'i' };
            // Specialty filter
            if (specialty) providerFilter.specialties = { $regex: escapeRegex(specialty), $options: 'i' };
            // Text search
            if (qTrim) {
                const textQ = textQuery(qTrim, ['name', 'specialties', 'locality', 'city', 'description', 'servicesOffered', 'subtype']);
                Object.assign(providerFilter, textQ);
            }

            const providerLimit = includeTests ? Math.ceil(limitNum * 0.6) : limitNum;
            const providers = await Provider.find(providerFilter)
                .sort({ careconnectVerified: -1, rating: -1 })
                .skip(skip)
                .limit(providerLimit)
                .lean();

            results.push(...providers.map(serializeProvider));
        }

        // ── Lab tests ─────────────────────────────────────────────────────
        if (includeTests && qTrim) {
            const testFilter = {};
            if (qTrim) {
                const textQ = textQuery(qTrim, ['name', 'category', 'description', 'sampleType', 'aliases']);
                Object.assign(testFilter, textQ);
            }

            const testLimit = includeProviders ? Math.ceil(limitNum * 0.4) : limitNum;
            const tests = await LabCatalog.find(testFilter)
                .sort({ popular: -1, name: 1 })
                .limit(testLimit)
                .lean();

            results.push(...tests.map(serializeTest));
        }

        // If no query and no filters, return top-rated providers
        if (!qTrim && !specialty && !city && results.length === 0 && includeProviders) {
            const topProviders = await Provider.find({ verificationStatus: { $in: ['VERIFIED', 'CLAIMED'] }, active: true })
                .sort({ careconnectVerified: -1, rating: -1 })
                .limit(limitNum)
                .lean();
            results.push(...topProviders.map(serializeProvider));
        }

        return res.json({
            success: true,
            data: {
                results,
                total: results.length,
                page: pageNum,
                limit: limitNum,
                query: qTrim,
                type: searchType,
            },
        });
    } catch (err) {
        console.error('[Search] error:', err.message);
        return res.status(500).json({ success: false, message: 'Search temporarily unavailable.' });
    }
});

// ── GET /api/search/suggestions — typeahead ──────────────────────────────────
router.get('/suggestions', async (req, res) => {
    const { q = '', limit = '8' } = req.query;
    const qTrim = q.trim();
    if (!qTrim || qTrim.length < 2) return res.json({ success: true, data: [] });
    if (!isDB()) return res.json({ success: true, data: [] });

    try {
        const Provider   = getProvider();
        const LabCatalog = getLabCatalog();
        const re = { $regex: escapeRegex(qTrim), $options: 'i' };
        const lim = Math.min(20, parseInt(limit, 10) || 8);

        const [providers, tests] = await Promise.all([
            Provider.find({ name: re, verificationStatus: { $in: ['VERIFIED', 'CLAIMED'] }, active: true })
                .select('name type specialty city')
                .limit(Math.ceil(lim * 0.6))
                .lean(),
            LabCatalog.find({ name: re })
                .select('name category price')
                .limit(Math.ceil(lim * 0.4))
                .lean(),
        ]);

        const suggestions = [
            ...providers.map(p => ({ label: p.name, sublabel: `${p.type} · ${p.city || ''}`, type: 'provider', id: p._id })),
            ...tests.map(t => ({ label: t.name, sublabel: `Test · ₹${t.price || '—'}`, type: 'test', id: t._id })),
        ];

        return res.json({ success: true, data: suggestions.slice(0, lim) });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Suggestions unavailable.' });
    }
});

module.exports = router;
