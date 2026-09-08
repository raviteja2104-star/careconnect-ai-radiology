const Appointment = require('../models/Appointment');
const Encounter = require('../models/Encounter');

const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const todayEnd   = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };

// GET /api/consultations/today
exports.getToday = async (req, res, next) => {
    try {
        const appts = await Appointment.find({
            date: { $gte: todayStart(), $lte: todayEnd() },
            status: { $nin: ['Cancelled'] },
        })
            .populate('patient', 'firstName lastName phone')
            .populate('doctor', 'firstName lastName')
            .sort({ timeSlot: 1 })
            .lean();

        const patientIds = appts.map(a => a.patient?._id).filter(Boolean);
        const encounters = await Encounter.find({
            patientId: { $in: patientIds },
            createdAt: { $gte: todayStart(), $lte: todayEnd() },
        }).lean();

        const encounterByPatient = {};
        for (const enc of encounters) {
            encounterByPatient[enc.patientId.toString()] = enc;
        }

        const statusMap = {
            Booked: 'Pending Review',
            Confirmed: 'Pending Review',
            Checked_In: 'Pending Review',
            Waiting: 'Pending Review',
            Vitals: 'In Progress',
            Doctor_Ready: 'In Progress',
            In_Consultation: 'In Progress',
            Completed: 'Completed',
        };

        const data = appts.map((a, idx) => {
            const enc = a.patient ? encounterByPatient[a.patient._id.toString()] : null;
            const patientName = a.patient
                ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.trim()
                : 'Unknown';
            const primaryDiag = enc?.diagnoses?.find(d => d.isPrimary) || enc?.diagnoses?.[0];
            const latestVitals = enc?.vitals?.[enc.vitals.length - 1];

            return {
                id: a._id,
                encounterId: enc?._id || null,
                token: `A-${String(idx + 1).padStart(2, '0')}`,
                patientName,
                patientMrn: `MRN-${a.patient?._id?.toString().slice(-7).toUpperCase() || '0000000'}`,
                patientAge: null,
                patientGender: '',
                appointmentTime: a.timeSlot,
                type: a.visitType || 'OPD',
                status: statusMap[a.status] || 'Pending Review',
                chiefComplaint: enc?.chiefComplaint || a.reason || '',
                doctor: a.doctor ? `Dr. ${a.doctor.firstName || ''} ${a.doctor.lastName || ''}`.trim() : '',
                department: a.specialty,
                diagnosis: primaryDiag?.term || '',
                soap: enc ? {
                    subjective: enc.chiefComplaint || '',
                    objective: latestVitals ? `BP ${latestVitals.systolicBp || '-'}/${latestVitals.diastolicBp || '-'}, HR ${latestVitals.pulse || '-'}, Temp ${latestVitals.temperatureC || '-'}°C, SpO2 ${latestVitals.spo2 || '-'}%` : '',
                    assessment: enc.diagnoses?.map(d => `${d.term}${d.code ? ` (${d.code})` : ''}`).join('; ') || '',
                    plan: '',
                } : null,
                vitals: latestVitals ? {
                    bp: latestVitals.systolicBp ? `${latestVitals.systolicBp}/${latestVitals.diastolicBp}` : null,
                    hr: latestVitals.pulse || null,
                    temp: latestVitals.temperatureC || null,
                    spo2: latestVitals.spo2 || null,
                    rr: latestVitals.respiratoryRate || null,
                } : null,
            };
        });

        res.json({ success: true, data });
    } catch (err) { next(err); }
};

// PATCH /api/consultations/:id/soap  — save SOAP draft to Encounter
exports.saveSoap = async (req, res) => {
    try {
        const { id } = req.params;
        const { soap } = req.body;
        if (!soap || typeof soap !== 'object') {
            return res.status(400).json({ success: false, message: 'soap object is required.' });
        }
        const mongoose = require('mongoose');
        let enc = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            enc = await Encounter.findById(id);
            if (!enc) {
                enc = await Encounter.findOne({ appointmentId: id });
            }
        }
        if (!enc) {
            // No encounter yet — create one attached to this appointment
            const patientId = req.body.patientId;
            if (!patientId) {
                return res.status(400).json({ success: false, message: 'No encounter found and patientId is required to create one.' });
            }
            enc = await Encounter.create({
                appointmentId: mongoose.Types.ObjectId.isValid(id) ? id : undefined,
                patientId,
                doctorId: req.user._id,
                type: 'opd',
                specialty: 'General Medicine',
                chiefComplaint: soap.subjective || '',
                status: 'open',
            });
        }
        enc.soapDraft = soap;
        await enc.save();
        res.json({ success: true, data: enc });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// POST /api/consultations/:id/sign — finalise & mark encounter signed
exports.signNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { soap } = req.body;
        const mongoose = require('mongoose');
        let enc = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            enc = await Encounter.findById(id);
            if (!enc) enc = await Encounter.findOne({ appointmentId: id });
        }
        if (!enc) {
            return res.status(404).json({ success: false, message: 'Encounter not found. Save a draft first.' });
        }
        if (soap) enc.soapDraft = soap;
        enc.status = 'signed';
        enc.signedAt = new Date();
        enc.signedBy = req.user._id;
        await enc.save();
        // Also mark the appointment completed
        const Appointment = require('../models/Appointment');
        await Appointment.findByIdAndUpdate(enc.appointmentId, { status: 'Completed' }).catch(() => {});
        res.json({ success: true, data: enc });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
