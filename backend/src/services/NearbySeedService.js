const mongoose = require('mongoose');

/**
 * NearbySeedService — loads src/data/vizagProviderSeed.js (8 clearly-marked
 * sample providers, source: 'seed_sample') into MongoDB once, on first
 * connection. Mirrors the ClinicalCatalogService/BillableMasterService boot
 * pattern: single-flight, idempotent via a countDocuments guard, never
 * throws into the app boot path.
 */

function loadSeed() {
    try {
        // eslint-disable-next-line global-require
        return require('../data/vizagProviderSeed');
    } catch (err) {
        console.warn('[NearbySeed] Seed dataset missing or invalid:', err.message);
        return { providers: [] };
    }
}

const DEFAULT_SCHEDULE = {
    days: [1, 2, 3, 4, 5, 6],
    startTime: '09:00',
    endTime: '17:00',
    slotMinutes: 20,
    breaks: [{ start: '13:00', end: '14:00' }],
    maxPerSlot: 1,
};

class NearbySeedService {
    constructor() {
        this._seeding = null;
    }

    /** Insert one provider + its doctors/services/schedules. */
    async _seedOneProvider(providerData) {
        const Provider = require('../models/Provider');
        const ProviderDoctor = require('../models/ProviderDoctor');
        const ProviderService = require('../models/ProviderService');
        const ProviderSchedule = require('../models/ProviderSchedule');
        const ProviderMasterResolver = require('./ProviderMasterResolver');

        const { doctors = [], services = [], scheduleDoctorIndexes = [], scheduleOverrides = {}, ...providerFields } = providerData;

        // Resolves the seed's plain `type`/`locality` strings against the
        // ProviderType/Locality masters (seeded by MasterDataSeedService,
        // which must run before this service — see server.js init order).
        const masterFields = await ProviderMasterResolver.resolveProviderFields(providerFields);

        const provider = await Provider.create({
            ...providerFields,
            ...masterFields,
            appointmentEnabled: providerFields.appointmentEnabled !== false,
            careconnectVerified: false,
            verificationStatus: 'UNVERIFIED',
            discovery: { source: 'seed_sample' },
        });

        const doctorDocs = [];
        for (const d of doctors) {
            // eslint-disable-next-line no-await-in-loop
            const doc = await ProviderDoctor.create({
                ...d,
                providerId: provider._id,
                verified: false,
            });
            doctorDocs.push(doc);
        }

        for (const s of services) {
            const { doctorIndex, ...serviceFields } = s;
            const doctorId = Number.isInteger(doctorIndex) ? doctorDocs[doctorIndex]?._id : undefined;
            // eslint-disable-next-line no-await-in-loop
            await ProviderService.create({
                ...serviceFields,
                providerId: provider._id,
                doctorId: doctorId || null,
            });
        }

        const sched = { ...DEFAULT_SCHEDULE, ...scheduleOverrides };
        for (const idx of scheduleDoctorIndexes) {
            const doctorId = idx === null || idx === undefined ? null : doctorDocs[idx]?._id || null;
            for (const day of sched.days) {
                // eslint-disable-next-line no-await-in-loop
                await ProviderSchedule.create({
                    providerId: provider._id,
                    doctorId,
                    dayOfWeek: day,
                    startTime: sched.startTime,
                    endTime: sched.endTime,
                    slotMinutes: sched.slotMinutes,
                    breaks: sched.breaks,
                    maxPerSlot: sched.maxPerSlot,
                    active: true,
                });
            }
        }

        return { provider, doctorCount: doctorDocs.length, serviceCount: services.length };
    }

    /** Seed once, guarded by a countDocuments check; single-flight. */
    async ensureSeeded() {
        if (mongoose.connection.readyState !== 1) return false;
        if (this._seeding) return this._seeding;
        this._seeding = (async () => {
            // Must complete before any provider is resolved/created — sample
            // providers below resolve type/locality strings against these
            // masters. Awaited directly (not relying on server.js init
            // order) since MasterDataSeedService.ensureSeeded() is itself
            // idempotent/single-flight, so this is always safe to call.
            await require('./MasterDataSeedService').ensureSeeded();

            const Provider = require('../models/Provider');
            const existing = await Provider.countDocuments({ 'discovery.source': 'seed_sample' });
            if (existing > 0) return false;

            const { providers } = loadSeed();
            if (!providers || providers.length === 0) return false;

            let seededProviders = 0;
            let seededDoctors = 0;
            let seededServices = 0;
            for (const p of providers) {
                // eslint-disable-next-line no-await-in-loop
                const result = await this._seedOneProvider(p);
                seededProviders += 1;
                seededDoctors += result.doctorCount;
                seededServices += result.serviceCount;
            }
            console.log(
                `[NearbySeed] Seeded ${seededProviders} sample providers, ${seededDoctors} doctors, ${seededServices} services (source: seed_sample).`
            );
            return true;
        })().catch((err) => {
            console.warn('[NearbySeed] Seeding failed:', err.message);
            this._seeding = null; // allow retry
            return false;
        });
        return this._seeding;
    }

    /** Boot hook: seed as soon as a DB connection opens. */
    init() {
        if (mongoose.connection.readyState === 1) {
            this.ensureSeeded();
        } else {
            mongoose.connection.once('open', () => this.ensureSeeded());
        }
    }
}

module.exports = new NearbySeedService();
