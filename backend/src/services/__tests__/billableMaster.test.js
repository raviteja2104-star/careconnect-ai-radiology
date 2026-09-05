/**
 * Unit tests for the PURE helpers exported by BillableMasterService
 * (no DB, no network — parseCsv / toCsv / classifyImportRow / buildBulkChange).
 */

const {
    parseCsv,
    toCsv,
    buildBulkChange,
    classifyImportRow,
    nameTypeKey,
} = require('../BillableMasterService');

describe('parseCsv', () => {
    test('parses plain rows and skips blank lines', () => {
        const rows = parseCsv('a,b,c\n1,2,3\n\n4,5,6\n');
        expect(rows).toEqual([
            ['a', 'b', 'c'],
            ['1', '2', '3'],
            ['4', '5', '6'],
        ]);
    });

    test('handles quoted fields containing commas', () => {
        const rows = parseCsv('itemCode,name\nLAB-1,"CBC, with differential"');
        expect(rows).toEqual([
            ['itemCode', 'name'],
            ['LAB-1', 'CBC, with differential'],
        ]);
    });

    test('handles escaped quotes and embedded newlines inside quoted fields', () => {
        const rows = parseCsv('code,note\r\nX1,"He said ""fast"", then left"\r\nX2,"line1\nline2"');
        expect(rows).toEqual([
            ['code', 'note'],
            ['X1', 'He said "fast", then left'],
            ['X2', 'line1\nline2'],
        ]);
    });

    test('empty input yields no rows', () => {
        expect(parseCsv('')).toEqual([]);
        expect(parseCsv(null)).toEqual([]);
    });
});

describe('toCsv / parseCsv round-trip', () => {
    const columns = ['itemCode', 'name', 'unitPrice', 'active'];
    const rows = [
        { itemCode: 'LAB-1', name: 'Glucose — Fasting', unitPrice: 80, active: true },
        { itemCode: 'LAB-2', name: 'CBC, "full" panel', unitPrice: 350, active: false },
        { itemCode: 'CON-1', name: 'Multi\nline name', unitPrice: 5, active: true },
    ];

    test('quotes values with commas, quotes and newlines, and round-trips exactly', () => {
        const csv = toCsv(rows, columns);
        const parsed = parseCsv(csv);
        expect(parsed[0]).toEqual(columns);
        expect(parsed).toHaveLength(rows.length + 1);
        rows.forEach((row, i) => {
            expect(parsed[i + 1]).toEqual(columns.map((c) => String(row[c])));
        });
    });

    test('null/undefined values serialize as empty cells', () => {
        const csv = toCsv([{ itemCode: 'X', name: undefined, unitPrice: null, active: true }], columns);
        expect(parseCsv(csv)[1]).toEqual(['X', '', '', 'true']);
    });
});

describe('classifyImportRow (duplicate-detection decision)', () => {
    const existing = () => ({
        byCode: new Map([['LAB-GLU', { itemCode: 'LAB-GLU', name: 'Glucose', type: 'lab_test' }]]),
        byNameType: new Map([[nameTypeKey('Glucose', 'lab_test'), { itemCode: 'LAB-GLU', name: 'Glucose', type: 'lab_test' }]]),
    });

    test('known itemCode → update (upsert by code)', () => {
        const d = classifyImportRow({ itemCode: 'LAB-GLU', name: 'Glucose (renamed)', type: 'lab_test' }, existing());
        expect(d.action).toBe('update');
    });

    test('same name+type under a different code → skip-duplicate', () => {
        const d = classifyImportRow({ itemCode: 'LAB-GLU-2', name: 'glucose', type: 'lab_test' }, existing());
        expect(d.action).toBe('skip-duplicate');
    });

    test('same name but different type is NOT a duplicate → create', () => {
        const d = classifyImportRow({ itemCode: 'SRV-GLU', name: 'Glucose', type: 'service' }, existing());
        expect(d.action).toBe('create');
    });

    test('new code and new name → create', () => {
        const d = classifyImportRow({ itemCode: 'LAB-NEW', name: 'Something New', type: 'lab_test' }, existing());
        expect(d.action).toBe('create');
    });

    test('missing itemCode / name / bad type → error with message', () => {
        expect(classifyImportRow({ name: 'X', type: 'lab_test' }, existing()).action).toBe('error');
        expect(classifyImportRow({ itemCode: 'X', type: 'lab_test' }, existing()).action).toBe('error');
        const bad = classifyImportRow({ itemCode: 'X', name: 'X', type: 'nope' }, existing());
        expect(bad.action).toBe('error');
        expect(bad.message).toMatch(/Invalid type/);
    });
});

describe('buildBulkChange', () => {
    test('activate / deactivate toggle the active flag', () => {
        expect(buildBulkChange('activate')).toEqual({ ok: true, set: { active: true } });
        expect(buildBulkChange('deactivate')).toEqual({ ok: true, set: { active: false } });
    });

    test('price accepts non-negative numbers (including numeric strings)', () => {
        expect(buildBulkChange('price', 250)).toEqual({ ok: true, set: { unitPrice: 250 } });
        expect(buildBulkChange('price', '99.5')).toEqual({ ok: true, set: { unitPrice: 99.5 } });
        expect(buildBulkChange('price', -1).ok).toBe(false);
        expect(buildBulkChange('price', 'abc').ok).toBe(false);
    });

    test('gst is bounded to 0–28', () => {
        expect(buildBulkChange('gst', 12)).toEqual({ ok: true, set: { gst: 12 } });
        expect(buildBulkChange('gst', 0)).toEqual({ ok: true, set: { gst: 0 } });
        expect(buildBulkChange('gst', 29).ok).toBe(false);
        expect(buildBulkChange('gst', -5).ok).toBe(false);
    });

    test('category requires a non-empty trimmed value', () => {
        expect(buildBulkChange('category', ' Hematology ')).toEqual({ ok: true, set: { category: 'Hematology' } });
        expect(buildBulkChange('category', '   ').ok).toBe(false);
        expect(buildBulkChange('category', undefined).ok).toBe(false);
    });

    test('unknown action is rejected with a message listing valid actions', () => {
        const r = buildBulkChange('rename', 'x');
        expect(r.ok).toBe(false);
        expect(r.message).toMatch(/activate.*deactivate.*price.*gst.*category/);
    });
});
