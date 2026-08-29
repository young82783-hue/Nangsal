import { ref, uploadBytes, getDownloadURL, deleteObject, uploadString } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a File object to Firebase Storage under a designated directory.
 * Returns the permanent public download URL.
 */
export async function uploadImageToStorage(
  file: File,
  folder: 'products' | 'banners' | 'receipts' | 'general' = 'products'
): Promise<string> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${folder}/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, path);
    
    // Upload bytes
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    });
    
    // Retrieve download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (storageError) {
    console.warn('Firebase Storage upload warning, falling back to base64 encoding:', storageError);
    // Graceful fallback to data URI if storage bucket is blocked or offline
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read image as base64'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Deletes a file from Firebase Storage if it matches a storage bucket path.
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<boolean> {
  if (!imageUrl || !imageUrl.includes('firebasestorage.app') && !imageUrl.includes('firebasestorage.googleapis.com')) {
    return false;
  }
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
    return true;
  } catch (err) {
    console.warn('Could not delete image from Firebase Storage:', err);
    return false;
  }
}

/**
 * Validates and converts an image URL or File into a displayable and persistable string.
 */
export async function processImageUpload(fileOrUrl: File | string, folder: 'products' | 'banners' | 'general' = 'products'): Promise<string> {
  if (typeof fileOrUrl === 'string') {
    return fileOrUrl.trim();
  }
  return uploadImageToStorage(fileOrUrl, folder);
}
