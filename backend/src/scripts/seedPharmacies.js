/**
 * seedPharmacies.js — Upsert the placeholder pharmacy seed into MongoDB.
 *
 * Run: node backend/src/scripts/seedPharmacies.js
 *
 * Idempotent: uses upsert keyed on (name + locality) so running it twice
 * does not create duplicate records.  Existing records with the same key
 * are updated (not replaced) so any manual edits to other fields survive.
 *
 * To REPLACE everything (wipe first):
 *   node backend/src/scripts/seedPharmacies.js --wipe
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Provider = require('../models/Provider');
const { pharmacies } = require('../data/vizagPharmacySeed');

async function run() {
    const wipe = process.argv.includes('--wipe');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    if (wipe) {
        const del = await Provider.deleteMany({ type: 'pharmacy', 'discovery.source': 'seed_sample' });
        console.log(`Wiped ${del.deletedCount} existing seed pharmacy records.`);
    }

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const p of pharmacies) {
        try {
            const filter = { name: p.name, locality: p.locality, 'discovery.source': 'seed_sample' };
            const result = await Provider.findOneAndUpdate(
                filter,
                { $set: p },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            // Mongoose sets upserted when the doc is new.
            if (result && result.createdAt && Math.abs(Date.now() - result.createdAt.getTime()) < 5000) {
                inserted++;
            } else {
                updated++;
            }
        } catch (err) {
            console.error(`  ERROR seeding "${p.name}" (${p.locality}):`, err.message);
            errors++;
        }
    }

    console.log(`\nDone. Inserted: ${inserted}  Updated: ${updated}  Errors: ${errors}`);
    console.log(`Total pharmacy seed records: ${pharmacies.length}`);
    console.log('\nAll records are UNVERIFIED (source: seed_sample) — placeholder data only.');
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
