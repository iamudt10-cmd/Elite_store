const fs = require('fs');
const path = require('path');
const config = require('../config');
const cloudinaryService = require('./cloudinary.service');

const uploadImage = async (file) => {
  // If Cloudinary keys are present, upload there
  if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
    try {
      const result = await cloudinaryService.uploadBuffer(file.buffer);
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.warn('Cloudinary upload failed, falling back to local storage:', error.message);
    }
  }

  // Fallback to Local Storage
  const uploadsDir = path.join(__dirname, '../../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
  const filepath = path.join(uploadsDir, filename);

  fs.writeFileSync(filepath, file.buffer);

  // Return a relative URL that the express app will serve statically
  return {
    url: `/uploads/${filename}`,
    publicId: filename,
    local: true,
  };
};

module.exports = {
  uploadImage,
};
