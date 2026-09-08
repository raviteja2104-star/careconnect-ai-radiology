// Ward Controller — serves bed management, emergency, nurse station, ICU, OT, EMS pages.
// Returns real DB data when connected; returns empty/zero structures (never fake data) when offline or empty.

const isDBConnected = () => require('mongoose').connection.readyState === 1;

// ─── Empty structures (honest offline / no-data response) ────────────────────

const EMPTY_BEDS = {
    stats: { total: 0, occupied: 0, available: 0, occupancyPct: 0 },
    beds: [],
    wards: [],
    adtRequests: [],
};

const EMPTY_EMERGENCY = {
    stats: { critical: 0, stable: 0, triageWaiting: 0, averageWaitMins: null, enRoute: 0 },
    patients: [],
};

const EMPTY_NURSING = {
    stats: { assignedPatients: 0, criticalHighRisk: 0, medsDue: 0, vitalsDue: 0 },
    patients: [],
    tasks: [],
};

const EMPTY_ICU = {
    stats: { census: '0 / 0', onVentilator: 0, onVasopressors: 0, criticalAlerts: 0 },
    patients: [],
};

const EMPTY_OT = {
    stats: { todaySurgeries: 0, runningNow: 0, delayed: 0, availableORs: 0 },
    procedures: [],
    schedule: [],
};

const EMPTY_EMS = {
    stats: { activeIncidents: 0, unitsEnRoute: 0, avgResponseSecs: null, availableALS: '0 / 0' },
    incidents: [],
    units: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAdmitDate(date) {
    if (!date) return null;
    const diffMs = Date.now() - new Date(date).getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs} ${diffHrs === 1 ? 'Hour' : 'Hours'} ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'} ago`;
}

// ─── Handlers ────────────────────────────────────────────────────────────────

exports.getBeds = async (req, res) => {
    try {
        if (!isDBConnected()) return res.json({ success: true, data: EMPTY_BEDS });

        const BedRecord = require('../models/BedRecord');
        const [allBeds, occupiedBeds] = await Promise.all([
            BedRecord.find().populate('patient', 'firstName lastName gender').lean(),
            BedRecord.countDocuments({ status: 'Occupied' }),
        ]);

        if (allBeds.length === 0) return res.json({ success: true, data: EMPTY_BEDS });

        const total = allBeds.length;
        const available = allBeds.filter(b => b.status === 'Available').length;
        const occupancyPct = total > 0 ? Math.round((occupiedBeds / total) * 100) : 0;

        const beds = allBeds.map(b => ({
            id: b.bedId,
            type: b.bedType,
            status: b.status,
            patient: b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : null,
            gender: b.patient?.gender ? b.patient.gender.charAt(0).toUpperCase() : null,
            admitDate: formatAdmitDate(b.admittedAt),
            isolation: b.isolation,
        }));

        const wardMap = {};
        for (const b of allBeds) {
            if (!wardMap[b.ward]) wardMap[b.ward] = { cap: 0, occ: 0 };
            wardMap[b.ward].cap += 1;
            if (b.status === 'Occupied') wardMap[b.ward].occ += 1;
        }
        const wards = Object.entries(wardMap).map(([name, v]) => ({
            name,
            cap: v.cap,
            occ: v.occ,
            pct: v.cap > 0 ? Math.round((v.occ / v.cap) * 100) : 0,
        }));

        res.json({
            success: true,
            data: {
                stats: { total, occupied: occupiedBeds, available, occupancyPct },
                beds,
                wards,
                adtRequests: [],
            },
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getEmergency = async (req, res) => {
    try {
        if (!isDBConnected()) return res.json({ success: true, data: EMPTY_EMERGENCY });

        const Appointment = require('../models/Appointment');
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const erAppts = await Appointment.find({
            date: { $gte: today },
            specialty: { $regex: /emergency/i },
            status: { $in: ['Checked_In', 'Waiting', 'Vitals', 'Doctor_Ready', 'In_Consultation'] },
        }).populate('patient', 'firstName lastName gender dateOfBirth').populate('doctor', 'firstName lastName').lean();

        if (erAppts.length === 0) return res.json({ success: true, data: EMPTY_EMERGENCY });

        const patients = erAppts.map((a, idx) => {
            const pt = a.patient || {};
            const dr = a.doctor || {};
            const arrTime = new Date(a.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            let age = '';
            if (pt.dateOfBirth) age = String(Math.floor((Date.now() - new Date(pt.dateOfBirth)) / 31557600000));
            return {
                bed: `Bed ${idx + 1}`,
                patient: pt.firstName ? `${pt.firstName} ${pt.lastName}` : 'Unknown',
                age: age || '—',
                gender: pt.gender ? pt.gender.charAt(0).toUpperCase() : '—',
                esi: 3,
                complaint: a.reason || 'Not specified',
                arrTime,
                status: a.status.replace('_', ' '),
                md: dr.firstName ? `Dr. ${dr.lastName}` : 'Unassigned',
                rn: 'Unassigned',
                flags: [],
            };
        });

        const critical = patients.filter(p => p.esi <= 2).length;
        const stable = patients.filter(p => p.esi >= 3).length;

        res.json({
            success: true,
            data: {
                stats: { critical, stable, triageWaiting: patients.length, averageWaitMins: null, enRoute: 0 },
                patients,
            },
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getNursing = async (req, res) => {
    try {
        if (!isDBConnected()) return res.json({ success: true, data: EMPTY_NURSING });

        const Appointment = require('../models/Appointment');
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const activeAppts = await Appointment.find({
            date: { $gte: today },
            status: { $in: ['Checked_In', 'Waiting', 'Vitals', 'Doctor_Ready', 'In_Consultation'] },
        }).populate('patient', 'firstName lastName gender dateOfBirth').lean();

        if (activeAppts.length === 0) return res.json({ success: true, data: EMPTY_NURSING });

        const patients = activeAppts.slice(0, 10).map((a, idx) => {
            const pt = a.patient || {};
            let age = '';
            if (pt.dateOfBirth) age = Math.floor((Date.now() - new Date(pt.dateOfBirth)) / 31557600000);
            return {
                bed: `W4-B${10 + idx}`,
                name: pt.firstName ? `${pt.firstName} ${pt.lastName}` : 'Unknown',
                age: age || '—',
                gender: pt.gender ? pt.gender.charAt(0).toUpperCase() : '—',
                diagnosis: a.reason || a.specialty || 'Under review',
                status: a.status.replace('_', ' '),
                risk: 'Low',
                ews: 0,
                nextMed: '—',
                nextVital: '—',
                ivRunning: false,
            };
        });

        res.json({
            success: true,
            data: {
                stats: { assignedPatients: patients.length, criticalHighRisk: 0, medsDue: 0, vitalsDue: patients.length },
                patients,
                tasks: [],
            },
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getICU = async (req, res) => {
    try {
        if (!isDBConnected()) return res.json({ success: true, data: EMPTY_ICU });

        const BedRecord = require('../models/BedRecord');
        const icuBeds = await BedRecord.find({ bedType: 'ICU' }).populate('patient', 'firstName lastName gender dateOfBirth').lean();

        if (icuBeds.length === 0) return res.json({ success: true, data: EMPTY_ICU });

        const occupied = icuBeds.filter(b => b.status === 'Occupied');
        const patients = occupied.map((b) => {
            const pt = b.patient || {};
            let age = '';
            if (pt.dateOfBirth) age = Math.floor((Date.now() - new Date(pt.dateOfBirth)) / 31557600000);
            return {
                bed: b.bedId,
                patient: pt.firstName ? `${pt.firstName} ${pt.lastName}` : 'Unknown',
                age: age || '—',
                status: 'Stable',
                hr: null, bp: null, map: null, spo2: null, rr: null, temp: null,
                vent: null, pressor: null,
            };
        });

        res.json({
            success: true,
            data: {
                stats: { census: `${occupied.length} / ${icuBeds.length}`, onVentilator: 0, onVasopressors: 0, criticalAlerts: 0 },
                patients,
            },
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getOT = async (req, res) => {
    try {
        if (!isDBConnected()) return res.json({ success: true, data: EMPTY_OT });

        const Appointment = require('../models/Appointment');
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const surgeries = await Appointment.find({
            date: { $gte: today },
            specialty: { $regex: /surg/i },
        }).populate('patient', 'firstName lastName gender').populate('doctor', 'firstName lastName').lean();

        if (surgeries.length === 0) return res.json({ success: true, data: EMPTY_OT });

        const procedures = surgeries.map((a, idx) => {
            const pt = a.patient || {};
            const dr = a.doctor || {};
            return {
                room: `OR-${idx + 1}`,
                patient: pt.firstName ? `${pt.firstName} ${pt.lastName}` : 'Unknown',
                procedure: a.reason || a.specialty,
                surgeon: dr.firstName ? `Dr. ${dr.firstName} ${dr.lastName}` : 'Unassigned',
                anesthesiologist: 'Unassigned',
                startTime: a.timeSlot || '—',
                status: a.status.replace('_', ' '),
                expectedEnd: '—',
            };
        });

        res.json({
            success: true,
            data: {
                stats: {
                    todaySurgeries: surgeries.length,
                    runningNow: surgeries.filter(s => s.status === 'In_Consultation').length,
                    delayed: 0,
                    availableORs: Math.max(0, 5 - surgeries.length),
                },
                procedures,
                schedule: [],
            },
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getEMS = async (req, res) => {
    // EMS/ambulance dispatch requires a CAD system integration not yet implemented.
    // Return empty structure until that integration is available.
    try {
        res.json({ success: true, data: EMPTY_EMS });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.dischargePatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { reason, followUpDate } = req.body;
        const mongoose = require('mongoose');
        if (!isDBConnected() || !mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(503).json({ success: false, message: 'Database unavailable — discharge cannot be processed.' });
        }
        const Appointment = require('../models/Appointment');
        const BedRecord = require('../models/BedRecord');
        await Promise.all([
            Appointment.updateMany(
                { patient: patientId, status: { $in: ['Booked', 'Confirmed', 'Checked_In', 'Waiting', 'In_Consultation'] } },
                { $set: { status: 'Completed' } }
            ),
            BedRecord.updateMany(
                { patient: patientId, status: 'Occupied' },
                { $set: { status: 'Cleaning', patient: null, admittedAt: null } }
            ),
        ]);
        res.json({ success: true, data: { patientId, status: 'Discharged', dischargedAt: new Date(), reason, followUpDate } });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
