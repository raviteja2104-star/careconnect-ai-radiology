/**
 * LabValidation — PURE result validation helpers for the LIS.
 * No mongoose/model/IO dependencies so it is trivially unit-testable.
 *
 * Flagging semantics (numeric):
 *   All bounds are INCLUSIVE toward the milder category:
 *     value <  criticalLow            → 'critical'
 *     value >  criticalHigh           → 'critical'
 *     value <  low                    → 'low'
 *     value >  high                   → 'high'
 *     otherwise                       → 'normal'
 *   i.e. value === low or value === high is 'normal', and
 *   value === criticalLow / criticalHigh is 'low' / 'high' (not critical).
 *
 * Qualitative types ('posneg', 'reactive', 'detected'):
 *   Case-folded comparison against range.textExpected:
 *     value matches textExpected               → 'normal'
 *     value in [positive, reactive, detected]  → 'positive'
 *     anything else                            → 'abnormal'
 */

'use strict';

const QUALITATIVE_TYPES = ['posneg', 'reactive', 'detected'];
const POSITIVE_WORDS = ['positive', 'reactive', 'detected'];

const fold = (v) => String(v == null ? '' : v).trim().toLowerCase();

/**
 * Compute the flag for one parameter value.
 * @param {Object} args
 * @param {*}      args.value      raw entered value (number or string)
 * @param {String} args.resultType 'numeric' | 'posneg' | 'reactive' | 'detected' | other
 * @param {Object} [args.range]    resolved LabReferenceRange-shaped object
 * @returns {{flag: String|null}|{error: String}}
 */
function computeFlag({ value, resultType, range } = {}) {
    if (value === null || value === undefined || value === '') return { flag: null };
    const type = fold(resultType);

    if (type === 'numeric') {
        const num = typeof value === 'number' ? value : Number(String(value).trim());
        if (!Number.isFinite(num)) {
            return { error: `Non-numeric value '${value}' for numeric result type` };
        }
        if (!range) return { flag: null };
        if (range.criticalLow != null && num < range.criticalLow) return { flag: 'critical' };
        if (range.criticalHigh != null && num > range.criticalHigh) return { flag: 'critical' };
        if (range.low != null && num < range.low) return { flag: 'low' };
        if (range.high != null && num > range.high) return { flag: 'high' };
        return { flag: 'normal' };
    }

    if (QUALITATIVE_TYPES.includes(type)) {
        const v = fold(value);
        const expected = range && range.textExpected != null && range.textExpected !== ''
            ? fold(range.textExpected)
            : null;
        if (expected && v === expected) return { flag: 'normal' };
        if (POSITIVE_WORDS.includes(v)) return { flag: 'positive' };
        return { flag: 'abnormal' };
    }

    // Other result types (text, titer, descriptive, …) are not auto-flagged.
    return { flag: null };
}

/**
 * Pick the most specific ACTIVE range for the patient context.
 * Specificity: sex+ageBand (3) > sex (2) > ageBand (1) > any (0).
 * A range whose sex or age band does not match the context is excluded
 * entirely (age bounds inclusive). A range with a specimen that contradicts
 * the given specimen is excluded; missing specimen on either side matches.
 * Ties keep the first-seen range.
 *
 * @param {Array}  ranges  candidate range rows
 * @param {Object} ctx     { age?: Number, sex?: String, specimen?: String }
 * @returns {Object|null}
 */
function resolveRange(ranges, ctx = {}) {
    const { age, sex, specimen } = ctx;
    const list = Array.isArray(ranges) ? ranges : [];
    let best = null;
    let bestScore = -1;

    for (const r of list) {
        if (!r || r.active === false) continue;

        let score = 0;

        const sexApp = fold(r.sexApplicability || 'any') || 'any';
        if (sexApp !== 'any') {
            if (!sex || sexApp !== fold(sex)) continue;
            score += 2;
        }

        const hasAgeBand = r.ageMinYears != null || r.ageMaxYears != null;
        if (hasAgeBand) {
            if (age == null || !Number.isFinite(Number(age))) continue;
            const a = Number(age);
            if (r.ageMinYears != null && a < r.ageMinYears) continue;
            if (r.ageMaxYears != null && a > r.ageMaxYears) continue;
            score += 1;
        }

        if (r.specimen && specimen && fold(r.specimen) !== fold(specimen)) continue;

        if (score > bestScore) {
            best = r;
            bestScore = score;
        }
    }

    return best;
}

/**
 * Human-readable snapshot of a range, e.g. '70–100 mg/dL', '≤100 mg/dL',
 * '≥40 mg/dL', or the textExpected value ('Negative').
 */
function formatRange(range) {
    if (!range) return '';
    if (range.textExpected != null && range.textExpected !== '') return String(range.textExpected);
    const unit = range.unit ? ` ${range.unit}` : '';
    const hasLow = range.low != null;
    const hasHigh = range.high != null;
    if (hasLow && hasHigh) return `${range.low}–${range.high}${unit}`;
    if (hasHigh) return `≤${range.high}${unit}`;
    if (hasLow) return `≥${range.low}${unit}`;
    return '';
}

module.exports = { computeFlag, resolveRange, formatRange };
