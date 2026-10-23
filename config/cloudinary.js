const { v2: cloudinary } = require('cloudinary');
const env = require('./env');
const { logger } = require('../utils/logger');

const enabled = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (enabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  logger.info('Cloudinary disabled (missing CLOUDINARY_* env)');
}

const cloudinaryConfig = {
  folder: env.CLOUDINARY_FOLDER,
  enabled: () => enabled,
};

module.exports = { cloudinary, cloudinaryConfig };