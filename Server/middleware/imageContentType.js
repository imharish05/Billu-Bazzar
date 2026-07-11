'use strict';
const fs = require('fs');

/**
 * express.static sets Content-Type purely from the file EXTENSION (via the
 * `send`/`mime` packages), never from the actual bytes on disk. If a file's
 * real format doesn't match its extension — e.g. spinSequenceService.js
 * renaming every 360 frame to match the first frame's extension, or an
 * admin uploading a mislabeled export — the browser is told "this is a
 * JPEG" and feeds PNG/WEBP bytes into a JPEG decoder. That produces exactly
 * the blocky, torn-pixel corruption seen in the 360 viewer: the decoder
 * isn't failing to load the image, it's succeeding at decoding the wrong
 * codec's bytes as JPEG macroblocks.
 *
 * This reads the first 12 bytes of the file synchronously (cheap — one
 * small read, no full-file load) and returns the REAL mime type based on
 * the format's magic-number signature, so callers can override whatever
 * Content-Type the extension implied.
 */
const SIGNATURES = [
  { type: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
];

function detectRealImageType(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    const bytesRead = fs.readSync(fd, buf, 0, 12, 0);
    if (bytesRead < 4) return null;

    for (const sig of SIGNATURES) {
      if (sig.bytes.every((b, i) => buf[i] === b)) return sig.type;
    }
    // WEBP: "RIFF" .... "WEBP" (bytes 0-3 and 8-11)
    if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      return 'image/webp';
    }
    return null;
  } catch (e) {
    return null;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (_) { /* noop */ }
    }
  }
}

/** setHeaders callback for express.static — pass directly as the option. */
function fixImageContentType(res, filePath) {
  const realType = detectRealImageType(filePath);
  if (realType) res.setHeader('Content-Type', realType);
}

module.exports = { detectRealImageType, fixImageContentType };