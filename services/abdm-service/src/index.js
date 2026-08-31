const express = require('express');
const { PatientMapper, PractitionerMapper, EncounterMapper, ConditionMapper, MedicationRequestMapper } = require('./fhir/mapper');
const gateway = require('./abdm/gateway');

const app = express();
app.use(express.json());

// Chaos Engineering Middleware
app.use(async (req, res, next) => {
  const latency = req.headers['x-chaos-latency'];
  if (latency) {
    console.log(`[Chaos] Injecting ${latency}ms latency for ${req.path}`);
    await new Promise(r => setTimeout(r, parseInt(latency, 10)));
  }
  next();
});

// Health Check
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'abdm-service' }));

// MOCK: Endpoint mimicking the HIU requesting a FHIR Patient Resource
app.post('/api/fhir/patient/export', async (req, res) => {
  const { patientId } = req.body;
  
  try {
    // In reality, this would fetch from monolith API over the network
    // For now, we mock the monolith's response
    const mockInternalPatient = {
      _id: patientId || '12345',
      name: 'Rohit Sharma',
      gender: 'M',
      dob: '1990-05-15',
      contact: {
        phone: '+919876543210',
        email: 'rohit@example.com'
      }
    };

    // Use our mapper to convert internal schema to FHIR R4 Patient Resource
    const fhirPatient = PatientMapper.toFHIR(mockInternalPatient);

    res.json({
      success: true,
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{ resource: fhirPatient }]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fhir/Patient/:id', async (req, res) => {
  const patientId = req.params.id;
  if (patientId === 'INVALID_ID') return res.status(404).json({ error: 'Not found' });
  
  const mockInternalPatient = { _id: patientId, name: 'Jane FHIR', gender: 'F', dob: '1988-02-14' };
  res.json(PatientMapper.toFHIR(mockInternalPatient));
});

// MOCK: Endpoint mimicking HIU requesting a full Clinical Encounter Bundle
app.post('/api/fhir/encounter/export', async (req, res) => {
  const { encounterId } = req.body;
  
  try {
    // 1. Mock Database Fetching
    const mockEncounter = {
      _id: encounterId || 'ENC-999',
      status: 'COMPLETED',
      type: 'TELEMEDICINE',
      startTime: '2026-08-03T10:00:00Z',
      endTime: '2026-08-03T10:30:00Z',
      patientId: 'PAT-123',
      doctorId: 'DOC-456'
    };
    
    const mockPatient = {
      _id: mockEncounter.patientId,
      name: 'Amit Patel',
      gender: 'M',
      dob: '1985-08-20'
    };
    
    const mockDoctor = {
      _id: mockEncounter.doctorId,
      name: 'Sunita Sharma',
      licenseNumber: 'MCI-889900',
      specialty: 'Cardiology'
    };

    const mockDiagnosis = {
      _id: 'DIAG-001',
      name: 'Essential (primary) hypertension',
      icd10Code: 'I10',
      dateRecorded: '2026-08-03T10:15:00Z'
    };

    const mockPrescription = {
      _id: 'RX-001',
      medicationName: 'Amlodipine 5mg Tablet',
      dosage: 'Take 1 tablet by mouth daily',
      frequencyPerDay: 1,
      durationDays: 30
    };

    // 2. Map to FHIR
    const fhirPatient = PatientMapper.toFHIR(mockPatient);
    const fhirPractitioner = PractitionerMapper.toFHIR(mockDoctor);
    const fhirEncounter = EncounterMapper.toFHIR(mockEncounter, mockPatient._id, mockDoctor._id);
    const fhirCondition = ConditionMapper.toFHIR(mockDiagnosis, mockPatient._id, mockEncounter._id);
    const fhirMedicationRequest = MedicationRequestMapper.toFHIR(mockPrescription, mockPatient._id, mockEncounter._id, mockDoctor._id);

    // 3. Assemble FHIR Document Bundle
    const bundle = {
      resourceType: 'Bundle',
      type: 'document',
      timestamp: new Date().toISOString(),
      entry: [
        { resource: fhirEncounter },
        { resource: fhirPatient },
        { resource: fhirPractitioner },
        { resource: fhirCondition },
        { resource: fhirMedicationRequest }
      ]
    };

    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const consents = new Map();

// Official ABDM Webhook: CM Notifies HIP of Consent Granted/Revoked
app.post('/v0.5/consents/hip/notify', (req, res) => {
  const { requestId, notification } = req.body;
  
  if (!notification || !notification.consentId || !notification.status) {
    return res.status(400).json({ error: 'Invalid notification payload' });
  }

  const { consentId, status, consentDetail } = notification;

  console.log(`[ABDM Webhook] Received HIP Consent Notification. ID: ${consentId}, Status: ${status}`);

  // In a real system, we verify the 'signature' from the CM here to prevent spoofing.

  // Store the consent status and details in our local DB
  consents.set(consentId, {
    status: status,
    patientId: consentDetail?.patient?.id,
    careContexts: consentDetail?.careContexts || [],
    expiry: consentDetail?.permission?.dataEraseAt,
    updatedAt: new Date().toISOString()
  });

  // Acknowledge receipt immediately (ABDM requires HTTP 202 Accepted)
  res.status(202).send();

  // Asynchronously send the 'on-notify' callback back to the ABDM Gateway
  gateway.acknowledgeHipNotification(requestId, consentId);
});

// Official ABDM Webhook: CM Notifies HIU of Consent Granted/Revoked
app.post('/v0.5/consents/hiu/notify', (req, res) => {
  const { requestId, notification } = req.body;
  
  if (!notification || !notification.consentRequestId || !notification.status) {
    return res.status(400).json({ error: 'Invalid notification payload' });
  }

  console.log(`[ABDM Webhook] Received HIU Consent Notification. Request ID: ${notification.consentRequestId}, Status: ${notification.status}`);
  
  const affectedConsentIds = [];
  if (notification.status === 'GRANTED' || notification.status === 'REVOKED') {
    notification.consentArtefacts.forEach(artifact => {
      consents.set(artifact.id, { status: notification.status, isHIU: true });
      affectedConsentIds.push(artifact.id);
    });
  }

  res.status(202).send();

  gateway.acknowledgeHiuNotification(requestId, affectedConsentIds);
});

// Mock endpoint to trigger an outbound data fetch (HIU role)
app.post('/api/abdm/exchange/fetch', (req, res) => {
  const consent = consents.get(req.body.consentId);
  if (!consent || consent.status === 'REVOKED') {
    return res.status(403).json({ error: 'Consent invalid or revoked' });
  }
  res.status(200).json({ status: 'Data fetch initiated' });
});

const PORT = process.env.PORT || 5005;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[ABDM Service] Running on port ${PORT}`);
  });
}

module.exports = app;
