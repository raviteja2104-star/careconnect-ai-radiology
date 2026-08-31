const axios = require('axios');
const { performance } = require('perf_hooks');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

// Configurable load parameters
const CONCURRENCY_LEVELS = [100, 500, 1000];
const TEST_DURATION_MS = 10000; // 10 seconds per stage for simulation

const client = axios.create({
  headers: { 'x-tenant-id': 't-loadtest' },
  validateStatus: () => true
});

async function simulatePatientRegistration(runId) {
  const start = performance.now();
  const res = await client.post(`${BACKEND_URL}/patients`, {
    name: `Load Test ${runId}`,
    email: `load_${runId}@example.com`,
    phone: '9999999999',
    gender: 'O',
    dob: '1990-01-01'
  });
  return { latency: performance.now() - start, status: res.status };
}

async function runBenchmarkStage(ccu) {
  console.log(`\n[Stage] Warming up for ${ccu} Concurrent Users (CCU)...`);
  
  let activeWorkers = 0;
  let totalRequests = 0;
  let successCount = 0;
  let errorCount = 0;
  let latencies = [];
  
  const startTime = performance.now();
  
  // Worker loop function
  const worker = async () => {
    while (performance.now() - startTime < TEST_DURATION_MS) {
      const result = await simulatePatientRegistration(totalRequests++);
      latencies.push(result.latency);
      if (result.status === 201) successCount++;
      else errorCount++;
    }
  };

  // Launch concurrent workers
  const workers = [];
  for (let i = 0; i < ccu; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  latencies.sort((a, b) => a - b);
  
  const rps = (totalRequests / (TEST_DURATION_MS / 1000)).toFixed(2);
  const p50 = latencies[Math.floor(latencies.length * 0.50)]?.toFixed(2) || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)]?.toFixed(2) || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)]?.toFixed(2) || 0;

  console.log(`--- Results for ${ccu} CCU ---`);
  console.log(`Throughput : ${rps} Req/Sec`);
  console.log(`Success    : ${successCount}`);
  console.log(`Errors (5xx): ${errorCount}`);
  console.log(`Latency P50: ${p50} ms`);
  console.log(`Latency P95: ${p95} ms`);
  console.log(`Latency P99: ${p99} ms`);
  
  return { ccu, rps, successCount, errorCount, p50, p95, p99 };
}

async function runBenchmarkSuite() {
  console.log('=============================================');
  console.log(' RC4 SPRINT 1: CAPACITY BENCHMARKING');
  console.log('=============================================\n');

  const results = [];
  for (const ccu of CONCURRENCY_LEVELS) {
    const res = await runBenchmarkStage(ccu);
    results.push(res);
  }

  console.log('\n=============================================');
  console.log(' BENCHMARK SUMMARY');
  console.log('=============================================');
  console.table(results);
}

// runBenchmarkSuite();
