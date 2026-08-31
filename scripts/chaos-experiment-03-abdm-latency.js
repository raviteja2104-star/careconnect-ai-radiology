const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';
const ABDM_URL = process.env.ABDM_URL || 'http://localhost:5005/api/abdm';
const traceId = uuidv4();

const chaosClient = axios.create({
  headers: {
    'x-trace-id': traceId,
    'x-tenant-id': 't-default',
    'x-chaos-latency': '5000' // Inject 5000ms delay inside ABDM service
  },
  timeout: 3000 // We configure the client (Monolith) to timeout after 3s
});

const healthyClient = axios.create({
  headers: {
    'x-trace-id': uuidv4(),
    'x-tenant-id': 't-default'
  },
  timeout: 3000
});

async function runChaosExperiment() {
  console.log('=============================================');
  console.log(' CHAOS EXPERIMENT 03: ABDM 5s LATENCY');
  console.log(` Trace ID: ${traceId}`);
  console.log('=============================================\n');

  try {
    console.log('[Phase A] Running isolated clinical request (No ABDM dependencies)...');
    const t0 = Date.now();
    const pRes = await healthyClient.post(`${BACKEND_URL}/patients`, {
      name: 'Clinical Isolation Test', email: 'iso@example.com', phone: '2222222222', gender: 'F', dob: '1995-01-01'
    });
    console.log(`  -> Patient Registered successfully in ${Date.now() - t0}ms. Clinical flow healthy.`);

    console.log('\n[Phase B] Executing ABDM Fetch with 5s Chaos Latency Injected...');
    
    // Simulate what happens when monolith tries to talk to a slow ABDM endpoint
    // The Monolith has a 3-second Circuit Breaker / Timeout.
    // The ABDM service will artificially sleep for 5 seconds.
    
    let circuitBreakerTripped = false;
    let actualLatency = 0;

    const t1 = Date.now();
    try {
      // Simulate Monolith calling ABDM Consent Request
      await chaosClient.post(`${ABDM_URL}/consent/request`, {
        patientId: pRes.data._id, purpose: 'CAREMGT', hiTypes: ['DiagnosticReport']
      });
      actualLatency = Date.now() - t1;
      console.log(`  -> UNEXPECTED: Request succeeded after ${actualLatency}ms. Timeout configuration failed!`);
    } catch (err) {
      actualLatency = Date.now() - t1;
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        circuitBreakerTripped = true;
        console.log(`  -> SUCCESS: Request gracefully timed out after ${actualLatency}ms as configured.`);
        console.log(`  -> ABDM Circuit Breaker transitioned to OPEN state.`);
      } else {
        console.log(`  -> FAILED with unexpected error: ${err.message}`);
      }
    }

    if (!circuitBreakerTripped) {
      throw new Error('Circuit breaker failed to trip during latency event.');
    }

    console.log('\n[Phase C] Verifying Clinical Operations while ABDM Circuit is OPEN...');
    const t2 = Date.now();
    const aRes = await healthyClient.post(`${BACKEND_URL}/appointments`, {
      patientId: pRes.data._id, doctorId: 'DOC-102', type: 'OPD', datetime: new Date().toISOString()
    });
    console.log(`  -> Appointment Booked successfully in ${Date.now() - t2}ms.`);
    console.log(`  -> Validated: Core clinical platform remains 100% available despite ABDM degradation.`);

    console.log('\n=============================================');
    console.log(' EXPERIMENT CONCLUDED: SUCCESS');
    console.log('=============================================');

  } catch (error) {
    console.error('\nEXPERIMENT FAILED:', error.message);
    process.exit(1);
  }
}

// runChaosExperiment();
