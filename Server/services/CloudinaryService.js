'use strict';
/**
 * CloudinaryService — local mock. Replace with real Cloudinary SDK before production.
 * Returns a fake CDN URL using the local /uploads path.
 */
class CloudinaryService {
  upload(filePath, options = {}) {
    const folder = options.folder || 'billu-bazaar';
    const fileName = filePath.split(/[\\/]/).pop();
    const fakeUrl = `https://res.cloudinary.com/billu-bazaar-mock/${folder}/${fileName}`;
    return Promise.resolve({ secure_url: fakeUrl, public_id: `${folder}/${fileName}` });
  }

  delete(publicId) {
    console.log(`[CloudinaryMock] Deleting ${publicId}`);
    return Promise.resolve({ result: 'ok' });
  }
}

module.exports = new CloudinaryService();
