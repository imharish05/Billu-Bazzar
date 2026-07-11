'use strict';
const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
const SPIN_ROOT = path.join(UPLOADS_ROOT, 'spin');
const DEFAULT_EXT = 'jpg';

/**
 * react-360-view's <ThreeSixty> component needs one folder with
 * sequentially-named, same-extension files (imagePath + fileName
 * pattern like "frame_{index}.jpg"). Admin uploads arrive as
 * arbitrary multer filenames, so this rebuilds a clean numbered set
 * — in upload order — every time a product's spin frames change.
 *
 * No image library (sharp, jimp, etc) is used here — those need
 * native/WASM binaries that some shared hosts (e.g. Webuzo) refuse to
 * build. This just copies the raw bytes to a new filename, no
 * re-encoding, resizing, or EXIF handling. Frames keep the extension
 * of the FIRST uploaded frame in the set; if later frames are a
 * different format, their bytes are copied as-is under that same
 * extension. Browsers render <img> by sniffing actual file content
 * rather than trusting the extension, so this works in practice, but
 * for best results tell admins to upload one consistent format
 * (all JPG or all PNG) per product.
 *
 * @param {number} productId
 * @param {string[]} orderedRelativeUrls  e.g. ["/uploads/products/abc.png", ...]
 * @returns {{ spinImagePath: string|null, spinImageCount: number, spinImageExt: string }}
 */
function materializeSpinSequence(productId, orderedRelativeUrls = []) {
  const destDir = path.join(SPIN_ROOT, String(productId));

  // Always start clean so removed/reordered frames don't leave stale files behind
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  const urls = (orderedRelativeUrls || []).filter(Boolean);
  if (urls.length === 0) {
    return { spinImagePath: null, spinImageCount: 0, spinImageExt: DEFAULT_EXT };
  }

  fs.mkdirSync(destDir, { recursive: true });

  const firstExt = extOf(urls[0]) || DEFAULT_EXT;

  let frameNumber = 1;
  for (const url of urls) {
    const sourcePath = resolveLocalPath(url);
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      console.warn(`[SpinSequence] Skipping missing source frame: ${url}`);
      continue;
    }

    const destPath = path.join(destDir, `frame_${frameNumber}.${firstExt}`);
    try {
      fs.copyFileSync(sourcePath, destPath);
      frameNumber += 1;
    } catch (err) {
      console.error(`[SpinSequence] Failed copying frame ${url}: ${err.message}`);
    }
  }

  const count = frameNumber - 1;
  if (count === 0) {
    fs.rmSync(destDir, { recursive: true, force: true });
    return { spinImagePath: null, spinImageCount: 0, spinImageExt: DEFAULT_EXT };
  }

  return {
    spinImagePath: `/uploads/spin/${productId}/`,
    spinImageCount: count,
    spinImageExt: firstExt,
  };
}

/** Remove a product's materialized spin folder entirely (e.g. on product delete). */
function deleteSpinSequence(productId) {
  const destDir = path.join(SPIN_ROOT, String(productId));
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
}

/** Map a stored "/uploads/..." URL back to its file on disk. */
function resolveLocalPath(relativeUrl) {
  if (!relativeUrl || !relativeUrl.startsWith('/uploads/')) return null;
  return path.join(__dirname, '..', relativeUrl.substring(1));
}

/** Extract a lowercase extension (no dot) from a URL/path, or null. */
function extOf(url) {
  const ext = path.extname(url || '').replace('.', '').toLowerCase();
  return ext || null;
}

module.exports = { materializeSpinSequence, deleteSpinSequence };