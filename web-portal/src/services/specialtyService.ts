export interface Specialty {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  defaultWidgets: string[];
  aiPromptContext: string;
}

export interface ClinicalCalculator {
  id: string;
  name: string;
  specialtyId: string;
  description: string;
  inputs: { id: string; label: string; type: 'number' | 'select' | 'boolean'; options?: string[]; defaultValue?: any }[];
  calculate: (inputs: Record<string, any>) => { score: number | string; interpretation: string; riskLevel: 'low' | 'moderate' | 'high' | 'critical' };
}

export interface VaccineItem {
  id: string;
  name: string;
  targetDisease: string;
  dueAge: string;
  doseNumber: number;
  route: string;
  site: string;
  status: 'due' | 'given' | 'missed' | 'upcoming';
  givenDate?: string;
  batchNo?: string;
}

export interface GrowthRecord {
  ageMonths: number;
  weightKg: number;
  heightCm: number;
  headCircCm: number;
  weightPercentile: number;
  heightPercentile: number;
  bmi: number;
}

export const ALL_SPECIALTIES: Specialty[] = [
  { id: 'general-medicine', name: 'General Medicine', category: 'Medical', icon: 'Stethoscope', description: 'Internal Medicine, Comprehensive Health & Acute Care', defaultWidgets: ['vitals', 'soap', 'lab-orders'], aiPromptContext: 'Focus on multi-system symptoms, chronic disease management, and differential diagnoses.' },
  { id: 'pediatrics', name: 'Pediatrics', category: 'Pediatrics', icon: 'Baby', description: 'Child Health, WHO Growth Charts & Vaccination', defaultWidgets: ['growth-chart', 'vaccination', 'pediatric-dosing'], aiPromptContext: 'Focus on pediatric weight-based dosing, age-appropriate growth milestones, and pediatric triage.' },
  { id: 'cardiology', name: 'Cardiology', category: 'Cardiology', icon: 'HeartPulse', description: 'Cardiovascular Diseases, ECG, Echo & Cardiac Risk', defaultWidgets: ['cardiac-risk', 'ecg-viewer', 'bp-trend'], aiPromptContext: 'Focus on ECG findings, CHA2DS2-VASc risk, STEMI alerts, and antihypertensive therapy.' },
  { id: 'diabetology', name: 'Diabetology', category: 'Endocrinology', icon: 'Activity', description: 'Diabetes Mellitus, HbA1c, CGM & Insulin Management', defaultWidgets: ['hba1c-trend', 'insulin-calculator', 'diabetic-complications'], aiPromptContext: 'Focus on blood sugar logs, HbA1c targets, insulin titration, and organ screening.' },
  { id: 'orthopedics', name: 'Orthopedics', category: 'Surgical', icon: 'Bone', description: 'Musculoskeletal, Fractures, Joint Replacements & ROM', defaultWidgets: ['fracture-map', 'pain-scale', 'rom-measurement'], aiPromptContext: 'Focus on bone imaging, fracture classification, range of motion, and implant planning.' },
  { id: 'neurology', name: 'Neurology', category: 'Neuroscience', icon: 'Brain', description: 'Brain, Spinal Cord, Stroke & Neuromuscular Disorders', defaultWidgets: ['nih-stroke-scale', 'gcs-score', 'brain-mri'], aiPromptContext: 'Focus on focal neurological deficits, stroke timelines, GCS, and EEG interpretation.' },
  { id: 'nephrology', name: 'Nephrology', category: 'Renal', icon: 'Droplets', description: 'Kidney Diseases, Dialysis & Electrolyte Balance', defaultWidgets: ['egfr-calculator', 'dialysis-log', 'creatinine-trend'], aiPromptContext: 'Focus on eGFR stages, fluid balance, dialysis adequacy, and electrolyte disturbances.' },
  { id: 'pulmonology', name: 'Pulmonology', category: 'Respiratory', icon: 'Wind', description: 'Lungs, Spirometry, Asthma, COPD & Sleep Apnea', defaultWidgets: ['spirometry', 'abg-analysis', 'copd-cat-score'], aiPromptContext: 'Focus on FEV1/FVC ratios, PEFR trends, oxygenation, and inhaler adherence.' },
  { id: 'gastroenterology', name: 'Gastroenterology', category: 'Digestive', icon: 'Flame', description: 'GI Tract, Liver, Endoscopy & Inflammatory Bowel', defaultWidgets: ['meld-score', 'endoscopy-log', 'liver-panel'], aiPromptContext: 'Focus on MELD/Child-Pugh liver staging, GI bleeding risk, and endoscopy findings.' },
  { id: 'dermatology', name: 'Dermatology', category: 'Dermatology', icon: 'Sparkles', description: 'Skin, Hair, Nails & Lesion Biopsies', defaultWidgets: ['lesion-gallery', 'pasi-score', 'skin-ai'], aiPromptContext: 'Focus on dermatological lesion classification, PASI score, and biopsy results.' },
  { id: 'ent', name: 'ENT (Otorhinolaryngology)', category: 'Surgical', icon: 'Ear', description: 'Ear, Nose, Throat, Audiometry & Endoscopy', defaultWidgets: ['audiogram', 'ent-endoscopy', 'nasal-exam'], aiPromptContext: 'Focus on hearing thresholds, tympanometry, nasal endoscopy, and airway safety.' },
  { id: 'ophthalmology', name: 'Ophthalmology', category: 'Surgical', icon: 'Eye', description: 'Eye Care, Visual Acuity, IOP & Funduscopy', defaultWidgets: ['visual-acuity', 'iop-tracker', 'fundus-images'], aiPromptContext: 'Focus on Snellen visual acuity, intraocular pressure, and diabetic retinopathy.' },
  { id: 'obgyn', name: 'Obstetrics & Gynecology', category: 'Womens Health', icon: 'Heart', description: 'Maternal Health, Pregnancy Timeline & ANC Visits', defaultWidgets: ['edd-calculator', 'anc-tracker', 'kick-counter'], aiPromptContext: 'Focus on gestational age, EDD, high-risk pregnancy indicators, and ANC protocols.' },
  { id: 'psychiatry', name: 'Psychiatry', category: 'Mental Health', icon: 'Smile', description: 'Mental Health, PHQ-9, GAD-7 & Behavioral Notes', defaultWidgets: ['phq9-score', 'gad7-score', 'mental-status-exam'], aiPromptContext: 'Focus on PHQ-9 depression severity, suicide risk screening, and psychotropic therapy.' },
  { id: 'oncology', name: 'Oncology', category: 'Oncology', icon: 'Target', description: 'Cancer Care, TNM Staging & Chemotherapy Cycles', defaultWidgets: ['tnm-staging', 'chemo-tracker', 'tumor-markers'], aiPromptContext: 'Focus on TNM staging, chemotherapy regimens, RECIST criteria, and supportive care.' },
  { id: 'urology', name: 'Urology', category: 'Urinary', icon: 'Shield', description: 'Urinary Tract, Prostate, IPSS & Uroflowmetry', defaultWidgets: ['ipss-score', 'psa-trend', 'uroflowmetry'], aiPromptContext: 'Focus on IPSS voiding symptoms, PSA velocity, and nephrolithiasis.' },
  { id: 'endocrinology', name: 'Endocrinology', category: 'Endocrinology', icon: 'Zap', description: 'Hormones, Thyroid, Pituitary & Adrenal Disorders', defaultWidgets: ['thyroid-panel', 'calcium-calculator', 'hba1c-trend'], aiPromptContext: 'Focus on TSH levels, hormone replacement, and metabolic bone disease.' },
  { id: 'rheumatology', name: 'Rheumatology', category: 'Autoimmune', icon: 'ShieldAlert', description: 'Autoimmune Disorders, Arthritis & DAS28 Score', defaultWidgets: ['das28-score', 'autoantibody-panel', 'joint-count'], aiPromptContext: 'Focus on swollen joint counts, inflammatory markers (ESR/CRP), and biologics.' },
  { id: 'infectious-diseases', name: 'Infectious Diseases', category: 'Infectious', icon: 'Bug', description: 'Pathogens, Antibiotic Stewardship & Culture Trends', defaultWidgets: ['culture-sensitivity', 'antibiotic-stewardship', 'fever-chart'], aiPromptContext: 'Focus on microbial sensitivity patterns, empiric vs targeted antibiotics, and infection control.' },
  { id: 'emergency-medicine', name: 'Emergency Medicine', category: 'Acute Care', icon: 'AlertTriangle', description: 'Acute Triage, ESI Level 1-5 & Resuscitation Timers', defaultWidgets: ['esi-triage', 'sepsis-timer', 'trauma-checklist'], aiPromptContext: 'Focus on rapid ESI triage, ACLS/ATLS protocols, time-critical stroke/STEMI pathways.' },
  { id: 'icu', name: 'ICU (Intensive Care)', category: 'Acute Care', icon: 'ShieldPlus', description: 'Critical Care, SOFA / APACHE II & Ventilator Parameters', defaultWidgets: ['sofa-score', 'apache-score', 'ventilator-sheet'], aiPromptContext: 'Focus on SOFA organ failure scores, ventilator modes, arterial blood gas, and vasopressors.' },
  { id: 'surgery', name: 'General Surgery', category: 'Surgical', icon: 'Scissors', description: 'Operative Notes, Surgical Risks & Post-op Recovery', defaultWidgets: ['surgical-checklist', 'wound-tracker', 'drains-output'], aiPromptContext: 'Focus on surgical safety checklists, post-op complication monitoring, and wound healing.' },
  { id: 'plastic-surgery', name: 'Plastic Surgery', category: 'Surgical', icon: 'PenTool', description: 'Reconstructive & Cosmetic Surgery, Graft Mapping', defaultWidgets: ['graft-map', 'photo-comparison', 'flap-monitoring'], aiPromptContext: 'Focus on tissue flap viability, burn percentage (Lund-Browder), and cosmetic outcomes.' },
  { id: 'dental', name: 'Dental Surgery', category: 'Dental', icon: 'Smile', description: 'Oral Health, Periodontal Charts & Odontogram', defaultWidgets: ['odontogram', 'perio-chart', 'dental-xray'], aiPromptContext: 'Focus on FDI tooth numbering, periodontal probing depth, and endodontic care.' },
  { id: 'physiotherapy', name: 'Physiotherapy', category: 'Rehabilitation', icon: 'Activity', description: 'Physical Rehab, Muscle Power Testing & Functional Scale', defaultWidgets: ['mmt-score', 'rehab-goals', 'functional-index'], aiPromptContext: 'Focus on Manual Muscle Testing (MMT 0-5), mobility goals, and posture correction.' },
  { id: 'nutrition', name: 'Nutrition & Dietetics', category: 'Dietetics', icon: 'Apple', description: 'Nutritional Assessment, Calorie Counter & Macro Plan', defaultWidgets: ['calorie-calculator', 'macro-breakdown', 'diet-plan'], aiPromptContext: 'Focus on basal metabolic rate, total daily energy expenditure, and enteral/parenteral nutrition.' },
  { id: 'family-medicine', name: 'Family Medicine', category: 'Primary Care', icon: 'Users', description: 'Holistic Primary Care, Preventive Screening & Wellness', defaultWidgets: ['preventive-checkup', 'family-tree', 'vitals'], aiPromptContext: 'Focus on age-appropriate preventive screenings, immunization, and family history.' }
];

// Sample Interactive Vaccination Schedule Data
export const INITIAL_PEDIATRIC_VACCINES: VaccineItem[] = [
  { id: 'v1', name: 'BCG', targetDisease: 'Tuberculosis', dueAge: 'At Birth', doseNumber: 1, route: 'Intradermal', site: 'Left Upper Arm', status: 'given', givenDate: '12-May-2024', batchNo: 'BCG-9921' },
  { id: 'v2', name: 'Hepatitis B - Birth Dose', targetDisease: 'Hepatitis B', dueAge: 'At Birth', doseNumber: 1, route: 'Intramuscular', site: 'Anterolateral Thigh', status: 'given', givenDate: '12-May-2024', batchNo: 'HBV-1024' },
  { id: 'v3', name: 'OPV - 0', targetDisease: 'Poliomyelitis', dueAge: 'At Birth', doseNumber: 1, route: 'Oral', site: 'Mouth (2 drops)', status: 'given', givenDate: '12-May-2024', batchNo: 'OPV-8812' },
  { id: 'v4', name: 'Pentavalent - 1 (DPT+HepB+Hib)', targetDisease: 'Multiple', dueAge: '6 Weeks', doseNumber: 1, route: 'Intramuscular', site: 'Mid-thigh', status: 'given', givenDate: '24-Jun-2024', batchNo: 'PENTA-402' },
  { id: 'v5', name: 'Rotavirus - 1', targetDisease: 'Diarrhea', dueAge: '6 Weeks', doseNumber: 1, route: 'Oral', site: 'Mouth', status: 'given', givenDate: '24-Jun-2024', batchNo: 'ROTA-112' },
  { id: 'v6', name: 'PCV - 1', targetDisease: 'Pneumonia', dueAge: '6 Weeks', doseNumber: 1, route: 'Intramuscular', site: 'Right Thigh', status: 'given', givenDate: '24-Jun-2024', batchNo: 'PCV-801' },
  { id: 'v7', name: 'Pentavalent - 2', targetDisease: 'Multiple', dueAge: '10 Weeks', doseNumber: 2, route: 'Intramuscular', site: 'Mid-thigh', status: 'due' },
  { id: 'v8', name: 'Rotavirus - 2', targetDisease: 'Diarrhea', dueAge: '10 Weeks', doseNumber: 2, route: 'Oral', site: 'Mouth', status: 'due' },
  { id: 'v9', name: 'Pentavalent - 3', targetDisease: 'Multiple', dueAge: '14 Weeks', doseNumber: 3, route: 'Intramuscular', site: 'Mid-thigh', status: 'upcoming' },
  { id: 'v10', name: 'MMR - 1', targetDisease: 'Measles, Mumps, Rubella', dueAge: '9 Months', doseNumber: 1, route: 'Subcutaneous', site: 'Right Arm', status: 'upcoming' },
  { id: 'v11', name: 'DPT Booster 1', targetDisease: 'Diphtheria, Pertussis, Tetanus', dueAge: '16-24 Months', doseNumber: 4, route: 'Intramuscular', site: 'Left Arm', status: 'upcoming' }
];

// Clinical Calculator Logic
export const CLINICAL_CALCULATORS: Record<string, ClinicalCalculator> = {
  'pediatric-dose': {
    id: 'pediatric-dose',
    name: 'Pediatric Weight-Based Dosage Calculator',
    specialtyId: 'pediatrics',
    description: 'Calculates recommended mg/kg dose for pediatric patients',
    inputs: [
      { id: 'weightKg', label: 'Child Weight (kg)', type: 'number', defaultValue: 14 },
      { id: 'mgPerKg', label: 'Dose (mg/kg/day)', type: 'number', defaultValue: 15 },
      { id: 'frequency', label: 'Doses per day', type: 'select', options: ['1 (OD)', '2 (BID)', '3 (TID)', '4 (QID)'], defaultValue: '3 (TID)' }
    ],
    calculate: (inputs) => {
      const w = Number(inputs.weightKg) || 1;
      const mg = Number(inputs.mgPerKg) || 10;
      const freqDiv = inputs.frequency.includes('BID') ? 2 : inputs.frequency.includes('TID') ? 3 : inputs.frequency.includes('QID') ? 4 : 1;
      const totalDailyMg = w * mg;
      const singleDoseMg = totalDailyMg / freqDiv;
      return {
        score: `${singleDoseMg.toFixed(1)} mg per dose`,
        interpretation: `Total Daily Dose: ${totalDailyMg.toFixed(1)} mg (${singleDoseMg.toFixed(1)} mg every ${24 / freqDiv} hours).`,
        riskLevel: singleDoseMg > 500 ? 'high' : 'low'
      };
    }
  },
  'chads-vasc': {
    id: 'chads-vasc',
    name: 'CHA₂DS₂-VASc Score for Atrial Fibrillation Stroke Risk',
    specialtyId: 'cardiology',
    description: 'Estimates stroke risk in patients with non-valvular atrial fibrillation',
    inputs: [
      { id: 'age', label: 'Age', type: 'select', options: ['< 65 years (0)', '65-74 years (+1)', '>= 75 years (+2)'], defaultValue: '65-74 years (+1)' },
      { id: 'female', label: 'Female Sex (+1)', type: 'boolean', defaultValue: false },
      { id: 'chf', label: 'CHF / LV Dysfunction (+1)', type: 'boolean', defaultValue: true },
      { id: 'hypertension', label: 'Hypertension (+1)', type: 'boolean', defaultValue: true },
      { id: 'stroke', label: 'Prior Stroke / TIA / Thromboembolism (+2)', type: 'boolean', defaultValue: false },
      { id: 'vascular', label: 'Vascular Disease (Prior MI, PAD) (+1)', type: 'boolean', defaultValue: false },
      { id: 'diabetes', label: 'Diabetes Mellitus (+1)', type: 'boolean', defaultValue: true }
    ],
    calculate: (inputs) => {
      let score = 0;
      if (inputs.age.includes('+1')) score += 1;
      if (inputs.age.includes('+2')) score += 2;
      if (inputs.female) score += 1;
      if (inputs.chf) score += 1;
      if (inputs.hypertension) score += 1;
      if (inputs.stroke) score += 2;
      if (inputs.vascular) score += 1;
      if (inputs.diabetes) score += 1;

      let risk: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      let strokeRiskPercent = '0.2%';
      if (score === 1) { risk = 'moderate'; strokeRiskPercent = '1.3%'; }
      else if (score === 2) { risk = 'high'; strokeRiskPercent = '2.2%'; }
      else if (score >= 3) { risk = 'critical'; strokeRiskPercent = `${(score * 1.5 + 2).toFixed(1)}%`; }

      return {
        score: `${score} Points`,
        interpretation: `Annual Stroke Risk: ~${strokeRiskPercent}. Oral Anticoagulation (NOAC/Warfarin) strongly recommended if Score >= 2 (Male) or >= 3 (Female).`,
        riskLevel: risk
      };
    }
  },
  'nih-stroke': {
    id: 'nih-stroke',
    name: 'NIH Stroke Scale (NIHSS)',
    specialtyId: 'neurology',
    description: 'Quantitative measure of neurological deficit in acute stroke',
    inputs: [
      { id: 'loc', label: '1a. Level of Consciousness', type: 'select', options: ['0 - Alert', '1 - Drowsy', '2 - Stuporous', '3 - Comatose'], defaultValue: '0 - Alert' },
      { id: 'gaze', label: '2. Best Gaze', type: 'select', options: ['0 - Normal', '1 - Partial gaze palsy', '2 - Forced deviation'], defaultValue: '0 - Normal' },
      { id: 'motorArm', label: '5. Motor Arm (Weakness)', type: 'select', options: ['0 - No drift', '1 - Drift', '2 - Some effort against gravity', '3 - No effort against gravity', '4 - No movement'], defaultValue: '1 - Drift' },
      { id: 'facial', label: '4. Facial Palsy', type: 'select', options: ['0 - Normal', '1 - Minor paralysis', '2 - Partial paralysis', '3 - Complete paralysis'], defaultValue: '1 - Minor paralysis' }
    ],
    calculate: (inputs) => {
      let score = 0;
      score += Number(inputs.loc?.charAt(0)) || 0;
      score += Number(inputs.gaze?.charAt(0)) || 0;
      score += Number(inputs.motorArm?.charAt(0)) || 0;
      score += Number(inputs.facial?.charAt(0)) || 0;

      let risk: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      let interp = 'Minor Stroke';
      if (score >= 5 && score <= 15) { risk = 'moderate'; interp = 'Moderate Stroke - Evaluate for Thrombolysis (rtPA)'; }
      else if (score > 15 && score <= 20) { risk = 'high'; interp = 'Moderate to Severe Stroke - Thrombectomy candidate'; }
      else if (score > 20) { risk = 'critical'; interp = 'Severe Stroke - High Mortality / ICU Admission required'; }

      return {
        score: `${score} Points`,
        interpretation: interp,
        riskLevel: risk
      };
    }
  },
  'phq9-depression': {
    id: 'phq9-depression',
    name: 'PHQ-9 Depression Severity Scale',
    specialtyId: 'psychiatry',
    description: 'Patient Health Questionnaire 9-item screening tool for depression',
    inputs: [
      { id: 'q1', label: 'Little interest or pleasure in doing things', type: 'select', options: ['0 - Not at all', '1 - Several days', '2 - More than half the days', '3 - Nearly every day'], defaultValue: '2 - More than half the days' },
      { id: 'q2', label: 'Feeling down, depressed, or hopeless', type: 'select', options: ['0 - Not at all', '1 - Several days', '2 - More than half the days', '3 - Nearly every day'], defaultValue: '2 - More than half the days' },
      { id: 'q3', label: 'Trouble falling or staying asleep, or sleeping too much', type: 'select', options: ['0 - Not at all', '1 - Several days', '2 - More than half the days', '3 - Nearly every day'], defaultValue: '1 - Several days' },
      { id: 'q4', label: 'Feeling tired or having little energy', type: 'select', options: ['0 - Not at all', '1 - Several days', '2 - More than half the days', '3 - Nearly every day'], defaultValue: '2 - More than half the days' }
    ],
    calculate: (inputs) => {
      let score = 0;
      score += Number(inputs.q1?.charAt(0)) || 0;
      score += Number(inputs.q2?.charAt(0)) || 0;
      score += Number(inputs.q3?.charAt(0)) || 0;
      score += Number(inputs.q4?.charAt(0)) || 0;

      let risk: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      let interp = 'Minimal Depression';
      if (score >= 5 && score <= 9) { risk = 'low'; interp = 'Mild Depression - Watchful waiting'; }
      else if (score >= 10 && score <= 14) { risk = 'moderate'; interp = 'Moderate Depression - Consider psychotherapy / SSRIs'; }
      else if (score >= 15) { risk = 'high'; interp = 'Moderately Severe to Severe Depression - Pharmacotherapy + Psychotherapy recommended'; }

      return {
        score: `${score} / 12 (Partial PHQ-9)`,
        interpretation: interp,
        riskLevel: risk
      };
    }
  },
  'sofa-icu': {
    id: 'sofa-icu',
    name: 'SOFA (Sequential Organ Failure Assessment) Score',
    specialtyId: 'icu',
    description: 'Tracks organ dysfunction degree and mortality prediction in ICU patients',
    inputs: [
      { id: 'pao2fio2', label: 'PaO2 / FiO2 Ratio', type: 'select', options: ['0 - > 400', '1 - <= 400', '2 - <= 300', '3 - <= 200 with mechanical ventilation', '4 - <= 100 with mechanical ventilation'], defaultValue: '2 - <= 300' },
      { id: 'platelets', label: 'Platelets (x10^3 / uL)', type: 'select', options: ['0 - > 150', '1 - <= 150', '2 - <= 100', '3 - <= 50', '4 - <= 20'], defaultValue: '1 - <= 150' },
      { id: 'map', label: 'Hypotension / Inotropes', type: 'select', options: ['0 - MAP >= 70 mmHg', '1 - MAP < 70 mmHg', '2 - Dopamine <= 5 ug/kg/min', '3 - Norepinephrine <= 0.1 ug/kg/min', '4 - Norepinephrine > 0.1 ug/kg/min'], defaultValue: '1 - MAP < 70 mmHg' },
      { id: 'creatinine', label: 'Serum Creatinine (mg/dL)', type: 'select', options: ['0 - < 1.2', '1 - 1.2 - 1.9', '2 - 2.0 - 3.4', '3 - 3.5 - 4.9', '4 - > 5.0'], defaultValue: '2 - 2.0 - 3.4' }
    ],
    calculate: (inputs) => {
      let score = 0;
      score += Number(inputs.pao2fio2?.charAt(0)) || 0;
      score += Number(inputs.platelets?.charAt(0)) || 0;
      score += Number(inputs.map?.charAt(0)) || 0;
      score += Number(inputs.creatinine?.charAt(0)) || 0;

      let risk: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      let mortality = '< 10%';
      if (score >= 6 && score <= 9) { risk = 'moderate'; mortality = '15 - 20%'; }
      else if (score >= 10 && score <= 12) { risk = 'high'; mortality = '40 - 50%'; }
      else if (score > 12) { risk = 'critical'; mortality = '> 80%'; }

      return {
        score: `${score} Points`,
        interpretation: `Predicted ICU Mortality: ~${mortality}. Indicates significant multi-organ dysfunction syndrome (MODS).`,
        riskLevel: risk
      };
    }
  }
};
