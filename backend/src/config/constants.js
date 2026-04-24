module.exports = {
    ROLES: {
        PATIENT: 'patient',
        DOCTOR: 'doctor',
        RADIOLOGIST: 'radiologist',
        ADMIN: 'admin',
        LAB_TECH: 'lab_tech',
    },

    SCAN_TYPES: {
        CT: 'CT',
        MRI: 'MRI',
        XRAY: 'XRAY',
    },

    SCAN_STATUS: {
        UPLOADED: 'uploaded',
        AI_PROCESSING: 'ai_processing',
        AI_COMPLETED: 'ai_completed',
        RADIOLOGIST_REVIEW: 'radiologist_review',
        REVIEWED: 'reviewed',
        APPROVED: 'approved',
        REJECTED: 'rejected',
    },

    RISK_LEVELS: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical',
    },

    PRIORITY: {
        NORMAL: 'normal',
        URGENT: 'urgent',
        EMERGENCY: 'emergency',
    },

    CONSULTATION_STATUS: {
        PENDING: 'pending',
        ACTIVE: 'active',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
    },

    EMERGENCY_STATUS: {
        TRIGGERED: 'triggered',
        DISPATCHED: 'dispatched',
        EN_ROUTE: 'en_route',
        ARRIVED: 'arrived',
        RESOLVED: 'resolved',
    },
};
