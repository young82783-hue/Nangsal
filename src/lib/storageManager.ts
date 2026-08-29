import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Compresses an image file on the client before uploading to save bandwidth and storage.
 * Optimized for mobile phone galleries and cameras (12-48MP down to high-res web 1400px).
 */
export async function compressImageFile(file: File, maxDimension = 1400, quality = 0.85): Promise<Blob> {
  // If file is not an image (e.g. video or pdf), return as-is
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Upload a File object to Firebase Storage under a designated directory.
 * Compresses phone camera/gallery images first for blazing-fast mobile uploads.
 * Returns the permanent public download URL or base64 fallback.
 */
export async function uploadImageToStorage(
  file: File,
  folder: 'products' | 'banners' | 'receipts' | 'general' = 'products'
): Promise<string> {
  try {
    const compressedBlob = await compressImageFile(file, 1400, 0.85);
    const cleanFileName = (file.name || `img_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${folder}/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, path);
    
    // Upload compressed blob
    const snapshot = await uploadBytes(storageRef, compressedBlob, {
      contentType: 'image/jpeg',
    });
    
    // Retrieve download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (storageError) {
    console.warn('Firebase Storage upload warning, falling back to compressed base64:', storageError);
    // Graceful fallback to compressed base64 data URI if storage bucket is blocked or offline
    try {
      const compressedBlob = await compressImageFile(file, 1200, 0.8);
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
        reader.readAsDataURL(compressedBlob);
      });
    } catch (fallbackErr) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read image'));
          }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }
  }
}

/**
 * Deletes a file from Firebase Storage if it matches a storage bucket path.
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<boolean> {
  if (!imageUrl || (!imageUrl.includes('firebasestorage.app') && !imageUrl.includes('firebasestorage.googleapis.com'))) {
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

