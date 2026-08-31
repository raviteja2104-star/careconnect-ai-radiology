const { resolveSubspecialty } = require('../RadiologyRouting');

describe('RadiologyRouting.resolveSubspecialty', () => {
    test.each([
        ['CT', 'Brain', 'neuro'],
        ['MRI', 'Cervical Spine', 'neuro'],
        ['MRI', 'Knee', 'msk'],
        ['XR', 'Shoulder joint', 'msk'],
        ['CT', 'Chest', 'chest'],
        ['MG', 'Breast', 'breast'],
        ['CT', 'Abdomen and Pelvis', 'abdominal'],
        ['US', 'Thyroid', 'general'],
    ])('%s %s → %s', (modality, bodyPart, expected) => {
        expect(resolveSubspecialty(modality, bodyPart)).toBe(expected);
    });

    test('MG modality forces breast subspecialty regardless of body part text', () => {
        expect(resolveSubspecialty('MG', 'Screening')).toBe('breast');
    });
});
