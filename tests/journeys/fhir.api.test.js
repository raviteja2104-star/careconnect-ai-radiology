const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const ABDM_URL = process.env.ABDM_URL || 'http://localhost:5005/api/abdm';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

describe('ABDM & FHIR Interoperability (RC3 Sprint 2.3)', () => {
  let traceId;
  let state;
  let client;

  beforeAll(() => {
    traceId = uuidv4();
    client = axios.create({
      headers: {
        'x-trace-id': traceId,
        'x-tenant-id': 't-default'
      }
    });

    state = {
      patientId: null,
      consentId: null,
      abhaAddress: 'jane.doe@sbx'
    };
  });

  // ============================================
  // TRACK 1 & 2: FHIR SEMANTIC & ACL VALIDATION
  // ============================================
  describe('Anti-Corruption Layer (ACL) FHIR Exports', () => {
    beforeAll(async () => {
      // Seed a patient for export
      const p = await client.post(`${BACKEND_URL}/patients`, {
        name: 'Jane FHIR', email: 'jane.fhir@example.com', phone: '+919999999999', gender: 'F', dob: '1988-02-14'
      });
      state.patientId = p.data._id;
    });

    it('should correctly map internal Patient to FHIR R4 Patient', async () => {
      const response = await client.get(`${ABDM_URL}/fhir/Patient/${state.patientId}`);
      expect(response.status).toBe(200);
      
      const fhirPatient = response.data;
      expect(fhirPatient.resourceType).toBe('Patient');
      expect(fhirPatient.id).toBeDefined();
      expect(fhirPatient.name[0].text).toBe('Jane FHIR');
      expect(fhirPatient.gender).toBe('female'); // Validating FHIR semantic coding
      expect(fhirPatient._internalField).toBeUndefined(); // Validating ACL boundary
    });

    it('should return 404 for missing FHIR resources', async () => {
      try {
        await client.get(`${ABDM_URL}/fhir/Patient/INVALID_ID`);
        fail('Should have thrown 404');
      } catch (err) {
        expect(err.response.status).toBe(404);
      }
    });
  });

  // ============================================
  // TRACK 3: CONSENT WORKFLOW
  // ============================================
  describe('Consent Flow & External Request', () => {
    it('should request health record consent from a patient', async () => {
      const response = await client.post(`${ABDM_URL}/consent/request`, {
        patientId: state.patientId,
        purpose: 'CAREMGT', // Care Management
        hiTypes: ['DiagnosticReport', 'Prescription'],
        permission: {
          accessMode: 'VIEW',
          dataEraseAt: new Date(Date.now() + 86400000 * 30).toISOString() // 30 days
        }
      });
      
      expect(response.status).toBe(201);
      state.consentId = response.data.consentId;
      expect(response.data.status).toBe('REQUESTED');
    });

    it('should approve the consent scope', async () => {
      const response = await client.post(`${ABDM_URL}/consent/${state.consentId}/approve`, {
        linkedRecords: ['REC-1', 'REC-2']
      });
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('GRANTED');
    });

    it('should execute FHIR Exchange using granted consent', async () => {
      const response = await client.post(`${ABDM_URL}/exchange/fetch`, {
        consentId: state.consentId
      });
      
      expect(response.status).toBe(200);
      expect(response.data.bundles.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // TRACK 4: NEGATIVE SCENARIOS
  // ============================================
  describe('Failure Handling & Revocation', () => {
    it('should successfully revoke an active consent', async () => {
      const response = await client.post(`${ABDM_URL}/consent/${state.consentId}/revoke`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('REVOKED');
    });

    it('should reject FHIR exchange attempt on revoked consent', async () => {
      try {
        await client.post(`${ABDM_URL}/exchange/fetch`, { consentId: state.consentId });
        fail('Should have thrown 403');
      } catch (err) {
        expect(err.response.status).toBe(403);
        expect(err.response.data.error).toMatch(/Consent revoked/i);
      }
    });
  });

});
