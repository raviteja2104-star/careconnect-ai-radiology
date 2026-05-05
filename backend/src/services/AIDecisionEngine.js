/**
 * AI Decision Engine
 * Orchestrates the intelligent routing, triage, and escalation logic.
 * Subscribes to events from the EventBus.
 */
const { EventBus, emitEvent } = require('./EventBus');
const EVENTS = require('../config/events');

class AIDecisionEngine {
    constructor() {
        this.initializeListeners();
    }

    initializeListeners() {
        // 1. Smart Triage & Symptom Evaluation
        EventBus.on(EVENTS.AI_SYMPTOM_EVALUATED, this.handleSymptomEvaluation.bind(this));
        
        // 2. Radiology Scan Analysis
        EventBus.on(EVENTS.AI_SCAN_ANALYZED, this.handleScanAnalysis.bind(this));

        // 3. Lab Results Processing
        EventBus.on(EVENTS.LAB_RESULTS_UPLOADED, this.handleLabResults.bind(this));
    }

    /**
     * Handles the "Smart Triage Loop"
     */
    async handleSymptomEvaluation(event) {
        const { patientId, symptoms, riskScore } = event.data;
        
        console.log(`[AI Engine] Evaluating symptoms for patient ${patientId} | Score: ${riskScore}`);

        if (riskScore >= 90) {
            // CRITICAL JOURNEY (e.g., Cardiac Case)
            console.log(`[AI Engine] 🚨 CRITICAL RISK DETECTED (${riskScore}). Triggering Emergency Protocol.`);
            emitEvent(EVENTS.EMERGENCY_TRIGGERED, {
                patientId,
                reason: 'AI_CRITICAL_SYMPTOMS',
                symptoms,
                autoDispatch: true
            }, { origin: 'AIDecisionEngine' });
        } 
        else if (riskScore >= 60) {
            // ESCALATING CASE
            console.log(`[AI Engine] ⚠️ MEDIUM/HIGH RISK DETECTED. Recommending immediate consultation.`);
            // In a real system, we might push a notification or auto-book a slot.
        } else {
            // LOW RISK
            console.log(`[AI Engine] 🟢 LOW RISK. Suggesting self-care and monitoring.`);
        }
    }

    /**
     * Handles the "Lab -> Radiology Intelligent Routing Flow"
     */
    async handleScanAnalysis(event) {
        const { scanId, patientId, findings, riskLevel, confidence } = event.data;
        
        console.log(`[AI Engine] Post-processing Scan ${scanId}. AI Risk: ${riskLevel}`);

        if (riskLevel === 'critical' || riskLevel === 'high') {
            console.log(`[AI Engine] 🚨 Critical Scan findings detected. Auto-escalating.`);
            emitEvent(EVENTS.RADIOLOGY_REPORT_FINALIZED, {
                scanId,
                patientId,
                status: 'critical_findings',
                findings
            });

            // Trigger emergency if confidence is very high
            if (confidence > 0.90) {
                 emitEvent(EVENTS.EMERGENCY_TRIGGERED, {
                    patientId,
                    scanId,
                    reason: 'AI_CRITICAL_SCAN_FINDING',
                    findings
                }, { origin: 'AIDecisionEngine' });
            }
        }
    }

    /**
     * Simulates processing lab results for abnormalities
     */
    async handleLabResults(event) {
        const { labId, patientId, results } = event.data;
        
        // Mock logic: check for abnormal flags
        const hasAbnormalities = results.some(r => r.isAbnormal);

        if (hasAbnormalities) {
            console.log(`[AI Engine] ⚠️ Abnormal Lab Results detected for patient ${patientId}.`);
            emitEvent(EVENTS.LAB_RESULTS_ABNORMAL, {
                patientId,
                labId,
                recommendation: 'TRIGGER_RADIOLOGY_SCAN' // Intelligent routing
            });
        }
    }
}

// Instantiate to start listening
const engine = new AIDecisionEngine();

module.exports = engine;
