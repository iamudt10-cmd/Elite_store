const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const uploadBuffer = (buffer, folder = 'elitestyle') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
};

const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary deletion failed:', error);
    return false;
  }
};

module.exports = {
  uploadBuffer,
  deleteImage,
};
