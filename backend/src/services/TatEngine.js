/**
 * TatEngine — turn-around-time tracking for teleradiology.
 *  - recordMilestone: idempotently stamps a tat.<milestone> timestamp.
 *  - computeStats: percentile TAT stats over signed studies (computed in JS —
 *    fine at this scale).
 *  - checkSlaBreaches: unsigned studies that have exceeded their SLA window.
 */
const RadiologyStudy = require('../models/RadiologyStudy');

const MILESTONES = ['orderedAt', 'receivedAt', 'assignedAt', 'openedAt', 'reportStartedAt', 'signedAt', 'deliveredAt'];

// Studies still awaiting a signature (TAT clock running).
const UNSIGNED_STATUSES = ['ORDERED', 'RECEIVED', 'UNREAD', 'IN_PROGRESS', 'DRAFT', 'REVIEW'];

/**
 * Set tat.<milestone> to now if (and only if) it is not already set.
 * Idempotent: a second call for the same milestone is a no-op.
 */
async function recordMilestone(studyId, milestone, at = new Date()) {
    if (!MILESTONES.includes(milestone)) {
        throw new Error(`Unknown TAT milestone '${milestone}'. Expected one of: ${MILESTONES.join(', ')}`);
    }
    // {field: null} matches both missing and explicit-null — only unset fields update.
    const result = await RadiologyStudy.updateOne(
        { _id: studyId, [`tat.${milestone}`]: null },
        { $set: { [`tat.${milestone}`]: at } }
    );
    return result.modifiedCount > 0;
}

function percentile(sortedValues, p) {
    if (!sortedValues.length) return null;
    const idx = Math.min(sortedValues.length - 1, Math.ceil((p / 100) * sortedValues.length) - 1);
    return Math.round(sortedValues[Math.max(0, idx)]);
}

function avg(values) {
    if (!values.length) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * TAT statistics over signed studies in the window.
 * TAT = signedAt - orderedAt, in minutes.
 * @returns {Promise<{count, p50, p90, p95, p99, statAvg, routineAvg, breaches}>}
 */
async function computeStats({ hospitalId, modality, sinceDays = 30 } = {}) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const filter = {
        'tat.signedAt': { $gte: since },
        'tat.orderedAt': { $ne: null },
    };
    if (hospitalId) filter.hospitalId = hospitalId;
    if (modality) filter.modality = modality;

    const studies = await RadiologyStudy.find(filter)
        .select('priority slaMinutes tat.orderedAt tat.signedAt')
        .lean();

    const tats = [];
    const statTats = [];
    const routineTats = [];
    let breaches = 0;

    for (const s of studies) {
        const tatMinutes = (new Date(s.tat.signedAt) - new Date(s.tat.orderedAt)) / 60000;
        if (!isFinite(tatMinutes) || tatMinutes < 0) continue;
        tats.push(tatMinutes);
        if (s.priority === 'stat' || s.priority === 'emergency') statTats.push(tatMinutes);
        if (s.priority === 'routine') routineTats.push(tatMinutes);
        if (s.slaMinutes != null && tatMinutes > s.slaMinutes) breaches += 1;
    }

    tats.sort((a, b) => a - b);

    return {
        count: tats.length,
        p50: percentile(tats, 50),
        p90: percentile(tats, 90),
        p95: percentile(tats, 95),
        p99: percentile(tats, 99),
        statAvg: avg(statTats),
        routineAvg: avg(routineTats),
        breaches,
    };
}

/**
 * Unsigned studies whose age already exceeds their SLA window.
 * Used by the worklist to flag breaching items.
 * @returns {Promise<Array>} lean studies with an added overdueMinutes field.
 */
async function checkSlaBreaches({ hospitalId } = {}) {
    const filter = { status: { $in: UNSIGNED_STATUSES }, 'tat.orderedAt': { $ne: null } };
    if (hospitalId) filter.hospitalId = hospitalId;

    const now = Date.now();
    const open = await RadiologyStudy.find(filter)
        .select('accessionNumber patientId modality bodyPart priority status slaMinutes assignedRadiologistId tat.orderedAt')
        .lean();

    return open
        .map((s) => {
            const ageMinutes = (now - new Date(s.tat.orderedAt).getTime()) / 60000;
            return { ...s, overdueMinutes: Math.round(ageMinutes - (s.slaMinutes || 0)) };
        })
        .filter((s) => s.slaMinutes != null && s.overdueMinutes > 0);
}

module.exports = {
    MILESTONES,
    UNSIGNED_STATUSES,
    recordMilestone,
    computeStats,
    checkSlaBreaches,
};
