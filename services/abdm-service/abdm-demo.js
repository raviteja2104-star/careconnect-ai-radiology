const axios = require('axios');
const app = require('./src/index');

const PORT = 5006;
let server;

async function runDemo() {
  console.log("=== CareConnect ABDM Integration Demo ===\n");
  
  server = app.listen(PORT, () => {
    console.log(`[Demo] Test Server running on port ${PORT}\n`);
  });

  const client = axios.create({ baseURL: `http://localhost:${PORT}` });

  try {
    console.log("--- 1. Simulating Consent Manager Webhook (HIP Notify) ---");
    const webhookPayload = {
      requestId: "req-111-222-333",
      timestamp: new Date().toISOString(),
      notification: {
        status: "GRANTED",
        consentId: "CONSENT-999",
        consentDetail: {
          patient: { id: "amit@sbx" },
          careContexts: [{ patientReference: "PAT-123", careContextReference: "ENC-999" }],
          permission: { dataEraseAt: "2026-09-03T10:00:00Z" }
        }
      }
    };
    
    console.log("Sending Webhook Payload from NHA Sandbox...");
    const notifyRes = await client.post('/v0.5/consents/hip/notify', webhookPayload);
    console.log(`Received Response Status: ${notifyRes.status} (202 Expected)\n`);

    // Wait a brief moment to allow the async outbound acknowledgment to fire
    await new Promise(r => setTimeout(r, 200));

    console.log("--- 2. Simulating HIU Requesting Clinical Data (FHIR Export) ---");
    console.log("HIU queries for Encounter ENC-999...");
    
    const exportRes = await client.post('/api/fhir/encounter/export', { encounterId: "ENC-999" });
    
    console.log(`Received Clinical Document Bundle!`);
    console.log(`Bundle Type: ${exportRes.data.bundle.type}`);
    console.log(`Total Resources: ${exportRes.data.bundle.entry.length}\n`);
    
    exportRes.data.bundle.entry.forEach((entry, i) => {
      console.log(`Resource ${i + 1}: ${entry.resource.resourceType}`);
      if (entry.resource.resourceType === 'Condition') {
        console.log(`  -> Diagnosis: ${entry.resource.code.text}`);
      }
      if (entry.resource.resourceType === 'MedicationRequest') {
        console.log(`  -> Prescription: ${entry.resource.medicationCodeableConcept.text}`);
      }
      if (entry.resource.resourceType === 'Encounter') {
        console.log(`  -> Status: ${entry.resource.status}`);
      }
    });

  } catch (err) {
    console.error("Demo failed:", err.message);
  } finally {
    server.close();
    console.log("\n=== Demo Complete ===");
  }
}

runDemo();
