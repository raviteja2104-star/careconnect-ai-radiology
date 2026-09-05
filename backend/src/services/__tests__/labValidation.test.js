const { computeFlag, resolveRange, formatRange } = require('../LabValidation');

describe('LabValidation.computeFlag — numeric', () => {
    const range = { low: 70, high: 100, criticalLow: 40, criticalHigh: 400, unit: 'mg/dL' };

    test.each([
        [85, 'normal'],
        [70, 'normal'], // low bound inclusive-normal
        [100, 'normal'], // high bound inclusive-normal
        [69.9, 'low'],
        [40, 'low'], // criticalLow bound is inclusive toward the milder 'low'
        [39.9, 'critical'],
        [0, 'critical'],
        [150, 'high'],
        [400, 'high'], // criticalHigh bound is inclusive toward the milder 'high'
        [400.1, 'critical'],
        [1000, 'critical'],
    ])('value %p → %s', (value, expected) => {
        expect(computeFlag({ value, resultType: 'numeric', range })).toEqual({ flag: expected });
    });

    test('accepts numeric strings', () => {
        expect(computeFlag({ value: '85', resultType: 'numeric', range })).toEqual({ flag: 'normal' });
        expect(computeFlag({ value: ' 39 ', resultType: 'numeric', range })).toEqual({ flag: 'critical' });
    });

    test('rejects non-numeric values with an error (no flag)', () => {
        const out = computeFlag({ value: 'abc', resultType: 'numeric', range });
        expect(out.error).toMatch(/Non-numeric/i);
        expect(out.flag).toBeUndefined();
    });

    test('rejects Infinity-producing junk', () => {
        expect(computeFlag({ value: 'Infinity', resultType: 'numeric', range }).error).toBeDefined();
    });

    test('numeric value without a range yields null flag', () => {
        expect(computeFlag({ value: 85, resultType: 'numeric' })).toEqual({ flag: null });
    });

    test('range with only low/high (no critical bounds)', () => {
        const r = { low: 3.5, high: 5.1 };
        expect(computeFlag({ value: 3.4, resultType: 'numeric', range: r })).toEqual({ flag: 'low' });
        expect(computeFlag({ value: 6, resultType: 'numeric', range: r })).toEqual({ flag: 'high' });
        expect(computeFlag({ value: 4, resultType: 'numeric', range: r })).toEqual({ flag: 'normal' });
    });

    test('empty value yields null flag', () => {
        expect(computeFlag({ value: '', resultType: 'numeric', range })).toEqual({ flag: null });
        expect(computeFlag({ value: null, resultType: 'numeric', range })).toEqual({ flag: null });
    });
});

describe('LabValidation.computeFlag — qualitative (posneg/reactive/detected)', () => {
    test('case-folded match with textExpected → normal', () => {
        const range = { textExpected: 'Negative' };
        expect(computeFlag({ value: 'negative', resultType: 'posneg', range })).toEqual({ flag: 'normal' });
        expect(computeFlag({ value: '  NEGATIVE ', resultType: 'posneg', range })).toEqual({ flag: 'normal' });
    });

    test('positive-family words → positive', () => {
        const range = { textExpected: 'Negative' };
        expect(computeFlag({ value: 'Positive', resultType: 'posneg', range })).toEqual({ flag: 'positive' });
        expect(computeFlag({ value: 'REACTIVE', resultType: 'reactive', range: { textExpected: 'Non-reactive' } })).toEqual({ flag: 'positive' });
        expect(computeFlag({ value: 'Detected', resultType: 'detected', range: { textExpected: 'MTB not detected' } })).toEqual({ flag: 'positive' });
    });

    test('expected match beats positive-word classification', () => {
        // e.g. a test whose expected value IS 'Reactive' would still be normal.
        expect(computeFlag({ value: 'Reactive', resultType: 'reactive', range: { textExpected: 'Reactive' } })).toEqual({ flag: 'normal' });
    });

    test('non-expected, non-positive value → abnormal', () => {
        const range = { textExpected: 'Negative' };
        expect(computeFlag({ value: 'Indeterminate', resultType: 'posneg', range })).toEqual({ flag: 'abnormal' });
    });

    test('no textExpected: positive words → positive, others → abnormal', () => {
        expect(computeFlag({ value: 'positive', resultType: 'posneg' })).toEqual({ flag: 'positive' });
        expect(computeFlag({ value: 'trace', resultType: 'posneg' })).toEqual({ flag: 'abnormal' });
    });

    test('unflagged result types return null flag', () => {
        expect(computeFlag({ value: 'clear yellow', resultType: 'descriptive' })).toEqual({ flag: null });
        expect(computeFlag({ value: '1:160', resultType: 'titer' })).toEqual({ flag: null });
    });
});

describe('LabValidation.resolveRange — specificity', () => {
    const anyRange = { sexApplicability: 'any', low: 1, high: 2, active: true, label: 'any' };
    const ageRange = { sexApplicability: 'any', ageMinYears: 18, ageMaxYears: 65, low: 3, high: 4, active: true, label: 'age' };
    const sexRange = { sexApplicability: 'male', low: 5, high: 6, active: true, label: 'sex' };
    const sexAgeRange = { sexApplicability: 'male', ageMinYears: 18, ageMaxYears: 65, low: 7, high: 8, active: true, label: 'sex+age' };
    const all = [anyRange, ageRange, sexRange, sexAgeRange];

    test('sex+ageBand wins when everything matches', () => {
        expect(resolveRange(all, { age: 30, sex: 'male' }).label).toBe('sex+age');
    });

    test('sex-only wins when age is outside the band', () => {
        expect(resolveRange(all, { age: 70, sex: 'male' }).label).toBe('sex');
    });

    test('ageBand wins over any when sex does not match', () => {
        expect(resolveRange(all, { age: 30, sex: 'female' }).label).toBe('age');
    });

    test('falls back to any when nothing else matches', () => {
        expect(resolveRange(all, { age: 70, sex: 'female' }).label).toBe('any');
    });

    test('missing age excludes age-banded ranges; missing sex excludes sexed ranges', () => {
        expect(resolveRange(all, {}).label).toBe('any');
        expect(resolveRange(all, { sex: 'male' }).label).toBe('sex');
        expect(resolveRange(all, { age: 30 }).label).toBe('age');
    });

    test('age band boundaries are inclusive', () => {
        expect(resolveRange([ageRange, anyRange], { age: 18 }).label).toBe('age');
        expect(resolveRange([ageRange, anyRange], { age: 65 }).label).toBe('age');
        expect(resolveRange([ageRange, anyRange], { age: 17 }).label).toBe('any');
        expect(resolveRange([ageRange, anyRange], { age: 66 }).label).toBe('any');
    });

    test('inactive ranges are never chosen', () => {
        const inactive = { ...sexAgeRange, active: false };
        expect(resolveRange([inactive, anyRange], { age: 30, sex: 'male' }).label).toBe('any');
    });

    test('specimen mismatch excludes a range; missing specimen matches', () => {
        const serum = { ...anyRange, specimen: 'Serum', label: 'serum' };
        expect(resolveRange([serum], { specimen: 'Plasma' })).toBeNull();
        expect(resolveRange([serum], { specimen: 'serum' }).label).toBe('serum');
        expect(resolveRange([serum], {}).label).toBe('serum'); // no ctx specimen → match
    });

    test('returns null for empty or all-excluded candidate lists', () => {
        expect(resolveRange([], { age: 30 })).toBeNull();
        expect(resolveRange([sexRange], { sex: 'female' })).toBeNull();
        expect(resolveRange(undefined, {})).toBeNull();
    });
});

describe('LabValidation.formatRange', () => {
    test('low + high + unit', () => {
        expect(formatRange({ low: 70, high: 100, unit: 'mg/dL' })).toBe('70–100 mg/dL');
    });

    test('high only', () => {
        expect(formatRange({ high: 100, unit: 'mg/dL' })).toBe('≤100 mg/dL');
    });

    test('low only, no unit', () => {
        expect(formatRange({ low: 40 })).toBe('≥40');
    });

    test('textExpected takes precedence', () => {
        expect(formatRange({ textExpected: 'Negative', low: 1, high: 2 })).toBe('Negative');
    });

    test('empty/missing range → empty string', () => {
        expect(formatRange(null)).toBe('');
        expect(formatRange({})).toBe('');
    });
});
