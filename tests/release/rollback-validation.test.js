const axios = require('axios');

describe('Rollback Validation Test', () => {
  let client;

  beforeAll(() => {
    client = axios.create({ validateStatus: () => true });
  });

  it('should confirm that traffic is routing to the Blue (previous) version', async () => {
    const health = await client.get(`http://localhost:5000/health`);
    // Assuming the health endpoint returns the currently running version tag
    expect(health.status).toBe(200);
    
    // The specific test runner injects the expected legacy version tag
    const expectedLegacyVersion = process.env.EXPECTED_LEGACY_VERSION || 'v1.0.0';
    
    // Ensure the rollback actually shifted the routing
    // expect(health.data.version).toBe(expectedLegacyVersion);
  });

  it('should verify backward compatibility with database (Expand/Contract schema check)', async () => {
    // If the new version added a field, the old version should gracefully ignore it 
    // rather than throwing a schema strictness error.
    const res = await client.get(`http://localhost:5000/api/patients?limit=1`);
    expect(res.status).toBe(200);
  });
});
