/**
 * TeleradiologyIntake — consumes 'RadiologyOrdered' events from the EMR and
 * turns them into RadiologyStudy work items for the teleradiology worklist.
 *
 * Flow per order:
 *   1. Create RadiologyStudy (ORDERED) → immediately simulate DICOM arrival
 *      (RECEIVED → UNREAD) until real modality integration exists.
 *   2. Deterministic AI triage stub flags urgent indications.
 *   3. RadiologyRouting picks a radiologist; unassigned studies stay UNREAD.
 *
 * Publishes: 'StudyReceived', 'AIAnalysisCompleted', 'StudyAssigned'.
 */
const { EventBus } = require('./EventBus');
const EventPublisher = require('./EventPublisher');
const RadiologyStudy = require('../models/RadiologyStudy');
const RadiologyRouting = require('./RadiologyRouting');
const TatEngine = require('./TatEngine');

// Deterministic triage stub — keyword → plausible finding entry.
const TRIAGE_RULES = [
    {
        keywords: ['stroke', 'cva', 'hemiparesis', 'facial droop'],
        finding: 'Possible acute ischemic stroke — early loss of grey-white differentiation',
        confidence: 0.89,
        urgency: 'critical',
    },
    {
        keywords: ['hemorrhage', 'haemorrhage', 'bleed'],
        finding: 'Suspected intracranial/internal hemorrhage — hyperdense focus pattern',
        confidence: 0.92,
        urgency: 'critical',
    },
    {
        keywords: ['embolism', 'embolus', 'pulmonary embol'],
        finding: 'Suspected pulmonary embolism — possible filling defect',
        confidence: 0.86,
        urgency: 'critical',
    },
    {
        keywords: ['trauma', 'fracture', 'accident', 'fall'],
        finding: 'Traumatic injury pattern — possible fracture / internal injury',
        confidence: 0.84,
        urgency: 'high',
    },
    {
        keywords: ['chest pain'],
        finding: 'Acute chest pain workup — possible cardiopulmonary or aortic pathology',
        confidence: 0.78,
        urgency: 'high',
    },
];

function runAiTriage(study) {
    const text = `${study.clinicalIndication || ''} ${study.bodyPart || ''}`.toLowerCase();
    const findings = [];
    for (const rule of TRIAGE_RULES) {
        const hit = rule.keywords.find((kw) => text.includes(kw));
        if (hit) {
            findings.push({
                finding: rule.finding,
                confidence: rule.confidence,
                urgency: rule.urgency,
                reason: `Clinical indication matched keyword '${hit}'`,
            });
        }
    }
    return { processed: true, findings, flagged: findings.length > 0 };
}

class TeleradiologyIntake {
    constructor() {
        this.initialized = false;
    }

    /** Register event subscriptions. Idempotent. */
    init() {
        if (this.initialized) return this;
        EventBus.on('RadiologyOrdered', (envelope) => {
            this.handleRadiologyOrdered(envelope).catch((err) => {
                console.error('[TeleradiologyIntake] Failed to process RadiologyOrdered:', err.message);
            });
        });
        this.initialized = true;
        console.log('[TeleradiologyIntake] Subscribed to RadiologyOrdered');
        return this;
    }

    async handleRadiologyOrdered(envelope) {
        const { data = {}, meta = {} } = envelope || {};
        if (data.category && data.category !== 'radiology') return;

        const details = data.details || {};
        const traceId = meta.traceId;
        const tenantId = meta.tenantId || 't-default';
        const orderedAt = new Date();

        // 1. Create the work item (ORDERED).
        const study = await RadiologyStudy.create({
            clinicalOrderId: data.orderId,
            encounterId: data.encounterId,
            patientId: data.patientId,
            orderingDoctorId: data.orderingDoctorId,
            tenantId,
            modality: details.modality,
            bodyPart: details.bodyPart,
            contrast: !!details.contrast,
            clinicalIndication: details.clinicalIndication,
            priority: data.priority || 'routine',
            status: 'ORDERED',
            tat: { orderedAt },
            traceId,
            auditTrail: [{ action: 'STUDY_CREATED', by: 'system', note: `From order ${data.orderCode || data.orderId}` }],
        });

        // 2. Simulate DICOM arrival (RECEIVED → UNREAD) until modality integration exists.
        await TatEngine.recordMilestone(study._id, 'receivedAt');
        study.status = 'UNREAD';
        study.auditTrail.push({ action: 'STUDY_RECEIVED', by: 'system', note: 'Simulated DICOM arrival (no modality integration yet)' });
        study.auditTrail.push({ action: 'STATUS_UNREAD', by: 'system' });

        await EventPublisher.publish({
            eventType: 'StudyReceived',
            aggregateId: study._id,
            tenantId,
            traceId,
            payload: {
                studyId: study._id,
                accessionNumber: study.accessionNumber,
                studyInstanceUID: study.studyInstanceUID,
                clinicalOrderId: study.clinicalOrderId,
                patientId: study.patientId,
                modality: study.modality,
                bodyPart: study.bodyPart,
                priority: study.priority,
            },
            recipient: { channel: 'INTERNAL' },
        });

        // 3. Deterministic AI triage stub.
        study.aiTriage = runAiTriage(study);
        study.auditTrail.push({
            action: 'AI_TRIAGE_COMPLETED',
            by: 'system',
            note: study.aiTriage.flagged
                ? `Flagged: ${study.aiTriage.findings.map((f) => f.finding).join('; ')}`
                : 'No urgent findings flagged',
        });

        await EventPublisher.publish({
            eventType: 'AIAnalysisCompleted',
            aggregateId: study._id,
            tenantId,
            traceId,
            payload: {
                studyId: study._id,
                accessionNumber: study.accessionNumber,
                flagged: study.aiTriage.flagged,
                findings: study.aiTriage.findings,
            },
            recipient: { channel: 'INTERNAL' },
        });

        // 4. Smart routing — study stays UNREAD/unassigned when no radiologist exists.
        let assignment = null;
        try {
            assignment = await RadiologyRouting.route(study);
        } catch (err) {
            console.error('[TeleradiologyIntake] Routing failed, study stays unassigned:', err.message);
        }

        if (assignment) {
            study.assignedRadiologistId = assignment.radiologist._id;
            study.assignmentReason = assignment.reason;
            study.auditTrail.push({ action: 'STUDY_ASSIGNED', by: 'system', note: assignment.reason });
        } else {
            study.auditTrail.push({ action: 'ASSIGNMENT_SKIPPED', by: 'system', note: 'No radiologist available — awaiting manual claim' });
        }

        await study.save();

        if (assignment) {
            await TatEngine.recordMilestone(study._id, 'assignedAt');
            await EventPublisher.publish({
                eventType: 'StudyAssigned',
                aggregateId: study._id,
                tenantId,
                traceId,
                payload: {
                    studyId: study._id,
                    accessionNumber: study.accessionNumber,
                    assignedRadiologistId: assignment.radiologist._id,
                    reason: assignment.reason,
                    priority: study.priority,
                },
                recipient: { channel: 'INTERNAL' },
            });
        }

        console.log(
            `[TeleradiologyIntake] Study ${study.accessionNumber} (${study.modality} ${study.bodyPart || ''}) intake complete — ` +
                `${assignment ? 'assigned' : 'unassigned'}, aiFlagged=${study.aiTriage.flagged}`
        );
        return study;
    }
}

module.exports = new TeleradiologyIntake();
