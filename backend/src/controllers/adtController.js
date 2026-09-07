const Appointment = require('../models/Appointment');
const PatientTransfer = require('../models/PatientTransfer');
const Encounter = require('../models/Encounter');

const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const todayEnd   = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };

// GET /api/adt/stats
exports.getStats = async (req, res, next) => {
    try {
        const [admissionsToday, pendingDischarges, activeTransfers, currentInpatients] = await Promise.all([
            Appointment.countDocuments({
                date: { $gte: todayStart(), $lte: todayEnd() },
                status: { $in: ['Checked_In', 'Waiting', 'Vitals', 'Doctor_Ready', 'In_Consultation'] },
            }),
            Appointment.countDocuments({
                status: 'Completed',
                date: { $gte: todayStart(), $lte: todayEnd() },
            }),
            PatientTransfer.countDocuments({
                status: { $in: ['REQUESTED', 'WAITING', 'ACCEPTED', 'IN_PROGRESS'] },
            }),
            Encounter.countDocuments({ type: 'ipd', status: { $in: ['open', 'documented'] } }),
        ]);
        res.json({ success: true, data: { admissionsToday, pendingDischarges, activeTransfers, currentInpatients } });
    } catch (err) { next(err); }
};

// GET /api/adt/admissions
exports.getAdmissions = async (req, res, next) => {
    try {
        const admissions = await Appointment.find({
            date: { $gte: todayStart(), $lte: todayEnd() },
            status: { $nin: ['Cancelled', 'Completed'] },
        })
            .populate('patient', 'firstName lastName phone')
            .populate('doctor', 'firstName lastName')
            .sort({ timeSlot: 1 })
            .lean();

        const data = admissions.map(a => ({
            id: a._id,
            patient: a.patient ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.trim() : 'Unknown',
            type: a.visitType || 'In-Person',
            diagnosis: a.reason || '',
            status: a.status,
            priority: a.status === 'Checked_In' || a.status === 'In_Consultation' ? 'High' : 'Medium',
            timeSlot: a.timeSlot,
            doctor: a.doctor ? `Dr. ${a.doctor.firstName || ''} ${a.doctor.lastName || ''}`.trim() : '',
            specialty: a.specialty,
            bedStatus: 'Pending Allocation',
        }));

        res.json({ success: true, data });
    } catch (err) { next(err); }
};

// GET /api/adt/discharges
exports.getDischarges = async (req, res, next) => {
    try {
        const discharges = await Appointment.find({
            status: 'Completed',
            date: { $gte: todayStart(), $lte: todayEnd() },
        })
            .populate('patient', 'firstName lastName')
            .populate('doctor', 'firstName lastName')
            .sort({ updatedAt: -1 })
            .lean();

        const data = discharges.map(a => ({
            id: a._id,
            patient: a.patient ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.trim() : 'Unknown',
            doctor: a.doctor ? `${a.doctor.firstName || ''} ${a.doctor.lastName || ''}`.trim() : '',
            specialty: a.specialty,
            completedAt: a.updatedAt,
            docClear: true,
            nurseClear: false,
            pharmClear: false,
            billClear: false,
        }));

        res.json({ success: true, data });
    } catch (err) { next(err); }
};

// GET /api/adt/transfers
exports.getTransfers = async (req, res, next) => {
    try {
        const transfers = await PatientTransfer.find({
            status: { $in: ['REQUESTED', 'WAITING', 'ACCEPTED', 'IN_PROGRESS', 'ARRIVED'] },
        })
            .populate('patient', 'firstName lastName')
            .populate('requestedBy', 'firstName lastName role')
            .sort({ createdAt: -1 })
            .lean();

        const data = transfers.map(t => ({
            id: t._id,
            patient: t.patientName || (t.patient ? `${t.patient.firstName || ''} ${t.patient.lastName || ''}`.trim() : 'Unknown'),
            fromDepartment: t.fromDepartment,
            toDepartment: t.toDepartment,
            priority: t.priority,
            status: t.status,
            reason: t.clinicalReason || '',
            requestedBy: t.requestedBy ? `${t.requestedBy.firstName || ''} ${t.requestedBy.lastName || ''}`.trim() : '',
            createdAt: t.createdAt,
        }));

        res.json({ success: true, data });
    } catch (err) { next(err); }
};
