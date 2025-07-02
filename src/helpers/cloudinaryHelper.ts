import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME!,
  api_key: process.env.CLOUD_API_KEY!,
  api_secret: process.env.CLOUD_API_SECRET!,
});

interface UploadOptions {
  folder?: string;
  publicId?: string;
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
  overwrite?: boolean;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload image to Cloudinary
 * @param imageSource - Base64 string, URL, or File buffer
 * @param options - Upload configuration options
 * @returns Promise with upload result
 */
export async function uploadToCloudinary(
  imageSource: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const {
      folder = "uploads",
      publicId,
      width,
      height,
      crop = "fill",
      quality = "auto",
      format = "webp",
      overwrite = true,
    } = options;

    const transformation = [];
    if (width && height) {
      transformation.push({ width, height, crop });
    }
    if (quality) {
      transformation.push({ quality });
    }
    if (format) {
      transformation.push({ format });
    }

    const uploadOptions: any = {
      folder,
      overwrite,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (transformation.length > 0) {
      uploadOptions.transformation = transformation;
    }

    const uploadResponse = await cloudinary.uploader.upload(
      imageSource,
      uploadOptions
    );

    if (uploadResponse?.secure_url) {
      return {
        success: true,
        url: uploadResponse.secure_url,
      };
    } else {
      return {
        success: false,
        error: "Failed to get secure URL from Cloudinary",
      };
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}

/**
 * Upload avatar image with default avatar settings
 * @param imageSource - Base64 string or URL
 * @param username - Username for public_id
 * @returns Promise with upload result
 */
export async function uploadAvatar(
  imageSource: string,
  username: string
): Promise<UploadResult> {
  return uploadToCloudinary(imageSource, {
    folder: "avatars",
    publicId: `avatar_${username}_${Date.now()}`,
    width: 200,
    height: 200,
    crop: "fill",
    quality: "auto",
    format: "webp",
    overwrite: true,
  });
}

/**
 * Upload thought images with optimized settings
 * @param imageSource - Base64 string or buffer
 * @returns Promise with upload result
 */
export async function uploadThoughtImage(
  imageSource: string
): Promise<UploadResult> {
  return uploadToCloudinary(imageSource, {
    folder: "thoughts",
    width: 800,
    height: 600,
    crop: "limit",
    quality: "auto",
    format: "webp",
  });
}

/**
 * Convert File to base64 data URI
 * @param file - File object
 * @returns Promise with base64 data URI
 */
export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

/**
 * Validate image file type and size
 * @param file - File object
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { isValid: boolean; error?: string } {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Only JPEG, PNG, and WEBP are allowed.",
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File is too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteFromCloudinary(
  publicId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === "ok",
    };
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown deletion error",
    };
  }
}