/**
 * ExcelImportParser — parses an uploaded .xlsx/.csv buffer into raw row
 * objects (keyed by the file's own header row) plus a header-alias mapping
 * onto CareConnect's canonical provider fields. Pure I/O-in, data-out: no
 * Mongo access, so it's independently testable.
 *
 * The canonical header set matches the master workbook's All_Providers_Master
 * / Provider_Master_Template sheets (see docs/nearby-data-master-plan.md §6),
 * since that's the schema this pipeline was built against — but common
 * shorter variants (e.g. "Name", "Locality", "Type") resolve too.
 */
const ExcelJS = require('exceljs');

const HEADER_ALIASES = {
    name: ['provider name', 'name', 'branch name'],
    type: ['provider type', 'type'],
    locality: ['area / locality', 'area/locality', 'locality', 'area'],
    address: ['address'],
    pincode: ['pincode', 'pin code', 'zip'],
    city: ['city'],
    district: ['district'],
    state: ['state'],
    lat: ['latitude', 'lat'],
    lng: ['longitude', 'lng', 'long'],
    phone: ['phone', 'phone number', 'contact number'],
    email: ['email'],
    website: ['website'],
    specialties: ['specialties', 'specialty'],
    servicesOffered: ['services', 'services offered'],
    openingHoursRaw: ['opening hours', 'hours'],
    emergencyAvailable: ['emergency available', 'emergency'],
    homeCollection: ['home collection'],
    teleconsultation: ['teleconsultation'],
    consultationFee: ['consultation fee', 'fee'],
    publicRating: ['public rating', 'rating'],
    publicReviewCount: ['public review count', 'review count'],
    sourceLabel: ['source'],
    sourceUrl: ['source url'],
    sourceVerification: ['careconnect verification', 'verification status'],
    notes: ['notes'],
};

function normalizeHeader(h) {
    return String(h || '').trim().toLowerCase();
}

/** Builds { canonicalKey -> sourceHeaderText } for the headers actually present in this file. */
function buildHeaderMap(headers) {
    const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
    const map = {};
    for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
        const found = normalizedHeaders.find((h) => aliases.includes(h.norm));
        if (found) map[canonical] = found.raw;
    }
    return map;
}

async function parseXlsxBuffer(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('The workbook has no sheets.');

    const headerRow = sheet.getRow(1);
    const headers = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber - 1] = cell.value != null ? String(cell.value).trim() : '';
    });

    const rawRows = [];
    for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        if (row.cellCount === 0) continue;
        const obj = {};
        let hasValue = false;
        headers.forEach((h, idx) => {
            if (!h) return;
            const cell = row.getCell(idx + 1);
            const value = cell.value && typeof cell.value === 'object' && 'text' in cell.value ? cell.value.text : cell.value;
            obj[h] = value != null && value !== '' ? value : undefined;
            if (obj[h] !== undefined) hasValue = true;
        });
        if (hasValue) rawRows.push(obj);
    }

    return { sheetName: sheet.name, headers, rawRows };
}

async function parseCsvBuffer(buffer) {
    const workbook = new ExcelJS.Workbook();
    const stream = require('stream');
    const readable = new stream.PassThrough();
    readable.end(buffer);
    await workbook.csv.read(readable);
    const sheet = workbook.worksheets[0];
    // ExcelJS's CSV reader shares the same worksheet model, so reuse the xlsx path.
    const headerRow = sheet.getRow(1);
    const headers = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber - 1] = cell.value != null ? String(cell.value).trim() : '';
    });
    const rawRows = [];
    for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        if (row.cellCount === 0) continue;
        const obj = {};
        let hasValue = false;
        headers.forEach((h, idx) => {
            if (!h) return;
            const value = row.getCell(idx + 1).value;
            obj[h] = value != null && value !== '' ? value : undefined;
            if (obj[h] !== undefined) hasValue = true;
        });
        if (hasValue) rawRows.push(obj);
    }
    return { sheetName: 'CSV', headers, rawRows };
}

/**
 * @param {Buffer} buffer
 * @param {string} fileName — used only to pick the parser by extension
 * @returns {Promise<{sheetName: string, headers: string[], headerMap: object, rawRows: object[]}>}
 */
async function parse(buffer, fileName) {
    const isCsv = /\.csv$/i.test(fileName || '');
    const { sheetName, headers, rawRows } = isCsv ? await parseCsvBuffer(buffer) : await parseXlsxBuffer(buffer);
    const headerMap = buildHeaderMap(headers);
    if (!headerMap.name) {
        throw new Error(
            `Could not find a provider-name column. Recognized headers: ${Object.values(HEADER_ALIASES).flat().join(', ')}`
        );
    }
    return { sheetName, headers, headerMap, rawRows };
}

/** Maps one raw row (keyed by source headers) onto canonical field names using the resolved headerMap. */
function normalizeRow(rawRow, headerMap) {
    const out = {};
    for (const [canonical, sourceHeader] of Object.entries(headerMap)) {
        const value = rawRow[sourceHeader];
        if (value === undefined) continue;
        out[canonical] = value;
    }
    return out;
}

module.exports = { parse, normalizeRow, buildHeaderMap, HEADER_ALIASES };
