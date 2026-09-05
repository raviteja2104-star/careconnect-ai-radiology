/**
 * ProviderImportValidator — pure validation of one normalized import row.
 * No I/O (type/locality master resolution happens separately in
 * ProviderImportService so this stays unit-testable on its own).
 *
 * BLOCKING errors mean the row cannot be imported as-is (status: INVALID).
 * WARNINGS never block import — they flag fields the honesty rules require
 * before a provider can be shown as bookable (phone, coordinates, hours),
 * but a directory-only listing without them is legitimate, so they're
 * surfaced for the reviewer, not enforced here.
 */

const PINCODE_RE = /^\d{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_RE = /\d{7,}/; // at least 7 digits somewhere in the string

function truthy(v) {
    return v !== undefined && v !== null && String(v).trim() !== '';
}

function toBool(v) {
    if (typeof v === 'boolean') return v;
    const s = String(v || '').trim().toLowerCase();
    return s === 'yes' || s === 'true' || s === '1';
}

function toNumber(v) {
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

/**
 * @param {object} row normalized row (see ExcelImportParser.normalizeRow)
 * @returns {{errors: string[], warnings: string[]}}
 */
function validate(row) {
    const errors = [];
    const warnings = [];

    if (!truthy(row.name)) errors.push('Provider name is required.');
    if (!truthy(row.type)) errors.push('Provider type is required.');
    if (!truthy(row.locality)) errors.push('Locality is required.');

    if (truthy(row.pincode) && !PINCODE_RE.test(String(row.pincode).trim())) {
        warnings.push(`Pincode "${row.pincode}" is not a valid 6-digit Indian PIN code.`);
    }
    if (truthy(row.email) && !EMAIL_RE.test(String(row.email).trim())) {
        warnings.push(`Email "${row.email}" does not look like a valid address.`);
    }
    if (truthy(row.phone) && !PHONE_DIGITS_RE.test(String(row.phone))) {
        warnings.push(`Phone "${row.phone}" does not look like a valid number.`);
    }
    if (!truthy(row.phone)) warnings.push('No phone number — this listing cannot be contacted or claimed by phone verification.');

    const lat = toNumber(row.lat);
    const lng = toNumber(row.lng);
    if (truthy(row.lat) && (lat === undefined || lat < -90 || lat > 90)) {
        errors.push(`Latitude "${row.lat}" is out of range.`);
    }
    if (truthy(row.lng) && (lng === undefined || lng < -180 || lng > 180)) {
        errors.push(`Longitude "${row.lng}" is out of range.`);
    }
    if (!truthy(row.lat) || !truthy(row.lng)) {
        warnings.push('No coordinates — this provider will not appear in "near me" distance-ranked search until geocoded.');
    }

    const fee = toNumber(row.consultationFee);
    if (truthy(row.consultationFee) && fee === undefined) {
        warnings.push(`Consultation fee "${row.consultationFee}" is not a number — ignored.`);
    }

    // Per the honesty rule: a source-file "verification" claim is never
    // trusted. Surface it as informational only, never as a pass/fail check.
    if (truthy(row.sourceVerification) && String(row.sourceVerification).trim().toUpperCase() !== 'UNVERIFIED') {
        warnings.push(
            `Source file claims verification status "${row.sourceVerification}" — CareConnect ignores this and imports every row as UNVERIFIED regardless.`
        );
    }

    return { errors, warnings };
}

module.exports = { validate, toBool, toNumber, truthy, PINCODE_RE, EMAIL_RE };
