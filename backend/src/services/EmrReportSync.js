const { EventBus } = require('./EventBus');
const EventPublisher = require('./EventPublisher');

/**
 * EmrReportSync — closes the EMR ↔ teleradiology loop.
 *
 * On ReportSigned:
 *   1. Complete the originating ClinicalOrder (resultRef → RadiologyStudy).
 *   2. Notify the ordering doctor and the patient (in-app Notification).
 *   3. Publish PatientNotified for downstream channels (wallet, comms).
 *
 * Idempotent: an already-completed order is left untouched, so replayed
 * events cannot double-notify.
 */
class EmrReportSync {
    init() {
        if (this._initialized) return;
        this._initialized = true;

        EventBus.on('ReportSigned', async (envelope) => {
            const data = envelope?.data || {};
            const traceId = envelope?.meta?.traceId;
            try {
                await this.handleReportSigned(data, traceId);
            } catch (err) {
                console.error(`[EmrReportSync] Failed to sync signed report ${data.studyId}:`, err.message);
            }
        });

        console.log('[EmrReportSync] Subscribed to ReportSigned.');
    }

    async handleReportSigned(data, traceId) {
        const ClinicalOrder = require('../models/ClinicalOrder');
        const Notification = require('../models/Notification');

        const { studyId, accessionNumber, clinicalOrderId, patientId, signedBy, impression } = data;
        if (!studyId) return;

        let order = null;
        if (clinicalOrderId) {
            order = await ClinicalOrder.findById(clinicalOrderId);
            if (order && !['completed', 'cancelled'].includes(order.status)) {
                order.status = 'completed';
                order.resultRef = { model: 'RadiologyStudy', id: studyId };
                order.auditTrail.push({
                    action: 'completed',
                    by: signedBy,
                    note: `Radiology report signed (${accessionNumber || studyId})`,
                });
                await order.save();
            } else if (order && order.status === 'completed') {
                // Replayed event — already synced, skip notifications too.
                return;
            }
        }

        const doctorId = order?.orderingDoctorId;
        const summary = impression
            ? String(impression).slice(0, 240)
            : 'The radiology report for your study has been signed.';

        const notifications = [];
        if (doctorId) {
            notifications.push({
                userId: doctorId,
                type: 'report_approved',
                title: `Radiology report signed — ${accessionNumber || 'study'}`,
                message: summary,
                data: { studyId, clinicalOrderId, accessionNumber, patientId },
            });
        }
        if (patientId) {
            notifications.push({
                userId: patientId,
                type: 'report_reviewed',
                title: 'Your imaging report is ready',
                message: 'A radiologist has signed your imaging report. It is now available in your health records.',
                data: { studyId, accessionNumber },
            });
        }
        if (notifications.length) {
            await Notification.insertMany(notifications);
        }

        await EventPublisher.publish({
            eventType: 'PatientNotified',
            aggregateId: studyId,
            traceId,
            payload: {
                studyId,
                accessionNumber,
                clinicalOrderId,
                patientId,
                doctorId,
                channel: 'IN_APP',
            },
            recipient: { channel: 'INTERNAL' },
        });
    }
}

module.exports = new EmrReportSync();
