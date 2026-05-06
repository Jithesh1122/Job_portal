import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';

const getSafePublicId = (originalName) => {
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
  return nameWithoutExtension
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
};

export const uploadFileToCloudinary = (file, folder) => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary environment variables are not configured');
  }

  const publicId = `${Date.now()}-${getSafePublicId(file.originalname)}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto',
        filename_override: file.originalname,
        overwrite: false,
        use_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};
