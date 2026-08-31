/**
 * RadiologyRouting — smart routing engine for the teleradiology worklist.
 * Pure scoring logic plus a single DB read of the radiologist pool + workloads.
 *
 * score = subspecialtyMatch * 100 + priorityBoost - workload * 10
 *  - subspecialtyMatch: 1 when the radiologist's subspecialty/specialization
 *    matches the study's inferred subspecialty.
 *  - priorityBoost: stat/emergency studies strongly prefer the least-loaded
 *    radiologist so they get opened immediately.
 */
const User = require('../models/User');
const RadiologyStudy = require('../models/RadiologyStudy');

// Statuses that count as "actively on this radiologist's plate".
const ACTIVE_STATUSES = ['UNREAD', 'IN_PROGRESS', 'DRAFT', 'REVIEW'];

// (modality, bodyPart keyword) → subspecialty
const SUBSPECIALTY_MAP = [
    { subspecialty: 'neuro', keywords: ['brain', 'head', 'spine', 'skull', 'cervical', 'lumbar', 'cranial'] },
    { subspecialty: 'msk', keywords: ['knee', 'shoulder', 'hip', 'bone', 'joint', 'ankle', 'wrist', 'elbow', 'femur', 'extremity'] },
    { subspecialty: 'chest', keywords: ['chest', 'lung', 'thorax', 'thoracic'] },
    { subspecialty: 'breast', keywords: ['mammo', 'breast'] },
    { subspecialty: 'abdominal', keywords: ['abdomen', 'abdominal', 'pelvis', 'pelvic', 'liver', 'kidney'] },
];

// How a resolved subspecialty maps onto free-text User.subspecialty/specialization values.
const SUBSPECIALTY_SYNONYMS = {
    neuro: ['neuro'],
    msk: ['msk', 'musculoskeletal', 'ortho'],
    chest: ['chest', 'thoracic', 'cardiothoracic', 'lung'],
    breast: ['breast', 'mammo'],
    abdominal: ['abdominal', 'abdomen', 'body'],
    general: [],
};

/**
 * Infer the required subspecialty from modality + bodyPart (+ indication as fallback text).
 */
function resolveSubspecialty(modality, bodyPart = '', clinicalIndication = '') {
    if (modality === 'MG') return 'breast';
    const text = `${bodyPart} ${clinicalIndication}`.toLowerCase();
    for (const entry of SUBSPECIALTY_MAP) {
        if (entry.keywords.some((kw) => text.includes(kw))) return entry.subspecialty;
    }
    return 'general';
}

/**
 * Does this radiologist's profile match the required subspecialty?
 * Reads subspecialty and specialization defensively (either may be absent).
 */
function matchesSubspecialty(radiologist, subspecialty) {
    if (subspecialty === 'general') return false; // no boost — workload decides
    const profile = `${radiologist.subspecialty || ''} ${radiologist.specialization || ''}`.toLowerCase();
    if (!profile.trim()) return false;
    return (SUBSPECIALTY_SYNONYMS[subspecialty] || []).some((term) => profile.includes(term));
}

/**
 * Pick the best radiologist for a study.
 * @param {Object} study - RadiologyStudy (doc or plain object) with modality, bodyPart, priority.
 * @returns {Promise<{radiologist: Object, reason: String} | null>} null when no radiologist exists
 *          (the study then stays UNREAD/unassigned for manual pickup).
 */
async function route(study) {
    const radiologists = await User.find({ role: 'radiologist', isActive: { $ne: false } })
        .select('firstName lastName name subspecialty specialization')
        .lean();

    if (!radiologists.length) return null;

    // One aggregate for the current workload of every candidate.
    const workloadRows = await RadiologyStudy.aggregate([
        {
            $match: {
                assignedRadiologistId: { $in: radiologists.map((r) => r._id) },
                status: { $in: ACTIVE_STATUSES },
            },
        },
        { $group: { _id: '$assignedRadiologistId', count: { $sum: 1 } } },
    ]);
    const workloadById = {};
    for (const row of workloadRows) workloadById[String(row._id)] = row.count;

    const subspecialty = resolveSubspecialty(study.modality, study.bodyPart, study.clinicalIndication);
    const isHot = study.priority === 'stat' || study.priority === 'emergency';

    let best = null;
    for (const radiologist of radiologists) {
        const workload = workloadById[String(radiologist._id)] || 0;
        const subMatch = matchesSubspecialty(radiologist, subspecialty) ? 1 : 0;
        // stat/emergency prefer the lowest workload: big boost that decays with load.
        const priorityBoost = isHot ? Math.max(0, 50 - workload * 15) : 0;
        const score = subMatch * 100 + priorityBoost - workload * 10;
        if (!best || score > best.score) {
            best = { radiologist, score, workload, subMatch };
        }
    }

    if (!best) return null;

    const name =
        best.radiologist.name ||
        [best.radiologist.firstName, best.radiologist.lastName].filter(Boolean).join(' ') ||
        String(best.radiologist._id);
    const reasonParts = [];
    reasonParts.push(best.subMatch ? `subspecialty match (${subspecialty})` : `no subspecialty match (needed ${subspecialty})`);
    reasonParts.push(`workload ${best.workload}`);
    if (isHot) reasonParts.push(`${study.priority} priority — least-loaded preferred`);

    return {
        radiologist: best.radiologist,
        reason: `Routed to ${name}: ${reasonParts.join(', ')} (score ${best.score})`,
    };
}

module.exports = {
    SUBSPECIALTY_MAP,
    ACTIVE_STATUSES,
    resolveSubspecialty,
    matchesSubspecialty,
    route,
};
