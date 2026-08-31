const http = require('http');
const fs = require('fs');

const services = [
  { name: 'Backend Monolith', port: 5000 },
  { name: 'Auth Service', port: 5001 },
  { name: 'Communication Service', port: 5002 },
  { name: 'ABDM Integration', port: 5005 },
  { name: 'Payment Service', port: 5006 }
];

const infra = [
  { name: 'MongoDB', port: 27017 },
  { name: 'Redis', port: 6379 }
];

let report = `CareConnect RC3 Staging Verification\n\n`;

async function checkEndpoint(port, path) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get({
      hostname: 'localhost',
      port,
      path,
      timeout: 3000
    }, (res) => {
      const latency = Date.now() - start;
      res.resume(); // consume response data to free up memory
      if (res.statusCode === 200) {
        resolve({ status: 'PASS', latency });
      } else {
        resolve({ status: 'FAIL', code: res.statusCode, latency });
      }
    });

    req.on('error', (err) => resolve({ status: 'FAIL', error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 'FAIL', error: 'TIMEOUT' }); });
  });
}

async function checkTcp(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const start = Date.now();
    const socket = new net.Socket();
    
    socket.setTimeout(2000);
    socket.on('connect', () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ status: 'PASS', latency });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: 'FAIL', error: 'TIMEOUT' });
    });
    socket.on('error', (err) => {
      resolve({ status: 'FAIL', error: err.message });
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function run() {
  let allPass = true;
  let metrics = [];

  console.log('Running Staging Verification...\n');

  report += '--- SERVICES ---\n';
  for (const s of services) {
    const health = await checkEndpoint(s.port, '/health');
    const ready = await checkEndpoint(s.port, '/ready');
    
    const overall = (health.status === 'PASS' && ready.status === 'PASS') ? 'PASS' : 'FAIL';
    if (overall === 'FAIL') allPass = false;

    report += `${s.name.padEnd(25)} ${overall}\n`;
    metrics.push(`${s.name} Health Latency: ${health.latency || 'N/A'} ms`);
    metrics.push(`${s.name} Ready Latency: ${ready.latency || 'N/A'} ms`);
  }

  report += '\n--- INFRASTRUCTURE ---\n';
  for (const i of infra) {
    const tcp = await checkTcp(i.port);
    report += `${i.name.padEnd(25)} ${tcp.status}\n`;
    if (tcp.status === 'FAIL') allPass = false;
  }

  report += '\n--- BASELINE METRICS ---\n';
  report += metrics.join('\n') + '\n';

  report += '\n=============================================\n';
  report += `Overall Status: ${allPass ? 'READY' : 'NOT READY'}\n`;
  report += `Timestamp: ${new Date().toISOString()}\n`;

  fs.writeFileSync('staging-verification-report.txt', report);
  console.log(report);

  if (allPass) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run();
