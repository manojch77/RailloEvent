// Cloudinary configuration
// User-provided credentials
const CLOUDINARY_CLOUD_NAME = "dyweq9kt7";
const CLOUDINARY_ROOT_API = "M_-w08sr4YcggYapGcZjqwQJKcI";
const CLOUDINARY_MEDIA_FLOW_API = "NjAtKUbNx-yINdCm51UOcwsiBK0";
const CLOUDINARY_UPLOAD_PRESET = "Raillo_upload";
const CLOUDINARY_FOLDER = "raillo";

// For unsigned uploads:
const CLOUDINARY_UNSIGNED_UPLOAD_PRESET = CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Upload a file to Cloudinary
 * @param file - The file to upload
 * @param folder - The folder to upload to (default: 'raillo')
 * @returns The upload result with URL and metadata
 */
export const uploadToCloudinary = async (
  file: File,
  folder: string = CLOUDINARY_FOLDER
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UNSIGNED_UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Upload failed");
  }

  const data = await response.json();
  
  return {
    publicId: data.public_id,
    url: data.url,
    secureUrl: data.secure_url,
    format: data.format,
    width: data.width,
    height: data.height,
  };
};

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // Note: For security, this should be done server-side
  // This is a placeholder for client-side deletion if needed
  console.log("Delete requested for:", publicId);
};

/**
 * Get optimized URL for images
 * @param url - The Cloudinary URL
 * @param options - Optimization options
 * @returns Optimized URL
 */
export const getOptimizedUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  } = {}
): string => {
  if (!url.includes("cloudinary.com")) return url;

  const { width, height, quality = "auto", format = "auto" } = options;
  
  // Add transformation parameters
  let transformation = `f_${format},q_${quality}`;
  if (width) transformation += `,w_${width}`;
  if (height) transformation += `,h_${height}`;

  // Insert transformation before the version/public_id
  return url.replace("/upload/", `/upload/${transformation}/`);
};

/**
 * Generate thumbnail URL for certificates
 * @param url - The Cloudinary URL
 * @param size - Thumbnail size (default: 200)
 * @returns Thumbnail URL
 */
export const getThumbnailUrl = (url: string, size: number = 200): string => {
  return getOptimizedUrl(url, { width: size, height: size, quality: "auto", format: "auto" });
};
