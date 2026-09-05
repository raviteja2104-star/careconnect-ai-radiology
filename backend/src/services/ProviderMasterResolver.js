/**
 * ProviderMasterResolver — resolves a provider-type / locality reference
 * (either an ObjectId or a legacy free-text string) against the ProviderType
 * / Locality master collections, and rejects anything not in the master.
 * This is where "use IDs/references instead of free-text values" is actually
 * enforced — callers (nearbyController, NearbySeedService) always end up
 * with both the master doc's _id and its canonical label/name, kept in sync
 * on Provider.providerTypeId/type and Provider.localityId/locality.
 */

function normalize(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class UnresolvedMasterReferenceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnresolvedMasterReferenceError';
        this.code = 'UNRESOLVED_MASTER_REFERENCE';
    }
}

/**
 * @param {{providerTypeId?: string, type?: string}} input
 * @returns {Promise<{_id, code, label}|null>} null if neither input given
 */
async function resolveProviderType({ providerTypeId, type } = {}) {
    const ProviderType = require('../models/ProviderType');
    if (providerTypeId) {
        const doc = await ProviderType.findById(providerTypeId).lean();
        if (!doc) throw new UnresolvedMasterReferenceError(`Unknown providerTypeId: ${providerTypeId}`);
        return doc;
    }
    if (type) {
        const code = normalize(type);
        let doc = await ProviderType.findOne({ code }).lean();
        if (!doc) doc = await ProviderType.findOne({ label: new RegExp(`^${escapeRegex(type)}$`, 'i') }).lean();
        if (!doc) {
            throw new UnresolvedMasterReferenceError(
                `Unknown provider type "${type}". It must exist in the ProviderType master first.`
            );
        }
        return doc;
    }
    return null;
}

/**
 * @param {{localityId?: string, locality?: string}} input
 * @returns {Promise<{_id, name}|null>} null if neither input given
 */
async function resolveLocality({ localityId, locality } = {}) {
    const Locality = require('../models/Locality');
    if (localityId) {
        const doc = await Locality.findById(localityId).lean();
        if (!doc) throw new UnresolvedMasterReferenceError(`Unknown localityId: ${localityId}`);
        return doc;
    }
    if (locality) {
        const normalizedName = normalize(locality);
        let doc = await Locality.findOne({ normalizedName }).lean();
        if (!doc) doc = await Locality.findOne({ aliases: new RegExp(`^${escapeRegex(locality)}$`, 'i') }).lean();
        if (!doc) {
            throw new UnresolvedMasterReferenceError(
                `Unknown locality "${locality}". It must exist in the Locality master first.`
            );
        }
        return doc;
    }
    return null;
}

/**
 * Resolves whichever of type/providerTypeId and locality/localityId are
 * present in `body`, returning the fields to merge into a Provider
 * create/update payload (both the *Id ref and the denormalized label,
 * kept consistent). Fields not present in `body` are omitted untouched.
 */
async function resolveProviderFields(body) {
    const out = {};
    if (body.providerTypeId || body.type) {
        const t = await resolveProviderType({ providerTypeId: body.providerTypeId, type: body.type });
        if (t) {
            out.providerTypeId = t._id;
            out.type = t.code;
        }
    }
    if (body.localityId || body.locality) {
        const l = await resolveLocality({ localityId: body.localityId, locality: body.locality });
        if (l) {
            out.localityId = l._id;
            out.locality = l.name;
        }
    }
    return out;
}

module.exports = {
    UnresolvedMasterReferenceError,
    resolveProviderType,
    resolveLocality,
    resolveProviderFields,
};
