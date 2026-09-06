const ConsentDocument = require('../models/ConsentDocument');
const User = require('../models/User');
const EventPublisher = require('../services/EventPublisher');
const { v4: uuidv4 } = require('uuid');

// @desc    Create a new consent request
// @route   POST /api/consents
exports.requestConsent = async (req, res) => {
  try {
    const { patientId, appointmentId, templateId, title, content, language } = req.body;
    
    const consent = await ConsentDocument.create({
      patient: patientId,
      appointment: appointmentId,
      templateId,
      title,
      content,
      language,
      status: 'REQUESTED'
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('CONSENT_REQUESTED', { consent });
    }

    const patient = await User.findById(patientId);

    await EventPublisher.publish({
      eventType: 'ConsentRequested',
      version: '1.0',
      aggregateId: consent._id.toString(),
      tenantId: req.headers['x-tenant-id'] || 't-default',
      traceId: req.headers['x-trace-id'] || uuidv4(),
      payload: {
        title: consent.title,
        consentId: consent._id.toString()
      },
      recipient: {
        id: patientId.toString(),
        phone: patient ? patient.phone : '+15550001234',
        email: patient ? patient.email : 'patient@example.com',
        preferences: { sms: true, email: true, whatsapp: true, push: false }
      }
    });

    res.status(201).json({ success: true, data: consent });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Sign a consent document
// @route   POST /api/consents/:id/sign
exports.signConsent = async (req, res) => {
  try {
    const { id } = req.params;
    const { signerType, signerName, signatureData } = req.body;

    const consent = await ConsentDocument.findById(id);
    if (!consent) return res.status(404).json({ success: false, error: 'Consent not found' });

    // Ownership check: patients may only sign their own consent documents.
    // Clinical staff (doctor, admin, nurse) may co-sign as authorised witnesses.
    const STAFF_ROLES = ['doctor', 'admin', 'nurse', 'radiologist'];
    const callerIsStaff = STAFF_ROLES.includes(req.user?.role);
    if (!callerIsStaff && consent.patient.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ success: false, error: 'You may only sign your own consent documents.' });
    }

    consent.signatures.push({
      signerType,
      signerName,
      signatureData,
      signedAt: Date.now(),
      ipAddress: req.ip || '127.0.0.1'
    });

    consent.status = 'SIGNED';
    // Mock hash generation
    consent.documentHash = 'sha256-' + Date.now().toString();
    await consent.save();

    if (req.app.get('io')) {
      req.app.get('io').emit('CONSENT_SIGNED', { consent });
    }

    const patient = await User.findById(consent.patient);

    await EventPublisher.publish({
      eventType: 'ConsentSigned',
      version: '1.0',
      aggregateId: consent._id.toString(),
      tenantId: req.headers['x-tenant-id'] || 't-default',
      traceId: req.headers['x-trace-id'] || uuidv4(),
      payload: {
        title: consent.title,
        documentHash: consent.documentHash
      },
      recipient: {
        id: consent.patient.toString(),
        phone: patient ? patient.phone : '+15550001234',
        email: patient ? patient.email : 'patient@example.com',
        preferences: { sms: false, email: true, whatsapp: true, push: false }
      }
    });

    res.json({ success: true, data: consent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all consents for a patient or system-wide
// @route   GET /api/consents
exports.getConsents = async (req, res) => {
  try {
    const { patientId } = req.query;
    const filter = patientId ? { patient: patientId } : {};
    const consents = await ConsentDocument.find(filter)
      .populate('patient', 'name phone uhid')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: consents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
