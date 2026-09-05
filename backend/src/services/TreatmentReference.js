/**
 * TreatmentReference — curated, textbook-standard FIRST-LINE options for
 * common outpatient diagnoses. Used as the honest fallback when the Claude
 * AI service is unavailable, and always labeled as a reference list, never
 * as AI output. Decision support only: the doctor reviews and decides.
 *
 * Entries are deliberately conservative (common first-line agents, typical
 * adult dosage ranges, standard precautions). No entry is patient-specific;
 * per-patient screening happens in PrescriptionSafety at request time.
 */

const REFERENCE = [
    {
        match: ['hypertension', 'htn', 'ht -', 'hypertensive'],
        suggestions: [
            { name: 'Amlodipine', generic: 'Amlodipine', indication: 'First-line calcium-channel blocker for essential hypertension.', dosage: '5–10 mg', route: 'Oral', frequency: '1-0-0 (OD)', duration: 'Ongoing / long term', precautions: 'Watch for ankle edema; caution in severe aortic stenosis.', interactions: 'Additive hypotension with other antihypertensives.' },
            { name: 'Telmisartan', generic: 'Telmisartan', indication: 'ARB option, preferred with diabetes or CKD for renoprotection.', dosage: '40–80 mg', route: 'Oral', frequency: '1-0-0 (OD)', duration: 'Ongoing / long term', precautions: 'Avoid in pregnancy. Monitor potassium and creatinine in renal impairment.', interactions: 'Hyperkalemia risk with potassium-sparing diuretics.' },
        ],
    },
    {
        match: ['type 2 diabetes', 't2dm', 'diabetes mellitus', 'e11'],
        suggestions: [
            { name: 'Metformin', generic: 'Metformin', indication: 'First-line agent for type 2 diabetes mellitus.', dosage: '500–1000 mg', route: 'Oral', frequency: '1-0-1 (BID)', duration: 'Ongoing / long term', precautions: 'Avoid in significant renal impairment (review eGFR); hold around iodinated contrast. GI upset common — take after food.', interactions: 'Caution with contrast media; alcohol increases lactic acidosis risk.' },
        ],
    },
    {
        match: ['hypothyroid', 'e03'],
        suggestions: [
            { name: 'Levothyroxine', generic: 'Levothyroxine / Thyroxine Sodium', indication: 'Replacement therapy for hypothyroidism.', dosage: '25–100 mcg (titrate to TSH)', route: 'Oral', frequency: '1-0-0 (OD)', duration: 'Ongoing / long term', precautions: 'Take early morning on empty stomach; recheck TSH in 6–8 weeks. Lower starting dose in elderly or cardiac disease.', interactions: 'Iron, calcium and PPIs reduce absorption — separate by 4 hours.' },
        ],
    },
    {
        match: ['viral fever', 'fever', 'pyrexia'],
        suggestions: [
            { name: 'Paracetamol', generic: 'Paracetamol', indication: 'Antipyretic and analgesic for symptomatic fever management.', dosage: '500–650 mg', route: 'Oral', frequency: '1-1-1 (TID) or SOS', duration: '3 days', precautions: 'Max 3 g/day in adults; caution in hepatic impairment.', interactions: 'Hepatotoxicity risk potentiated with chronic alcohol use.' },
            { name: 'Cetirizine', generic: 'Cetirizine', indication: 'Symptomatic relief when coryza/allergic symptoms accompany fever.', dosage: '10 mg', route: 'Oral', frequency: '0-0-1 (HS)', duration: '5 days', precautions: 'May cause drowsiness — avoid driving.', interactions: 'Additive sedation with CNS depressants.' },
        ],
    },
    {
        match: ['upper respiratory', 'uri ', 'j06', 'common cold', 'pharyngitis', 'sore throat'],
        suggestions: [
            { name: 'Paracetamol', generic: 'Paracetamol', indication: 'Symptomatic relief for viral URI — most need no antibiotics.', dosage: '500–650 mg', route: 'Oral', frequency: '1-1-1 (TID) or SOS', duration: '3 days', precautions: 'Max 3 g/day; counsel on red-flag review.', interactions: 'None identified with common OTC use.' },
            { name: 'Levocetirizine + Montelukast', generic: 'Levocetirizine + Montelukast', indication: 'Symptom control for rhinorrhea/allergic component.', dosage: '5/10 mg', route: 'Oral', frequency: '0-0-1 (HS)', duration: '5–7 days', precautions: 'Drowsiness possible.', interactions: 'Additive sedation with CNS depressants.' },
        ],
    },
    {
        match: ['gastritis', 'gerd', 'reflux', 'k29', 'dyspepsia', 'hyperacidity', 'epigastric'],
        suggestions: [
            { name: 'Pantoprazole', generic: 'Pantoprazole', indication: 'PPI for acid suppression in gastritis/GERD.', dosage: '40 mg', route: 'Oral', frequency: '1-0-0 (OD)', duration: '2 weeks', precautions: 'Take 30 minutes before breakfast; review if symptoms persist beyond 4 weeks.', interactions: 'May reduce clopidogrel activation (prefer pantoprazole over omeprazole).' },
        ],
    },
    {
        match: ['urinary tract infection', 'uti', 'n39.0', 'burning micturition'],
        suggestions: [
            { name: 'Nitrofurantoin', generic: 'Nitrofurantoin', indication: 'First-line for uncomplicated lower UTI.', dosage: '100 mg', route: 'Oral', frequency: '1-0-1 (BID)', duration: '5 days', precautions: 'Avoid if eGFR < 45; avoid at term pregnancy (38+ weeks). Urine culture advised before empirical switch.', interactions: 'Antacids with magnesium reduce absorption.' },
        ],
    },
    {
        match: ['dyslipidemia', 'dyslipidaemia', 'e78', 'hyperlipidemia'],
        suggestions: [
            { name: 'Atorvastatin', generic: 'Atorvastatin', indication: 'Statin therapy for dyslipidemia / ASCVD risk reduction.', dosage: '10–40 mg', route: 'Oral', frequency: '0-0-1 (HS)', duration: 'Ongoing / long term', precautions: 'Contraindicated in pregnancy. Check LFTs; report unexplained myalgia.', interactions: 'Increased myopathy risk with fibrates and some macrolides.' },
        ],
    },
    {
        match: ['asthma', 'j45'],
        suggestions: [
            { name: 'Salbutamol inhaler', generic: 'Salbutamol', indication: 'Reliever bronchodilator for asthma symptoms.', dosage: '100 mcg, 2 puffs', route: 'Inhalation', frequency: 'SOS', duration: 'Ongoing / long term', precautions: 'Rising reliever use signals poor control — reassess.', interactions: 'Tachycardia risk additive with other sympathomimetics.' },
            { name: 'Budesonide inhaler', generic: 'Budesonide', indication: 'Controller inhaled corticosteroid for persistent asthma.', dosage: '200 mcg, 1–2 puffs', route: 'Inhalation', frequency: '1-0-1 (BID)', duration: 'Ongoing / long term', precautions: 'Rinse mouth after use to prevent oral candidiasis.', interactions: 'None identified with common regimens.' },
        ],
    },
    {
        match: ['allergic rhinitis', 'rhinitis'],
        suggestions: [
            { name: 'Levocetirizine + Montelukast', generic: 'Levocetirizine + Montelukast', indication: 'First-line combination for allergic rhinitis symptom control.', dosage: '5/10 mg', route: 'Oral', frequency: '0-0-1 (HS)', duration: '2 weeks', precautions: 'Drowsiness possible.', interactions: 'Additive sedation with CNS depressants.' },
        ],
    },
    {
        match: ['dengue', 'a90', 'a91'],
        suggestions: [
            { name: 'Paracetamol', generic: 'Paracetamol', indication: 'Only recommended antipyretic/analgesic in dengue.', dosage: '500–650 mg', route: 'Oral', frequency: '1-1-1 (TID)', duration: 'Until afebrile', precautions: 'STRICTLY AVOID NSAIDs and aspirin (bleeding risk). Monitor platelets and warning signs; ensure hydration.', interactions: 'Avoid combining with other paracetamol-containing products.' },
        ],
    },
    {
        match: ['typhoid', 'enteric fever', 'a01'],
        suggestions: [
            { name: 'Cefixime', generic: 'Cefixime', indication: 'Oral third-generation cephalosporin for uncomplicated enteric fever.', dosage: '200 mg', route: 'Oral', frequency: '1-0-1 (BID)', duration: '14 days', precautions: 'Blood culture before starting where possible; review defervescence at 4–5 days.', interactions: 'None identified with common regimens.' },
        ],
    },
    {
        match: ['iron deficiency', 'anemia', 'anaemia', 'd50'],
        suggestions: [
            { name: 'Ferrous ascorbate + Folic acid', generic: 'Ferrous ascorbate + Folic acid', indication: 'Oral iron repletion for iron-deficiency anemia.', dosage: '100 mg elemental iron', route: 'Oral', frequency: '1-0-0 (OD)', duration: '3 months', precautions: 'Take on empty stomach if tolerated; dark stools expected. Investigate the cause of deficiency.', interactions: 'Separate from levothyroxine, tetracyclines and antacids by 2–4 hours.' },
        ],
    },
    {
        match: ['vitamin d', 'e55'],
        suggestions: [
            { name: 'Cholecalciferol', generic: 'Cholecalciferol', indication: 'Repletion for documented vitamin D deficiency.', dosage: '60,000 IU', route: 'Oral', frequency: 'Once weekly', duration: '8 weeks', precautions: 'Take with a fatty meal; recheck levels after repletion.', interactions: 'None identified with common regimens.' },
        ],
    },
    {
        match: ['loose stool', 'gastroenteritis', 'a09', 'diarrhoea', 'diarrhea', 'loose motion'],
        suggestions: [
            { name: 'Oral Rehydration Salts (ORS)', generic: 'ORS', indication: 'Cornerstone of acute gastroenteritis management — prevent dehydration.', dosage: '1 sachet in 1 L water', route: 'Oral', frequency: 'After each loose stool', duration: 'Until stools settle', precautions: 'Review urgently if blood in stools, high fever, or signs of dehydration.', interactions: 'None.' },
            { name: 'Zinc', generic: 'Zinc sulphate', indication: 'Reduces duration and severity of acute diarrhoea (esp. children).', dosage: '20 mg', route: 'Oral', frequency: '1-0-0 (OD)', duration: '14 days', precautions: 'May cause mild nausea.', interactions: 'Separate from iron and antibiotics by 2 hours.' },
        ],
    },
];

/** Find reference suggestions for a set of diagnosis strings. */
function suggestFor(diagnoses = [], exclude = []) {
    const text = diagnoses.join(' | ').toLowerCase();
    const excluded = exclude.map((e) => String(e).toLowerCase());

    // Most-specific entry first: rank by the longest keyword that matched, so
    // "dengue" beats the generic "fever" entry for "Dengue fever" and its
    // condition-specific precautions (e.g. avoid NSAIDs) are the ones shown.
    const matched = REFERENCE
        .map((entry) => {
            const hits = entry.match.filter((m) => text.includes(m));
            return hits.length ? { entry, specificity: Math.max(...hits.map((h) => h.length)) } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.specificity - a.specificity);

    const out = [];
    const seen = new Set();
    for (const { entry } of matched) {
        for (const s of entry.suggestions) {
            const key = s.name.toLowerCase();
            if (seen.has(key) || excluded.some((e) => key.includes(e) || e.includes(key))) continue;
            seen.add(key);
            out.push({ ...s });
        }
    }
    return out.slice(0, 5);
}

module.exports = { suggestFor };
