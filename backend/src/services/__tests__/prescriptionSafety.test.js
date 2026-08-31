const { screen } = require('../PrescriptionSafety');

describe('PrescriptionSafety.screen', () => {
    test('flags known critical interaction (warfarin + aspirin)', () => {
        const flags = screen(
            [{ name: 'Aspirin', dose: '75mg' }],
            { currentMedications: ['Warfarin'] }
        );
        expect(flags.some((f) => f.kind === 'interaction' && f.severity === 'critical')).toBe(true);
    });

    test('flags duplicate therapy across new and current medications', () => {
        const flags = screen(
            [{ name: 'Metformin', dose: '500mg' }],
            { currentMedications: ['metformin'] }
        );
        expect(flags.some((f) => f.kind === 'duplicate')).toBe(true);
    });

    test('flags allergy match as critical', () => {
        const flags = screen(
            [{ name: 'Amoxicillin', dose: '500mg' }],
            { allergies: ['amoxicillin'] }
        );
        expect(flags.some((f) => f.kind === 'allergy' && f.severity === 'critical')).toBe(true);
    });

    test('flags renal caution only when renalImpairment is set', () => {
        const drugs = [{ name: 'Metformin', dose: '500mg' }];
        expect(screen(drugs, { renalImpairment: true }).some((f) => f.kind === 'renal')).toBe(true);
        expect(screen(drugs, {}).some((f) => f.kind === 'renal')).toBe(false);
    });

    test('flags pregnancy caution for cautioned drugs', () => {
        const flags = screen([{ name: 'Warfarin', dose: '5mg' }], { pregnant: true });
        expect(flags.some((f) => f.kind === 'pregnancy' && f.severity === 'critical')).toBe(true);
    });

    test('flags anomalous dose (zero and absurd)', () => {
        expect(screen([{ name: 'Paracetamol', dose: '0mg' }]).some((f) => f.kind === 'dose_anomaly')).toBe(true);
        expect(screen([{ name: 'Paracetamol', dose: '9999mg' }]).some((f) => f.kind === 'dose_anomaly')).toBe(true);
        expect(screen([{ name: 'Paracetamol', dose: '500mg' }]).some((f) => f.kind === 'dose_anomaly')).toBe(false);
    });

    test('clean prescription produces no flags', () => {
        const flags = screen(
            [{ name: 'Cetirizine', dose: '10mg' }],
            { currentMedications: ['Vitamin D3'], allergies: ['penicillin'] }
        );
        expect(flags).toHaveLength(0);
    });
});
