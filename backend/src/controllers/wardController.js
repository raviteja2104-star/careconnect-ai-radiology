// Ward Controller — serves bed management, emergency, nurse station, ICU, OT, EMS pages.
// All DEMO_* constants are stable (no Math.random()); returned when DB is disconnected.

const isDBConnected = () => require('mongoose').connection.readyState === 1;

// ─── Demo datasets ────────────────────────────────────────────────────────────

const DEMO_BEDS = {
    stats: { total: 450, occupied: 369, available: 81, occupancyPct: 82 },
    beds: [
        { id: 'W1-101-A', type: 'General',   status: 'Occupied',     patient: 'Rajesh Kumar',  gender: 'M', admitDate: '2 Days ago',  isolation: false },
        { id: 'W1-101-B', type: 'General',   status: 'Available',    patient: null,            gender: null, admitDate: null,         isolation: false },
        { id: 'W1-102-A', type: 'Isolation', status: 'Occupied',     patient: 'Sunil Sharma',  gender: 'M', admitDate: '5 Days ago',  isolation: true  },
        { id: 'W1-103-A', type: 'Private',   status: 'Cleaning',     patient: null,            gender: null, admitDate: null,         isolation: false },
        { id: 'W1-104-A', type: 'Private',   status: 'Maintenance',  patient: null,            gender: null, admitDate: null,         isolation: false },
        { id: 'W1-105-A', type: 'General',   status: 'Reserved',     patient: 'Incoming ADT',  gender: 'F', admitDate: 'ETA 2hrs',   isolation: false },
        { id: 'W2-ICU-1', type: 'ICU',       status: 'Occupied',     patient: 'Vikram Singh',  gender: 'M', admitDate: '1 Day ago',   isolation: false },
        { id: 'W2-ICU-2', type: 'ICU',       status: 'Occupied',     patient: 'Meena Gupta',   gender: 'F', admitDate: '12 Hours ago', isolation: true },
    ],
    wards: [
        { name: 'Intensive Care Unit (ICU)', cap: 20, occ: 19, pct: 95 },
        { name: 'General Medical (Ward 4)',  cap: 60, occ: 52, pct: 86 },
        { name: 'Maternity (Ward 2)',        cap: 40, occ: 28, pct: 70 },
        { name: 'Pediatrics (Ward 3)',       cap: 30, occ: 15, pct: 50 },
    ],
    adtRequests: [
        { kind: 'Admission (ER)', kindTone: 'brand',   time: '10 mins ago', patient: 'Ramesh Kumar (45, M)', detail: 'Req: ICU Bed • Suspected MI • Isolation: No',        cta: 'Allocate Bed (AI)', primary: true  },
        { kind: 'Transfer (Internal)', kindTone: 'warning', time: '25 mins ago', patient: 'Sunita Rao (65, F)',   detail: 'From: ICU-1 • To: General Ward • Oxygen required', cta: 'Review Request',    primary: false },
    ],
};

const DEMO_EMERGENCY = {
    stats: { critical: 3, stable: 2, triageWaiting: 14, averageWaitMins: 28, enRoute: 2 },
    patients: [
        { bed: 'Resus 1',  patient: 'Unknown Male', age: '50s', gender: 'M', esi: 1, complaint: 'Cardiac Arrest',         arrTime: '10:05', status: 'Code Blue',       md: 'Dr. Sharma', rn: 'Nurse Joy',  flags: ['STEMI'] },
        { bed: 'Trauma 2', patient: 'Rohit Verma',  age: '34',  gender: 'M', esi: 1, complaint: 'MVA, Head Trauma',       arrTime: '10:15', status: 'Primary Survey',  md: 'Dr. Anita',  rn: 'Nurse Mark', flags: ['Trauma'] },
        { bed: 'Bed 4',    patient: 'Sunita Rao',   age: '65',  gender: 'F', esi: 2, complaint: 'Left-side weakness',     arrTime: '10:30', status: 'CT Pending',      md: 'Dr. Khan',   rn: 'Nurse Joy',  flags: ['Stroke Alert'] },
        { bed: 'Bed 7',    patient: 'Amit Singh',   age: '45',  gender: 'M', esi: 3, complaint: 'Severe Abdominal Pain',  arrTime: '09:45', status: 'Labs Sent',       md: 'Dr. Khan',   rn: 'Nurse Mary', flags: [] },
        { bed: 'Wait 1',   patient: 'Priya Patel',  age: '28',  gender: 'F', esi: 4, complaint: 'Ankle Sprain',           arrTime: '09:10', status: 'Waiting MD',      md: 'Unassigned', rn: 'Unassigned', flags: [] },
    ],
};

const DEMO_NURSING = {
    stats: { assignedPatients: 8, criticalHighRisk: 2, medsDue: 14, vitalsDue: 6 },
    patients: [
        { bed: 'W4-B12', name: 'Patient A',   age: 32, gender: 'M', diagnosis: 'Acute Appendicitis',    status: 'Post-Op',          risk: 'Medium', ews: 3, nextMed: '14:00',             nextVital: '15:00', ivRunning: true  },
        { bed: 'W4-B14', name: 'Sunita Rao',  age: 65, gender: 'F', diagnosis: 'COPD Exacerbation',     status: 'Oxygen Therapy',   risk: 'High',   ews: 6, nextMed: '13:30 (Overdue)',  nextVital: '14:00', ivRunning: true  },
        { bed: 'W4-B15', name: 'Amit Singh',  age: 45, gender: 'M', diagnosis: 'Dengue Fever',          status: 'Stable',           risk: 'Low',    ews: 1, nextMed: '18:00',             nextVital: '18:00', ivRunning: false },
        { bed: 'W4-B18', name: 'Priya Patel', age: 28, gender: 'F', diagnosis: 'Gastroenteritis',       status: 'Observation',      risk: 'Low',    ews: 0, nextMed: '16:00',             nextVital: '16:00', ivRunning: true  },
    ],
    tasks: [
        { patient: 'Sunita Rao', bed: 'W4-B14', drug: 'Salbutamol Nebulizer', dose: '2.5mg', route: 'Inhalation', time: '13:30', status: 'Overdue' },
        { patient: 'Patient A',  bed: 'W4-B12', drug: 'Ceftriaxone',          dose: '1g',    route: 'IV',         time: '14:00', status: 'Due'     },
        { patient: 'Patient A',  bed: 'W4-B12', drug: 'Paracetamol',          dose: '1g',    route: 'IV',         time: '14:00', status: 'Due'     },
    ],
};

const DEMO_ICU = {
    stats: { census: '18 / 20', onVentilator: 12, onVasopressors: 8, criticalAlerts: 3 },
    patients: [
        { bed: 'ICU-1', patient: 'Rohit S.',  age: 45, status: 'Critical', hr: 112, bp: '85/50',   map: 61,  spo2: 92, rr: 28, temp: 38.5, vent: 'SIMV',  pressor: 'NorAd'       },
        { bed: 'ICU-2', patient: 'Meena G.',  age: 62, status: 'Stable',   hr: 78,  bp: '120/80',  map: 93,  spo2: 98, rr: 16, temp: 37.1, vent: 'CPAP',  pressor: null          },
        { bed: 'ICU-3', patient: 'Anil K.',   age: 55, status: 'Warning',  hr: 95,  bp: '145/90',  map: 108, spo2: 94, rr: 22, temp: 37.8, vent: null,    pressor: null          },
        { bed: 'ICU-4', patient: 'Sunita R.', age: 38, status: 'Critical', hr: 130, bp: '70/40',   map: 50,  spo2: 88, rr: 32, temp: 39.2, vent: 'PRVC',  pressor: 'Adren/NorAd' },
        { bed: 'ICU-5', patient: 'Vikram M.', age: 70, status: 'Stable',   hr: 82,  bp: '130/85',  map: 100, spo2: 96, rr: 18, temp: 36.8, vent: null,    pressor: null          },
        { bed: 'ICU-6', patient: 'Priya P.',  age: 28, status: 'Stable',   hr: 88,  bp: '110/70',  map: 83,  spo2: 99, rr: 14, temp: 37.0, vent: null,    pressor: null          },
    ],
};

const DEMO_OT = {
    stats: { todaySurgeries: 14, runningNow: 4, delayed: 1, availableORs: 3 },
    procedures: [
        { room: 'OR-1 (Cardiac)', patient: 'Arun K. (M/55)',    procedure: 'CABG x3',                        surgeon: 'Dr. R. Sharma', anesthesiologist: 'Dr. V. Patel',    startTime: '08:00 AM', status: 'IntraOp (Bypass)',     expectedEnd: '12:30 PM' },
        { room: 'OR-2 (Ortho)',   patient: 'Smita J. (F/62)',    procedure: 'TKR Right',                      surgeon: 'Dr. A. Gupta',  anesthesiologist: 'Dr. M. Singh',    startTime: '09:30 AM', status: 'IntraOp (Implanting)', expectedEnd: '11:30 AM' },
        { room: 'OR-3 (General)', patient: 'Vikas T. (M/34)',    procedure: 'Laparoscopic Cholecystectomy',   surgeon: 'Dr. P. Nair',   anesthesiologist: 'Dr. S. Reddy',   startTime: '10:00 AM', status: 'Closing',              expectedEnd: '11:00 AM' },
        { room: 'OR-5 (Trauma)',  patient: 'Unknown Male',       procedure: 'Ex-Lap (Trauma)',                surgeon: 'Dr. K. Desai',  anesthesiologist: 'Dr. L. Fernandez', startTime: '10:15 AM', status: 'Critical / Bleeding',  expectedEnd: 'Unknown'  },
    ],
    schedule: [],
};

const DEMO_EMS = {
    stats: { activeIncidents: 8, unitsEnRoute: 4, avgResponseSecs: 522, availableALS: '2 / 5' },
    incidents: [
        { id: 'INC-9912', priority: 'Code 3', complaint: 'Cardiac Arrest',      location: '124 MG Road, Indiranagar', unit: 'ALS-04', status: 'On Scene',          eta: '-',           time: '14:22' },
        { id: 'INC-9913', priority: 'Code 2', complaint: 'MVA, Severe Trauma',  location: 'Ring Road Junction',       unit: 'ALS-01', status: 'En Route',          eta: '4m',          time: '14:35' },
        { id: 'INC-9914', priority: 'Code 2', complaint: 'Suspected Stroke',    location: 'Block B, Koramangala',     unit: 'BLS-08', status: 'Transporting',      eta: '12m (To ED)', time: '14:10' },
        { id: 'INC-9915', priority: 'Code 1', complaint: 'Fall, Hip Pain',      location: 'Sunrise Apts, HSR',        unit: 'Pending', status: 'Awaiting Dispatch', eta: '-',          time: '14:40' },
    ],
    units: [
        { id: 'ALS-01', type: 'ALS', status: 'En Route',  crew: 'Param. Arjun' },
        { id: 'ALS-04', type: 'ALS', status: 'On Scene',  crew: 'Param. Rekha' },
        { id: 'BLS-02', type: 'BLS', status: 'Available', crew: 'EMT Suresh'   },
        { id: 'BLS-08', type: 'BLS', status: 'Transporting', crew: 'John D.'   },
    ],
};

// ─── Handlers ────────────────────────────────────────────────────────────────

exports.getBeds = async (req, res) => {
    try {
        res.json({ success: true, data: DEMO_BEDS });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getEmergency = async (req, res) => {
    try {
        res.json({ success: true, data: DEMO_EMERGENCY });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getNursing = async (req, res) => {
    try {
        res.json({ success: true, data: DEMO_NURSING });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getICU = async (req, res) => {
    try {
        res.json({ success: true, data: DEMO_ICU });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getOT = async (req, res) => {
    try {
        res.json({ success: true, data: DEMO_OT });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getEMS = async (req, res) => {
    try {
        res.json({ success: true, data: DEMO_EMS });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
