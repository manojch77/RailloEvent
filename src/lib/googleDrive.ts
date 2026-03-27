/**
 * Storage Service for file uploads
 * Uses Firebase Storage for file uploads and returns public download URLs
 */

import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param path - Storage path (e.g., "certificates/", "backgrounds/")
 * @returns Promise with the public download URL
 */
export const uploadToStorage = async (
  file: File,
  path: string
): Promise<string> => {
  try {
    // Create a unique filename to avoid overwrites
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fullPath = `${path}${timestamp}_${sanitizedFileName}`;
    
    const storageReference = storageRef(storage, fullPath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageReference, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading to Firebase Storage:", error);
    throw error;
  }
};

/**
 * Upload certificate to Firebase Storage
 * @param file - Certificate file
 * @param eventId - Event ID for organizing
 * @param rollNumber - Student roll number
 * @returns Promise with the download URL
 */
export const uploadCertificate = async (
  file: File,
  eventId: string,
  rollNumber: string
): Promise<string> => {
  const path = `certificates/${eventId}/${rollNumber}_`;
  return uploadToStorage(file, path);
};

/**
 * Upload event background image to Firebase Storage
 * @param file - Background image file
 * @param eventId - Event ID for organizing
 * @returns Promise with the download URL
 */
export const uploadEventBackground = async (
  file: File,
  eventId: string
): Promise<string> => {
  const path = `backgrounds/${eventId}_`;
  return uploadToStorage(file, path);
};

/**
 * Upload payment QR code to Firebase Storage
 * @param file - QR code image file
 * @param eventId - Event ID for organizing
 * @returns Promise with the download URL
 */
export const uploadPaymentQR = async (
  file: File,
  eventId: string
): Promise<string> => {
  const path = `payment_qr/${eventId}_`;
  return uploadToStorage(file, path);
};

// Default exports for backward compatibility
export default {
  uploadToStorage,
  uploadCertificate,
  uploadEventBackground,
  uploadPaymentQR,
};
