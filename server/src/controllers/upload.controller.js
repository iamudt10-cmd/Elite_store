const uploadService = require('../services/upload.service');
const config = require('../config');

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const uploadResult = await uploadService.uploadImage(req.file);

    // If local upload, prefix with full server base URL so browser can load it cross-origin
    let url = uploadResult.url;
    if (uploadResult.local && url.startsWith('/uploads/')) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      url = `${baseUrl}${url}`;
    }

    res.json({
      success: true,
      url,
      publicId: uploadResult.publicId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImage,
};
