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
