const crypto = require('crypto');

/**
 * Implements the Elliptic-curve Diffie-Hellman (ECDH) encryption/decryption
 * required by the ABDM Data Transfer protocols.
 * Uses X25519 curve and AES-256-GCM.
 */
class FIDHCrypto {
  
  /**
   * Generates an X25519 Key Pair
   * @returns {{publicKey: string, privateKey: string}} Base64 encoded keys
   */
  static generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
    return {
      publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
      privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64')
    };
  }

  /**
   * Encrypts plain text (like a FHIR bundle) for a specific receiver
   */
  static encrypt(plainText, senderPrivateKeyBase64, receiverPublicKeyBase64, nonceBase64) {
    const senderPrivKey = crypto.createPrivateKey({
      key: Buffer.from(senderPrivateKeyBase64, 'base64'),
      format: 'der',
      type: 'pkcs8'
    });
    const receiverPubKey = crypto.createPublicKey({
      key: Buffer.from(receiverPublicKeyBase64, 'base64'),
      format: 'der',
      type: 'spki'
    });

    // 1. Generate Shared Secret using ECDH
    const sharedSecret = crypto.diffieHellman({ privateKey: senderPrivKey, publicKey: receiverPubKey });

    // 2. Derive Key using HKDF (ABDM standard uses HKDF-SHA256)
    const salt = Buffer.from(nonceBase64, 'base64');
    const derivedKey = crypto.hkdfSync('sha256', sharedSecret, salt, Buffer.alloc(0), 32);

    // 3. Encrypt data using AES-256-GCM
    // ABDM specification standardizes a 12-byte IV
    // Note: In strict ABDM, the IV is derived by XORing the trailing bytes of salt and shared key,
    // but for this implementation we use a random IV which is securely passed to the receiver.
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');

    return {
      encryptedData: encrypted,
      keyToShare: senderPubKeyBase64(senderPrivKey), // We need to send our public key
      iv: iv.toString('base64'),
      authTag: authTag,
      nonce: nonceBase64
    };
  }

  /**
   * Decrypts an incoming FHIR bundle from a sender
   */
  static decrypt(encryptedData, receiverPrivateKeyBase64, senderPublicKeyBase64, nonceBase64, ivBase64, authTagBase64) {
    const receiverPrivKey = crypto.createPrivateKey({
      key: Buffer.from(receiverPrivateKeyBase64, 'base64'),
      format: 'der',
      type: 'pkcs8'
    });
    const senderPubKey = crypto.createPublicKey({
      key: Buffer.from(senderPublicKeyBase64, 'base64'),
      format: 'der',
      type: 'spki'
    });

    const sharedSecret = crypto.diffieHellman({ privateKey: receiverPrivKey, publicKey: senderPubKey });
    
    const salt = Buffer.from(nonceBase64, 'base64');
    const derivedKey = crypto.hkdfSync('sha256', sharedSecret, salt, Buffer.alloc(0), 32);

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

function senderPubKeyBase64(privateKeyObj) {
  // Derive the real public key from the sender's private key so the receiver
  // can complete the X25519 exchange. Accepts a KeyObject or a base64 PKCS8
  // string (the format generateKeyPair() returns).
  const privateKey =
    typeof privateKeyObj === 'string'
      ? crypto.createPrivateKey({
          key: Buffer.from(privateKeyObj, 'base64'),
          format: 'der',
          type: 'pkcs8',
        })
      : privateKeyObj;
  const publicKey = crypto.createPublicKey(privateKey);
  return publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
}

module.exports = { FIDHCrypto };
