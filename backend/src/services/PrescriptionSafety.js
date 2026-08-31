/**
 * PrescriptionSafety — advisory drug-safety screening for the EMR.
 * Produces flags for the clinician to review; NEVER blocks or modifies an
 * order on its own. The clinician approves or overrides with a reason.
 */

// Minimal curated interaction pairs (generic, lowercase). Extend via master data.
const INTERACTIONS = [
    { pair: ['warfarin', 'aspirin'], severity: 'critical', message: 'Warfarin + Aspirin: major bleeding risk.' },
    { pair: ['warfarin', 'ibuprofen'], severity: 'critical', message: 'Warfarin + NSAID: major bleeding risk.' },
    { pair: ['metformin', 'contrast'], severity: 'warning', message: 'Metformin around iodinated contrast: lactic acidosis risk — hold per protocol.' },
    { pair: ['sildenafil', 'nitroglycerin'], severity: 'critical', message: 'PDE5 inhibitor + nitrate: severe hypotension.' },
    { pair: ['clopidogrel', 'omeprazole'], severity: 'warning', message: 'Omeprazole may reduce clopidogrel activation.' },
    { pair: ['lisinopril', 'spironolactone'], severity: 'warning', message: 'ACE inhibitor + K-sparing diuretic: hyperkalemia risk.' },
    { pair: ['tramadol', 'sertraline'], severity: 'warning', message: 'Serotonergic combination: serotonin syndrome risk.' },
];

const RENAL_CAUTION = ['metformin', 'gentamicin', 'vancomycin', 'nsaid', 'ibuprofen', 'tenofovir', 'lithium'];
const PREGNANCY_CAUTION = ['warfarin', 'isotretinoin', 'methotrexate', 'valproate', 'lisinopril', 'atorvastatin'];

function norm(name) {
    return String(name || '').trim().toLowerCase();
}

/**
 * @param {Array} drugs        [{ name, generic, dose, frequency, ... }]
 * @param {Object} context     { currentMedications: [names], allergies: [strings],
 *                               renalImpairment: bool, pregnant: bool }
 * @returns {Array} flags      [{ kind, severity, message }]
 */
function screen(drugs = [], context = {}) {
    const flags = [];
    const newNames = drugs.map((d) => norm(d.generic || d.name)).filter(Boolean);
    const currentNames = (context.currentMedications || []).map(norm);
    const allNames = [...newNames, ...currentNames];
    const allergies = (context.allergies || []).map(norm);

    // Duplicate therapy (same generic twice across new + current)
    const seen = new Set();
    for (const n of allNames) {
        if (seen.has(n) && newNames.includes(n)) {
            flags.push({ kind: 'duplicate', severity: 'warning', message: `Duplicate therapy detected: ${n}.` });
        }
        seen.add(n);
    }

    // Pairwise interactions
    for (const { pair, severity, message } of INTERACTIONS) {
        const [a, b] = pair;
        const hasA = allNames.some((n) => n.includes(a));
        const hasB = allNames.some((n) => n.includes(b));
        const involvesNew = newNames.some((n) => n.includes(a) || n.includes(b));
        if (hasA && hasB && involvesNew) {
            flags.push({ kind: 'interaction', severity, message });
        }
    }

    // Allergy match
    for (const n of newNames) {
        for (const allergy of allergies) {
            if (allergy && (n.includes(allergy) || allergy.includes(n))) {
                flags.push({ kind: 'allergy', severity: 'critical', message: `Patient has a recorded allergy matching “${n}”.` });
            }
        }
    }

    // Contextual cautions
    if (context.renalImpairment) {
        for (const n of newNames) {
            if (RENAL_CAUTION.some((r) => n.includes(r))) {
                flags.push({ kind: 'renal', severity: 'warning', message: `Renal dosing review recommended for ${n}.` });
            }
        }
    }
    if (context.pregnant) {
        for (const n of newNames) {
            if (PREGNANCY_CAUTION.some((p) => n.includes(p))) {
                flags.push({ kind: 'pregnancy', severity: 'critical', message: `${n} is cautioned in pregnancy — verify indication.` });
            }
        }
    }

    // Trivial dose anomaly heuristic: numeric dose 0 or absurd multiplier
    for (const d of drugs) {
        const doseNum = parseFloat(String(d.dose || '').replace(/[^\d.]/g, ''));
        if (!Number.isNaN(doseNum) && (doseNum === 0 || doseNum > 5000)) {
            flags.push({ kind: 'dose_anomaly', severity: 'warning', message: `Dose “${d.dose}” for ${d.name} looks anomalous — please verify.` });
        }
    }

    return flags;
}

module.exports = { screen };
