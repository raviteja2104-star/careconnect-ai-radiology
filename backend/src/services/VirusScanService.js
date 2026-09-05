/**
 * VirusScanService — ClamAV INSTREAM malware scanner.
 *
 * Communicates directly with clamd over TCP using the INSTREAM streaming
 * protocol — no npm dependency required, only Node's built-in `net` module.
 *
 * INSTREAM protocol:
 *   1. Send "zINSTREAM\0".
 *   2. Send the file in 64 KiB chunks: for each chunk, write a 4-byte
 *      big-endian uint32 with the chunk's length, then the chunk bytes.
 *   3. Terminate with a zero-length chunk (four zero bytes).
 *   4. Read the response: "stream: OK\0" or "stream: Virus.Name FOUND\0".
 *
 * Environment:
 *   CLAMAV_HOST           default '127.0.0.1'
 *   CLAMAV_PORT           default 3310
 *   CLAMAV_TIMEOUT_MS     default 30000
 *   REQUIRE_VIRUS_SCAN    'true' → hard-fail uploads when clamd is unreachable
 *
 * In development, if clamd is unavailable and REQUIRE_VIRUS_SCAN is not 'true',
 * uploads proceed with a console.warn — a loose default suitable for
 * developer machines. In production: run clamd and set REQUIRE_VIRUS_SCAN=true
 * so that a daemon outage is visible as an upload failure, not silent skip.
 */

const net = require('net');
const fs  = require('fs');

const CHUNK_SIZE = 64 * 1024; // 64 KiB — well within clamd's StreamMaxLength default (25 MB)

function cfg() {
    return {
        host:    process.env.CLAMAV_HOST       || '127.0.0.1',
        port:    parseInt(process.env.CLAMAV_PORT || '3310', 10),
        timeout: parseInt(process.env.CLAMAV_TIMEOUT_MS || '30000', 10),
    };
}

function tcpCommand(buildPayload) {
    return new Promise((resolve, reject) => {
        const { host, port, timeout } = cfg();
        const sock = net.createConnection({ host, port });
        let response = '';
        sock.setTimeout(timeout);
        sock.on('connect', () => buildPayload(sock));
        sock.on('data',    (d) => { response += d.toString(); });
        sock.on('end',     () => resolve(response.trim().replace(/\0/g, '')));
        sock.on('timeout', () => { sock.destroy(); reject(new Error('ClamAV connection timed out.')); });
        sock.on('error',   (e) => reject(e));
    });
}

/** Returns true if clamd is reachable and responds PONG to a PING. */
async function isAvailable() {
    try {
        const resp = await tcpCommand((sock) => {
            sock.write(Buffer.from('zPING\0'));
            sock.end();
        });
        return resp === 'PONG';
    } catch {
        return false;
    }
}

/**
 * Scan one file using the INSTREAM protocol.
 *
 * @param {string} filePath  Absolute path to the file to scan.
 * @returns {{ clean: boolean, virusName: string|null }}
 */
function scanFile(filePath) {
    return tcpCommand((sock) => {
        sock.write(Buffer.from('zINSTREAM\0'));

        // Buffer the whole file (≤ 20 MiB by our upload limit) and stream it
        // in chunks. Using readFileSync here avoids an extra async layer; the
        // upload-limit guard means memory usage is bounded.
        const fileData = fs.readFileSync(filePath);
        let offset = 0;
        while (offset < fileData.length) {
            const chunk = fileData.slice(offset, offset + CHUNK_SIZE);
            const header = Buffer.allocUnsafe(4);
            header.writeUInt32BE(chunk.length, 0);
            sock.write(header);
            sock.write(chunk);
            offset += chunk.length;
        }
        // Zero-length terminator signals end-of-stream to clamd
        sock.write(Buffer.from([0, 0, 0, 0]));
    }).then((text) => {
        if (text.endsWith('OK')) {
            return { clean: true, virusName: null };
        }
        // Response: "stream: Virus.Name FOUND"
        const match = text.match(/stream:\s+(.+?)\s+FOUND/i);
        return { clean: false, virusName: match ? match[1] : 'UNKNOWN' };
    });
}

/**
 * Scan an array of uploaded files. Throws (and deletes ALL files) if any
 * are infected. Returns silently when all are clean.
 *
 * If clamd is unreachable and REQUIRE_VIRUS_SCAN is not 'true', the scan
 * is skipped with a warning — suitable for developer machines without clamd.
 *
 * @param {Array<{ absolutePath: string, originalName?: string }>} files
 */
async function scanFiles(files) {
    const available = await isAvailable();
    if (!available) {
        if (process.env.REQUIRE_VIRUS_SCAN === 'true') {
            for (const f of files) try { fs.unlinkSync(f.absolutePath); } catch {}
            throw new Error('ClamAV daemon is required (REQUIRE_VIRUS_SCAN=true) but unreachable. Upload rejected.');
        }
        console.warn('[VirusScan] clamd not reachable — skipping scan. Set REQUIRE_VIRUS_SCAN=true in production.');
        return;
    }

    for (const f of files) {
        const result = await scanFile(f.absolutePath);
        if (!result.clean) {
            const name = f.originalName || f.absolutePath;
            // Wipe every uploaded file before rejecting — never leave infected
            // files on disk even if later files haven't been scanned yet.
            for (const g of files) try { fs.unlinkSync(g.absolutePath); } catch {}
            const err = new Error(`Upload rejected: "${name}" failed malware scan (${result.virusName}).`);
            err.code = 'VIRUS_DETECTED';
            err.virusName = result.virusName;
            err.fileName = name;
            throw err;
        }
    }
}

module.exports = { isAvailable, scanFile, scanFiles };
