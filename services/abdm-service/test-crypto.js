const { FIDHCrypto } = require('./src/crypto/fidh');
const crypto = require('crypto');

// 1. Generate keys for Health Information Provider (Sender)
const hipKeys = FIDHCrypto.generateKeyPair();
console.log('HIP Public Key generated.');

// 2. Generate keys for Health Information User (Receiver)
const hiuKeys = FIDHCrypto.generateKeyPair();
console.log('HIU Public Key generated.');

// 3. Mock FHIR Bundle Payload
const fhirPayload = JSON.stringify({ resourceType: 'Bundle', type: 'document', patient: 'PAT-123' });
console.log('\nOriginal Payload:', fhirPayload);

// 4. Encrypt Data (HIP Side)
const nonce = crypto.randomBytes(32).toString('base64');
const encryptedResponse = FIDHCrypto.encrypt(
  fhirPayload, 
  hipKeys.privateKey, 
  hiuKeys.publicKey, 
  nonce
);

console.log('\nEncrypted Transmission Payload:');
console.log(' - Data:', encryptedResponse.encryptedData);
console.log(' - IV:', encryptedResponse.iv);
console.log(' - Auth Tag:', encryptedResponse.authTag);

// 5. Decrypt Data (HIU Side)
const decryptedPayload = FIDHCrypto.decrypt(
  encryptedResponse.encryptedData,
  hiuKeys.privateKey,
  hipKeys.publicKey,
  nonce,
  encryptedResponse.iv,
  encryptedResponse.authTag
);

console.log('\nDecrypted Payload:', decryptedPayload);
console.log('\nSuccess:', decryptedPayload === fhirPayload);
