/**
 * Expand user role enum: + 'reception', + 'emergency' (EXPAND phase marker).
 *
 * Why this migration changes no user documents:
 * MongoDB is schemaless — the role enum lives ONLY in the application layer
 * (src/models/User.js: mongoose `enum` validator on `role`). Adding new
 * allowed values is therefore a pure app-code change: existing documents are
 * untouched and remain valid, and nothing in the database needs rewriting.
 * This is the textbook expand step of expand/migrate/contract — additive,
 * backward-compatible, safe to deploy alongside old app versions (old code
 * simply never issues the new roles).
 *
 * What this migration DOES do:
 *  1. Verifies no existing user document carries a role outside the expanded
 *     enum (a safety net against drift before the expand is recorded).
 *  2. Writes a `migrationNotes` entry into `migration_meta` documenting the
 *     expand, so the changelog of schema *intent* survives in the database
 *     itself and the eventual contract migration can reference it.
 *
 * Down removes the note (and nothing else — there is no data change to undo).
 */

const NOTE_KEY = '20260825000002-expand-user-roles';

const EXPANDED_ROLES = [
    'patient',
    'doctor',
    'radiologist',
    'admin',
    'lab_tech',
    'pharmacist',
    'reception', // added by this expand
    'emergency', // added by this expand
];

module.exports = {
    async up(db) {
        // 1. Safety check: no user doc may carry a role outside the expanded enum.
        const invalid = await db
            .collection('users')
            .find({ role: { $exists: true, $nin: EXPANDED_ROLES } })
            .project({ _id: 1, role: 1 })
            .limit(10)
            .toArray();

        if (invalid.length > 0) {
            throw new Error(
                `expand-user-roles: found user documents with roles outside the expanded enum: ` +
                    invalid.map((u) => `${u._id}=${u.role}`).join(', ') +
                    ' — resolve these before applying the expand.'
            );
        }

        // 2. Record the expand-phase marker.
        await db.collection('migration_meta').updateOne(
            { key: NOTE_KEY },
            {
                $set: {
                    key: NOTE_KEY,
                    kind: 'migrationNotes',
                    phase: 'expand',
                    appliedAt: new Date(),
                    note:
                        "Role enum expanded with 'reception' and 'emergency'. " +
                        'Enum is enforced app-layer (mongoose) only; no document rewrite required. ' +
                        'Contract phase (if these roles are ever removed) must migrate affected ' +
                        'user docs in a separate, later deployment.',
                    rolesAdded: ['reception', 'emergency'],
                    rolesFull: EXPANDED_ROLES,
                },
            },
            { upsert: true }
        );
    },

    async down(db) {
        await db.collection('migration_meta').deleteOne({ key: NOTE_KEY });
    },
};
