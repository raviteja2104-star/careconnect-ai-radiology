const mongoose = require('mongoose');

/**
 * MasterDataSeedService — upserts the ProviderType and Locality reference
 * collections from src/data/{providerTypeSeed,localitySeed}.js on boot.
 * Idempotent (upsert by unique key, safe to run every restart) and additive
 * only — it never deactivates or deletes an existing entry, so an admin
 * adding a locality/type by hand is never clobbered by a redeploy.
 *
 * Must run before NearbySeedService — sample providers resolve their
 * providerTypeId/localityId against these masters at seed time.
 */
function normalize(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

class MasterDataSeedService {
    constructor() {
        this._seeding = null;
    }

    async ensureSeeded() {
        if (mongoose.connection.readyState !== 1) return false;
        if (this._seeding) return this._seeding;
        this._seeding = (async () => {
            const ProviderType = require('../models/ProviderType');
            const Locality = require('../models/Locality');
            const providerTypeSeed = require('../data/providerTypeSeed');
            const localitySeed = require('../data/localitySeed');

            let typeUpserts = 0;
            for (const t of providerTypeSeed) {
                // eslint-disable-next-line no-await-in-loop
                const result = await ProviderType.updateOne(
                    { code: t.code },
                    { $setOnInsert: t },
                    { upsert: true }
                );
                if (result.upsertedCount) typeUpserts += 1;
            }

            let localityUpserts = 0;
            for (const l of localitySeed) {
                const normalizedName = normalize(l.name);
                // eslint-disable-next-line no-await-in-loop
                const result = await Locality.updateOne(
                    { normalizedName },
                    { $setOnInsert: { ...l, normalizedName } },
                    { upsert: true }
                );
                if (result.upsertedCount) localityUpserts += 1;
            }

            if (typeUpserts || localityUpserts) {
                console.log(`[MasterDataSeed] Seeded ${typeUpserts} provider types, ${localityUpserts} localities.`);
            }
            return true;
        })().catch((err) => {
            console.warn('[MasterDataSeed] Seeding failed:', err.message);
            this._seeding = null; // allow retry
            return false;
        });
        return this._seeding;
    }

    init() {
        if (mongoose.connection.readyState === 1) {
            this.ensureSeeded();
        } else {
            mongoose.connection.once('open', () => this.ensureSeeded());
        }
    }
}

module.exports = new MasterDataSeedService();
