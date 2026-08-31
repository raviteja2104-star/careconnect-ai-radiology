const http = require('http');

const services = [
  { name: 'Backend Monolith', port: 5000, path: '/health' },
  { name: 'Auth Service', port: 5001, path: '/health' },
  { name: 'Communication Service', port: 5002, path: '/health' },
  { name: 'ABDM Integration', port: 5005, path: '/health' },
  { name: 'Payment Service', port: 5006, path: '/health' }
];

console.log('=============================================');
console.log('   CareConnect Staging Health Verification   ');
console.log('=============================================\n');

let pending = services.length;
let allHealthy = true;

services.forEach(service => {
  const req = http.get({
    hostname: 'localhost',
    port: service.port,
    path: service.path,
    timeout: 2000
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const isUp = res.statusCode === 200;
      if (!isUp) allHealthy = false;
      
      console.log(`[${isUp ? 'OK' : 'FAIL'}] ${service.name} (Port ${service.port})`);
      if (!isUp) console.log(`      Status: ${res.statusCode} - ${data}`);
      
      checkDone();
    });
  });

  req.on('error', (err) => {
    allHealthy = false;
    console.log(`[FAIL] ${service.name} (Port ${service.port})`);
    console.log(`      Error: ${err.message}`);
    checkDone();
  });

  req.on('timeout', () => {
    req.destroy();
  });
});

function checkDone() {
  pending--;
  if (pending === 0) {
    console.log('\n=============================================');
    if (allHealthy) {
      console.log('✅ ALL SERVICES ARE HEALTHY');
      process.exit(0);
    } else {
      console.log('❌ ONE OR MORE SERVICES FAILED HEALTH CHECK');
      process.exit(1);
    }
  }
}
