import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  deleteDoc,
  Unsubscribe,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Product, SiteBannerContent, CustomNavButton, PaymentSettings } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS_SEED } from '../data/products';
import { purgeStaleCaches } from './cacheManager';

export type { SiteBannerContent, Product, CustomNavButton, PaymentSettings };

/**
 * Default Master Payment Settings
 */
export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  esewa: {
    enabled: true,
    name: 'eSewa Direct Online Payment',
    accountHolder: 'SUNIL GURUNG',
    accountNumber: '9847459808',
    qrCodeUrl: 'https://i.ibb.co/FbDMSvNQ/esewa.jpg',
    notes: 'Please enter your Full Name in the remarks section while transferring.',
  },
  bank: {
    enabled: true,
    name: 'Direct Bank Transfer',
    accountHolder: 'SUNIL GURUNG',
    bankName: 'NABIL BANK / STAND. CHARTERED',
    accountNumber: '0190 2841 9820 11',
    branch: 'Kathmandu Branch',
    qrCodeUrl: 'https://i.ibb.co/5gR2grvR/bank.jpg',
    notes: 'Please transfer to the above account and upload transaction receipt or ref ID.',
  },
  cod: {
    enabled: true,
    name: 'Cash on Delivery (COD)',
    instructions: 'Pay the total amount in cash to our courier partner upon inspecting your parcel at your doorstep.',
  },
  version: 1,
};

/**
 * Extracts a reliable numeric or string version/timestamp from banner data.
 */
export function extractContentVersion(banner?: SiteBannerContent | null): string | number {
  if (!banner) return Date.now();
  if (banner.version) return banner.version;
  if (banner.updatedAt) {
    if (typeof banner.updatedAt.toMillis === 'function') {
      return banner.updatedAt.toMillis();
    }
    if (typeof banner.updatedAt.toDate === 'function') {
      return banner.updatedAt.toDate().getTime();
    }
    if (banner.updatedAt.seconds) {
      return banner.updatedAt.seconds * 1000 + Math.floor((banner.updatedAt.nanoseconds || 0) / 1000000);
    }
    if (typeof banner.updatedAt === 'number' || typeof banner.updatedAt === 'string') {
      return banner.updatedAt;
    }
  }
  return Date.now();
}

/**
 * Cache-busting URL builder: Appends or updates the version/timestamp query parameter (?v=...)
 * to guarantee that browsers NEVER serve a cached old image or video when content is updated.
 */
export function getCacheBustedUrl(url?: string, version?: string | number): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Bypass cache-busting for inline data URIs or blob URIs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const ver = version !== undefined && version !== null && version !== '' ? String(version) : String(Date.now());

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsed = new URL(trimmed);
      parsed.searchParams.set('v', ver);
      return parsed.toString();
    }
  } catch {
    // Fall back to manual query parameter string construction if URL constructor fails
  }

  const hashParts = trimmed.split('#');
  const pathAndQuery = hashParts[0];
  const hash = hashParts[1] ? `#${hashParts[1]}` : '';

  const [path, query] = pathAndQuery.split('?');
  if (!query) {
    return `${path}?v=${encodeURIComponent(ver)}${hash}`;
  }

  const params = new URLSearchParams(query);
  params.set('v', ver);
  return `${path}?${params.toString()}${hash}`;
}

/**
 * Default 3-Line Menu Category Buttons
 */
export const DEFAULT_NAV_BUTTONS: CustomNavButton[] = [
  { id: 'btn_all', label: 'All', category: 'ALL', isActive: true },
  { id: 'btn_tees', label: 'Tees', category: 'T-SHIRTS', isActive: true },
  { id: 'btn_hoodie', label: 'Hoodie', category: 'HOODIES', isActive: true },
  { id: 'btn_outerwear', label: 'Outerwear', category: 'OUTERWEAR', isActive: true },
];

/**
 * Default Master Site Content
 */
export const DEFAULT_SITE_CONTENT: SiteBannerContent = {
  heroVideoUrl: 'https://cdn.phototourl.com/member/2026-08-21-ad775558-8cf9-4171-859b-513364f33166.mp4',
  heroPosterUrl: '',
  heroType: 'video',
  luxuryVideoUrl: 'https://cdn.phototourl.com/member/2026-08-21-ad775558-8cf9-4171-859b-513364f33166.mp4',
  luxuryPosterUrl: '',
  luxuryHeading: 'WE ARE LUXURY\nSTREETWEAR',
  luxuryTagline: 'Every product from NANGSAL APPAREL is made with care.',
  luxuryParagraph1: 'We are not traditional luxury and we are not traditional streetwear.',
  luxuryParagraph2: 'We are a fusion of both and we bring together a contrast of styles, materials and colours that celebrate your uniqueness.',
  luxuryBadge: 'MADE IN NEPAL',
  manifestoHeading: 'MORE THAN\nCLOTHES',
  manifestoTagline: 'NANGSAL APPAREL',
  photoTopLeft: 'https://cdn.phototourl.com/member/2026-08-21-fa160901-3aca-4e7c-aebb-7cad5b94b6ef.jpg',
  photoBottomLeft: 'https://cdn.phototourl.com/member/2026-08-21-fdd5d65a-7ae5-49ac-a967-b04274d42f58.jpg',
  photoTopRight: 'https://plain-apac-prod-public.komododecks.com/202608/22/xp2eVM6QVxfw36pmyjmc/image.jpg',
  photoBottomRight: 'https://cdn.phototourl.com/member/2026-08-21-0631b430-57b1-47ee-a854-03cce897b928.jpg',
  announcementText: 'NEW DROP LIVE NOW.',
  navButtons: DEFAULT_NAV_BUTTONS,
  version: 1,
};

export { INITIAL_PRODUCTS_SEED };

/**
 * Initialize Firestore data if the collections are totally fresh
 */
export async function bootstrapFirestoreDataIfNeeded(): Promise<void> {
  try {
    const bannerDocRef = doc(db, 'site_content', 'main_banners');
    const bannerSnap = await getDoc(bannerDocRef);

    if (!bannerSnap.exists()) {
      await setDoc(bannerDocRef, {
        ...DEFAULT_SITE_CONTENT,
        version: Date.now(),
        updatedAt: serverTimestamp(),
      });
      console.log('[SiteContent] Bootstrapped site_content in Firestore.');
    } else {
      // Cleanse any old image banner or stale poster URLs from existing Firestore document
      const currentData = bannerSnap.data() as Partial<SiteBannerContent>;
      const needsCleanup =
        Boolean(currentData.heroPosterUrl) ||
        Boolean(currentData.luxuryPosterUrl) ||
        currentData.heroType === 'image' ||
        !currentData.heroVideoUrl;

      if (needsCleanup) {
        await setDoc(
          bannerDocRef,
          {
            heroPosterUrl: '',
            luxuryPosterUrl: '',
            heroType: 'video',
            heroVideoUrl:
              currentData.heroVideoUrl ||
              'https://cdn.phototourl.com/member/2026-08-21-ad775558-8cf9-4171-859b-513364f33166.mp4',
            luxuryVideoUrl:
              currentData.luxuryVideoUrl ||
              'https://cdn.phototourl.com/member/2026-08-21-ad775558-8cf9-4171-859b-513364f33166.mp4',
            version: Date.now(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        console.log('[SiteContent] Cleaned old image banners from Firestore.');
      }
    }

    // Bootstrap payment settings if not exists
    const paymentDocRef = doc(db, 'site_content', 'payment_settings');
    const paymentSnap = await getDoc(paymentDocRef);
    if (!paymentSnap.exists()) {
      await setDoc(paymentDocRef, {
        ...DEFAULT_PAYMENT_SETTINGS,
        updatedAt: serverTimestamp(),
      });
      console.log('[SiteContent] Bootstrapped payment_settings in Firestore.');
    }

    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      console.log('[SiteContent] Bootstrapping initial products collection in Firestore...');
      const batch = writeBatch(db);
      for (let i = 0; i < INITIAL_PRODUCTS_SEED.length; i++) {
        const prod = INITIAL_PRODUCTS_SEED[i];
        const ref = doc(db, 'products', prod.id);
        batch.set(ref, {
          id: prod.id,
          productId: prod.id,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          rawPrice: prod.rawPrice,
          image: prod.image,
          images: prod.images,
          description: prod.description,
          inStock: prod.inStock !== false,
          sizes: prod.sizes,
          availableSizes: prod.sizes,
          isActive: true,
          isBestSeller: i < 2,
          gender: 'UNISEX',
          sortOrder: i + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
      console.log('[SiteContent] Products seeded successfully.');
    }
  } catch (err) {
    console.warn('[SiteContent] Bootstrap notice:', err);
  }
}

/**
 * Real-time subscription to payment settings from Firestore.
 */
export function subscribeToPaymentSettings(
  onUpdate: (settings: PaymentSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const paymentDocRef = doc(db, 'site_content', 'payment_settings');

  return onSnapshot(
    paymentDocRef,
    (snap) => {
      if (snap.metadata.fromCache) {
        return;
      }
      if (snap.exists()) {
        const data = snap.data() as PaymentSettings;
        onUpdate({
          ...DEFAULT_PAYMENT_SETTINGS,
          ...data,
          esewa: { ...DEFAULT_PAYMENT_SETTINGS.esewa, ...(data.esewa || {}) },
          bank: { ...DEFAULT_PAYMENT_SETTINGS.bank, ...(data.bank || {}) },
          cod: { ...DEFAULT_PAYMENT_SETTINGS.cod, ...(data.cod || {}) },
        });
      } else {
        onUpdate(DEFAULT_PAYMENT_SETTINGS);
      }
    },
    (err) => {
      console.warn('[SiteContent] Payment settings subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save / Update Payment Settings directly in Firestore.
 */
export async function updatePaymentSettings(settings: Partial<PaymentSettings>): Promise<void> {
  const paymentDocRef = doc(db, 'site_content', 'payment_settings');
  const now = Date.now();
  try {
    const payload = {
      ...settings,
      version: now,
      updatedAt: serverTimestamp(),
    };
    await setDoc(paymentDocRef, payload, { merge: true });
    purgeStaleCaches();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'site_content/payment_settings');
  }
}
export function subscribeToSiteContent(
  onUpdate: (content: SiteBannerContent) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const bannerDocRef = doc(db, 'site_content', 'main_banners');

  return onSnapshot(
    bannerDocRef,
    (snap) => {
      if (snap.metadata.fromCache) {
        return;
      }
      if (snap.exists()) {
        const data = snap.data() as SiteBannerContent;
        onUpdate({
          ...DEFAULT_SITE_CONTENT,
          ...data,
        });
      } else {
        onUpdate(DEFAULT_SITE_CONTENT);
      }
    },
    (err) => {
      console.warn('[SiteContent] Banner subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time subscription to live products directly from Firestore.
 * Single source of truth.
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const productsCollRef = collection(db, 'products');

  return onSnapshot(
    productsCollRef,
    (snap) => {
      if (snap.metadata.fromCache) {
        return;
      }
      if (!snap.empty) {
        const items: Product[] = [];
        snap.forEach((d) => {
          const data = d.data();
          items.push({
            id: data.id || d.id,
            productId: data.productId || data.id || d.id,
            name: data.name || '',
            category: data.category || 'TOPS',
            price: data.price || 'Rs. 0.00',
            rawPrice: typeof data.rawPrice === 'number' ? data.rawPrice : 0,
            image: data.image || '',
            images: Array.isArray(data.images) && data.images.length > 0 ? data.images : [data.image || ''],
            description: data.description || '',
            inStock: data.inStock !== false,
            sizes: Array.isArray(data.sizes) ? data.sizes : ['S', 'M', 'L', 'XL'],
            availableSizes: Array.isArray(data.availableSizes) ? data.availableSizes : data.sizes,
            isActive: data.isActive !== false,
            isBestSeller: Boolean(data.isBestSeller),
            gender: data.gender || 'UNISEX',
            sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        onUpdate(items);
      } else {
        // If collection is empty, report empty array so loading completes without stale flash
        onUpdate([]);
      }
    },
    (err) => {
      console.warn('[SiteContent] Products subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save / Update Site Content directly in Firestore.
 * Immediately invalidates caches and updates version timestamps.
 */
export async function updateSiteContent(content: Partial<SiteBannerContent>): Promise<void> {
  const bannerDocRef = doc(db, 'site_content', 'main_banners');
  const now = Date.now();
  try {
    const updatedPayload = {
      ...content,
      version: now,
      updatedAt: serverTimestamp(),
    };
    await setDoc(
      bannerDocRef,
      updatedPayload,
      { merge: true }
    );
    purgeStaleCaches();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'site_content/main_banners');
  }
}

/**
 * Save / Update a Product in Firestore.
 * Ensures all previous values are replaced with current new values.
 */
export async function saveProduct(product: Product): Promise<void> {
  const prodRef = doc(db, 'products', product.id);
  const now = new Date().toISOString();
  try {
    const payload = {
      id: product.id,
      productId: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      rawPrice: Number(product.rawPrice) || 0,
      image: product.image,
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image],
      description: product.description || '',
      inStock: product.inStock !== false,
      sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'],
      availableSizes: Array.isArray(product.availableSizes) && product.availableSizes.length > 0 ? product.availableSizes : product.sizes || ['S', 'M', 'L', 'XL'],
      isActive: product.isActive !== false,
      isBestSeller: Boolean(product.isBestSeller),
      gender: product.gender || 'UNISEX',
      sortOrder: typeof product.sortOrder === 'number' ? product.sortOrder : 0,
      updatedAt: now,
    };

    // Overwrite document in Firestore
    await setDoc(prodRef, payload, { merge: true });

    // Sync Stocks
    const batch = writeBatch(db);
    for (const size of payload.sizes) {
      const stockId = `${product.id}_${size}`;
      const stockRef = doc(db, 'stocks', stockId);
      batch.set(
        stockRef,
        {
          id: stockId,
          productId: product.id,
          productName: product.name,
          size,
          availableQuantity: 25,
          reservedQuantity: 0,
          lowStockThreshold: 5,
          sku: `${product.id.toUpperCase()}-${size}`,
          updatedAt: now,
        },
        { merge: true }
      );
    }
    await batch.commit();

    purgeStaleCaches();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
  }
}

/**
 * Delete a Product permanently from Firestore and clean up related stocks
 */
export async function deleteProduct(productId: string): Promise<void> {
  const prodRef = doc(db, 'products', productId);
  try {
    await deleteDoc(prodRef);

    // Also clean up any associated stocks
    const stocksSnap = await getDocs(collection(db, 'stocks'));
    const batch = writeBatch(db);
    let count = 0;
    stocksSnap.forEach((d) => {
      if (d.data().productId === productId || d.id.startsWith(`${productId}_`)) {
        batch.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }

    purgeStaleCaches();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
  }
}
