/**
 * FileEncryptionService — AES-256-GCM per-file encryption with envelope
 * encryption (unique DEK per file, DEK wrapped by a KEK from env).
 *
 * Environment variables:
 *   FILE_ENCRYPTION_KEY           64 hex chars (32 bytes) — the Key Encryption
 *                                 Key. Generate once:
 *                                   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *                                 If unset, encryption is skipped in dev (warning logged).
 *   REQUIRE_FILE_ENCRYPTION       'true' → hard-fail uploads when key is missing.
 *   FILE_ENCRYPTION_KEY_VERSION   Integer, default 1. Bump on KEK rotation.
 *
 * On-disk format: raw AES-256-GCM ciphertext (file overwritten in place).
 * Auth tag and all key material live in MongoDB (page.encryption) — never on disk.
 *
 * Key rotation path:
 *   1. Deploy new KEK in FILE_ENCRYPTION_KEY, bump FILE_ENCRYPTION_KEY_VERSION.
 *   2. Run a migration job: for each HealthDocument page where
 *      page.encryption.keyVersion < current version, decryptToBuffer with the
 *      old KEK, encryptFile with the new KEK, update page.encryption in DB.
 *   3. keyVersion in the DB record tells any migration/reader which KEK to use.
 *
 * Streaming note:
 *   GCM requires the full ciphertext before the auth tag can be verified, so
 *   true streaming decryption is not possible without chunked AE. At health-
 *   document sizes (≤ 20 MiB per upload limit) buffering the full plaintext
 *   in memory is acceptable. A future upgrade to 64-KiB-chunk authenticated
 *   encryption would enable genuine streaming for larger files.
 */

const crypto = require('crypto');
const fs     = require('fs');
const { Readable } = require('stream');

const ALGORITHM = 'aes-256-gcm';

function getKek() {
    const hex = process.env.FILE_ENCRYPTION_KEY;
    if (!hex) return null;
    if (hex.length !== 64) throw new Error('FILE_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).');
    return Buffer.from(hex, 'hex');
}

function getKeyVersion() {
    return parseInt(process.env.FILE_ENCRYPTION_KEY_VERSION || '1', 10);
}

/** True if a KEK is present and well-formed in the environment. */
function masterKeyAvailable() {
    try { return getKek() !== null; } catch { return false; }
}

function wrapDek(dek, kek) {
    const iv     = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, kek, iv);
    const wrapped = Buffer.concat([cipher.update(dek), cipher.final()]);
    return {
        wrappedKey: wrapped.toString('hex'),
        iv:         iv.toString('hex'),
        authTag:    cipher.getAuthTag().toString('hex'),
    };
}

function unwrapDek(wrappedKeyHex, ivHex, authTagHex, kek) {
    const decipher = crypto.createDecipheriv(ALGORITHM, kek, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(wrappedKeyHex, 'hex')), decipher.final()]);
}

/**
 * Encrypt a file in place (overwrite cleartext with ciphertext on disk).
 *
 * @param {string} filePath  Absolute path to the plaintext file.
 * @returns {object|null}    Encryption metadata to store in page.encryption,
 *                           or null if no KEK is configured (dev mode).
 */
function encryptFile(filePath) {
    const kek = getKek();
    if (!kek) {
        if (process.env.REQUIRE_FILE_ENCRYPTION === 'true') {
            throw new Error('FILE_ENCRYPTION_KEY is required (REQUIRE_FILE_ENCRYPTION=true) but not set.');
        }
        console.warn('[FileEncryption] No FILE_ENCRYPTION_KEY — storing file unencrypted (dev mode).');
        return null;
    }

    const dek     = crypto.randomBytes(32);
    const fileIv  = crypto.randomBytes(12);

    const plaintext  = fs.readFileSync(filePath);
    const cipher     = crypto.createCipheriv(ALGORITHM, dek, fileIv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const fileAuthTag = cipher.getAuthTag();

    fs.writeFileSync(filePath, ciphertext);

    const { wrappedKey, iv: kekIv, authTag: kekAuthTag } = wrapDek(dek, kek);

    return {
        algorithm:    ALGORITHM,
        encryptedKey: wrappedKey,
        kekIv,
        kekAuthTag,
        fileIv:       fileIv.toString('hex'),
        fileAuthTag:  fileAuthTag.toString('hex'),
        keyVersion:   getKeyVersion(),
    };
}

/**
 * Decrypt an encrypted file to a Buffer.
 *
 * @param {string} filePath       Absolute path to the ciphertext file on disk.
 * @param {object} encryptionMeta The page.encryption subdocument from MongoDB.
 * @returns {Buffer}              Plaintext bytes.
 */
function decryptToBuffer(filePath, encryptionMeta) {
    const { encryptedKey, kekIv, kekAuthTag, fileIv, fileAuthTag } = encryptionMeta;
    const kek = getKek();
    if (!kek) throw new Error('FILE_ENCRYPTION_KEY is not configured — cannot decrypt stored file.');

    const dek        = unwrapDek(encryptedKey, kekIv, kekAuthTag, kek);
    const ciphertext = fs.readFileSync(filePath);
    const decipher   = crypto.createDecipheriv(ALGORITHM, dek, Buffer.from(fileIv, 'hex'));
    decipher.setAuthTag(Buffer.from(fileAuthTag, 'hex'));
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Decrypt an encrypted file and return a Readable stream of the plaintext.
 * Suitable for piping directly to an HTTP response.
 *
 * @param {string} filePath       Absolute path to the ciphertext file on disk.
 * @param {object} encryptionMeta The page.encryption subdocument from MongoDB.
 * @returns {Readable}
 */
function decryptToStream(filePath, encryptionMeta) {
    const plaintext = decryptToBuffer(filePath, encryptionMeta);
    return Readable.from(plaintext);
}

module.exports = { masterKeyAvailable, encryptFile, decryptToBuffer, decryptToStream };
