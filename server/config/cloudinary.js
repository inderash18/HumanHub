import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

export const isCloudinaryActive = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryActive()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

/**
 * Upload a local file to Cloudinary with folder organization and metadata extraction.
 * @param {string} filePath Local file system path
 * @param {Object} options Cloudinary upload options (e.g. folder, resource_type)
 */
export async function uploadToCloudinary(filePath, options = {}) {
  if (!isCloudinaryActive()) {
    throw new Error('Cloudinary credentials are not configured');
  }

  const folder = options.folder || 'humanhub/posts';
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: options.resource_type || 'auto',
    use_filename: true,
    unique_filename: true,
    ...options
  });

  return {
    url: result.secure_url,
    secure_url: result.secure_url,
    publicId: result.public_id,
    public_id: result.public_id,
    provider: 'cloudinary',
    resourceType: result.resource_type || (result.format === 'mp4' ? 'video' : 'image'),
    resource_type: result.resource_type,
    format: result.format || '',
    bytes: result.bytes || 0,
    width: result.width || 0,
    height: result.height || 0
  };
}

/**
 * Delete a media asset from Cloudinary by public ID.
 * @param {string} publicId Cloudinary public_id
 * @param {string} resourceType 'image' | 'video' | 'raw'
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  if (!isCloudinaryActive() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn('[Cloudinary] Asset deletion skipped/failed:', err.message);
  }
}

export default cloudinary;

