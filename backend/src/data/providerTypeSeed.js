/**
 * ProviderType master seed — the 20 entries from the master workbook's
 * Provider_Types sheet, plus 3 long-tail values actually observed in
 * All_Providers_Master's own Provider Type column ('Clinic/Diagnostic',
 * 'Homeopathy Clinic', 'Chain Pharmacy') that weren't in the Provider_Types
 * list itself but exist in real rows, so the import pipeline (item 2) can
 * resolve every real value without inventing a category. See
 * docs/nearby-data-master-plan.md §5.
 *
 * `code` for the 7 values the already-built Provider.type enum + the sample
 * seed data (src/data/vizagProviderSeed.js) already use — hospital, clinic,
 * diagnostic, pharmacy, blood_bank, home_healthcare, ambulance — is kept
 * identical on purpose so nothing existing needs to change value.
 */
module.exports = [
    { code: 'hospital', label: 'Hospital', category: 'facility' },
    { code: 'government_hospital', label: 'Government Hospital', category: 'facility' },
    { code: 'clinic', label: 'Clinic', category: 'facility' },
    { code: 'individual_doctor_clinic', label: 'Individual Doctor Clinic', category: 'facility' },
    { code: 'polyclinic', label: 'Polyclinic', category: 'facility' },
    { code: 'diagnostic', label: 'Diagnostic Centre', category: 'lab' },
    { code: 'laboratory', label: 'Laboratory', category: 'lab' },
    { code: 'dental_clinic', label: 'Dental Clinic', category: 'facility' },
    { code: 'eye_clinic', label: 'Eye Clinic', category: 'facility' },
    { code: 'eye_hospital', label: 'Eye Hospital', category: 'facility' },
    { code: 'pharmacy', label: 'Pharmacy', category: 'pharmacy' },
    { code: 'blood_bank', label: 'Blood Bank', category: 'lab' },
    { code: 'physiotherapy_centre', label: 'Physiotherapy Centre', category: 'facility' },
    { code: 'rehabilitation_centre', label: 'Rehabilitation Centre', category: 'facility' },
    { code: 'home_healthcare', label: 'Home Healthcare', category: 'service' },
    { code: 'ambulance', label: 'Ambulance Service', category: 'service' },
    { code: 'imaging_centre', label: 'Imaging Centre', category: 'lab' },
    { code: 'vaccination_centre', label: 'Vaccination Centre', category: 'service' },
    { code: 'day_care_centre', label: 'Day Care Centre', category: 'facility' },
    { code: 'specialty_centre', label: 'Specialty Centre', category: 'facility' },
    // Long-tail values observed in All_Providers_Master, not in Provider_Types:
    { code: 'clinic_diagnostic', label: 'Clinic / Diagnostic Centre', category: 'facility' },
    { code: 'homeopathy_clinic', label: 'Homeopathy Clinic', category: 'facility' },
    { code: 'chain_pharmacy', label: 'Chain Pharmacy', category: 'pharmacy' },
];
