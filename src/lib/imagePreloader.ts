/**
 * Image Preloader Utility for Firebase Storage and CDN Assets
 *
 * Ensures essential images (manifesto lookbook photos, product imagery, banner posters)
 * are preloaded and decoded in memory only when confirmed as current and valid from Firestore/Firebase.
 */

import { Product, SiteBannerContent } from '../types';
import { extractContentVersion, getCacheBustedUrl } from './siteContent';

// In-memory cache of already preloaded image URLs to prevent redundant network requests
const preloadedUrls = new Set<string>();

/**
 * Preloads and decodes a single image URL into browser cache.
 */
export function preloadImage(url?: string | null): Promise<boolean> {
  if (!url || typeof url !== 'string') {
    return Promise.resolve(false);
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return Promise.resolve(false);
  }

  if (preloadedUrls.has(trimmedUrl)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const img = new Image();
    img.referrerPolicy = 'no-referrer';

    const handleSuccess = () => {
      preloadedUrls.add(trimmedUrl);
      resolve(true);
    };

    const handleFailure = (err?: any) => {
      // Resolve instead of reject to keep Promise.all non-blocking
      console.warn(`[ImagePreloader] Failed to preload image: ${trimmedUrl}`, err);
      resolve(false);
    };

    img.onload = () => {
      if ('decode' in img && typeof img.decode === 'function') {
        img.decode().then(handleSuccess).catch(handleSuccess); // Even if decode fails, loaded in memory
      } else {
        handleSuccess();
      }
    };

    img.onerror = handleFailure;
    img.src = trimmedUrl;
  });
}

/**
 * Preloads an array of image URLs in parallel.
 */
export async function preloadImages(urls: (string | undefined | null)[]): Promise<boolean[]> {
  const validUrls = Array.from(
    new Set(
      urls
        .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
        .map((u) => u.trim())
    )
  );

  return Promise.all(validUrls.map((url) => preloadImage(url)));
}

/**
 * Extracts and preloads essential images from confirmed, current Firebase data.
 * Priority order:
 * 1. Manifesto lookbook photos (4 photos in 'More Than Clothes' section)
 * 2. Hero & Luxury section poster images (if video or image banner)
 * 3. Primary catalog product images
 */
export async function preloadEssentialImages(
  siteContent?: SiteBannerContent | null,
  products?: Product[] | null
): Promise<{ total: number; preloaded: number }> {
  const urlsToPreload: string[] = [];
  const version = extractContentVersion(siteContent);

  // 1. Site Manifesto Lookbook Photos
  if (siteContent) {
    const manifestoPhotos = [
      siteContent.photoTopLeft,
      siteContent.photoBottomLeft,
      siteContent.photoTopRight,
      siteContent.photoBottomRight,
    ];

    for (const photo of manifestoPhotos) {
      if (photo && typeof photo === 'string' && photo.trim()) {
        const bustedUrl = getCacheBustedUrl(photo, version);
        urlsToPreload.push(bustedUrl || photo.trim());
      }
    }
  }

  // 2. Primary images for products (first 8 products in catalog)
  if (products && Array.isArray(products)) {
    const topProducts = products.slice(0, 8);
    for (const prod of topProducts) {
      if (prod.image) {
        urlsToPreload.push(prod.image);
      }
      if (Array.isArray(prod.images) && prod.images.length > 0) {
        if (prod.images[0] && prod.images[0] !== prod.image) {
          urlsToPreload.push(prod.images[0]);
        }
      }
    }
  }

  if (urlsToPreload.length === 0) {
    return { total: 0, preloaded: 0 };
  }

  const results = await preloadImages(urlsToPreload);
  const successCount = results.filter(Boolean).length;

  console.log(
    `[ImagePreloader] Preloaded ${successCount}/${urlsToPreload.length} essential Firebase assets.`
  );

  return { total: urlsToPreload.length, preloaded: successCount };
}
