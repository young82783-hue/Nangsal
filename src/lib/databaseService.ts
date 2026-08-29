import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Product,
  Banner,
  Admin,
  Stock,
  Order,
  OrderItem,
  SiteBannerContent,
  OrderStatus,
} from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';

// Default Master Banners
export const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'hero_main',
    title: 'NANGSAL APPAREL SS26',
    subtitle: 'High-density heavy cotton streetwear designed & manufactured in Kathmandu, Nepal.',
    videoUrl: 'https://cdn.phototourl.com/member/2026-08-21-ad775558-8cf9-4171-859b-513364f33166.mp4',
    posterUrl: 'https://plain-apac-prod-public.komododecks.com/202608/22/RH5VJJmvZrF7lLFh8g0o/image.jpg',
    type: 'HERO',
    gender: 'ALL',
    link: '#shop',
    badge: 'NEW DROP 01',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'luxury_manifesto',
    title: 'LUXURY STREETWEAR — REFINED FOR THE RAW ESSENCE',
    subtitle: 'From custom-milled heavyweight knits to hand-finished garments.',
    videoUrl: 'https://cdn.phototourl.com/member/2026-08-21-ad775558-8cf9-4171-859b-513364f33166.mp4',
    posterUrl: 'https://plain-apac-prod-public.komododecks.com/202608/22/h9bHZnzUOHhhRJxseRkH/image.jpg',
    type: 'LUXURY',
    gender: 'ALL',
    badge: 'MADE IN NEPAL',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'lookbook_quad',
    title: 'MORE THAN CLOTHES — A MOVEMENT IN KATHMANDU',
    subtitle: 'Lookbook collection visuals capturing raw street essence.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-08-21-fa160901-3aca-4e7c-aebb-7cad5b94b6ef.jpg',
    type: 'LOOKBOOK',
    gender: 'ALL',
    isActive: true,
    sortOrder: 3,
  },
];

// Default Super Admin Account Definition
export const DEFAULT_ADMIN: Admin = {
  id: 'admin_master',
  email: 'admin@nangsalapparel.com',
  name: 'Nangsal Master Admin',
  role: 'SUPER_ADMIN',
  permissions: {
    canManageProducts: true,
    canManageBanners: true,
    canManageStocks: true,
    canManageOrders: true,
    canManagePrices: true,
    canManageVisibility: true,
    canManageSiteContent: true,
  },
  isActive: true,
};

// ----------------------------------------------------
// 1. PRODUCTS REPOSITORY
// ----------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'products'));
  const list: Product[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    list.push({
      id: docSnap.id,
      name: data.name || '',
      category: data.category || 'TOPS',
      price: data.price || 'Rs. 0.00',
      rawPrice: typeof data.rawPrice === 'number' ? data.rawPrice : 0,
      image: data.image || '',
      images: Array.isArray(data.images) ? data.images : [data.image].filter(Boolean),
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

  return list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function subscribeToProducts(callback: (products: Product[]) => void) {
  return onSnapshot(
    collection(db, 'products'),
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || '',
          category: data.category || 'TOPS',
          price: data.price || 'Rs. 0.00',
          rawPrice: typeof data.rawPrice === 'number' ? data.rawPrice : 0,
          image: data.image || '',
          images: Array.isArray(data.images) ? data.images : [data.image].filter(Boolean),
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
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      callback(list);
    },
    (err) => {
      console.warn('Products live subscription note:', err);
    }
  );
}

export async function saveProduct(product: Product): Promise<void> {
  const docRef = doc(db, 'products', product.id);
  const existingDoc = await getDoc(docRef);
  
  const payload = {
    id: product.id,
    productId: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    rawPrice: Number(product.rawPrice) || 0,
    image: product.image,
    images: product.images && product.images.length > 0 ? product.images : [product.image],
    description: product.description || '',
    inStock: product.inStock !== false,
    sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'],
    availableSizes: product.availableSizes || product.sizes || ['S', 'M', 'L', 'XL'],
    isActive: product.isActive !== false,
    isBestSeller: Boolean(product.isBestSeller),
    gender: product.gender || 'UNISEX',
    sortOrder: typeof product.sortOrder === 'number' ? product.sortOrder : 0,
    updatedAt: new Date().toISOString(),
    ...(existingDoc.exists() ? {} : { createdAt: new Date().toISOString() }),
  };

  await setDoc(docRef, payload, { merge: true });

  // Sync initial stocks if new product
  if (!existingDoc.exists()) {
    const batch = writeBatch(db);
    for (const size of payload.sizes) {
      const stockId = `${product.id}_${size}`;
      const stockRef = doc(db, 'stocks', stockId);
      batch.set(stockRef, {
        id: stockId,
        productId: product.id,
        productName: product.name,
        size,
        availableQuantity: 25,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        sku: `${product.id.toUpperCase()}-${size}`,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId));
}

export async function updateProductPrice(productId: string, price: string, rawPrice: number): Promise<void> {
  await updateDoc(doc(db, 'products', productId), {
    price,
    rawPrice,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateProductVisibility(productId: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, 'products', productId), {
    isActive,
    updatedAt: new Date().toISOString(),
  });
}

// ----------------------------------------------------
// 2. BANNERS REPOSITORY
// ----------------------------------------------------

export async function getBanners(): Promise<Banner[]> {
  const snapshot = await getDocs(collection(db, 'banners'));
  const list: Banner[] = [];
  snapshot.forEach((docSnap) => {
    list.push({ id: docSnap.id, ...(docSnap.data() as any) });
  });
  return list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function subscribeToBanners(callback: (banners: Banner[]) => void) {
  return onSnapshot(
    collection(db, 'banners'),
    (snapshot) => {
      const list: Banner[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      callback(list);
    },
    (err) => {
      console.warn('Banners subscription note:', err);
    }
  );
}

export async function saveBanner(banner: Banner): Promise<void> {
  const docRef = doc(db, 'banners', banner.id);
  const payload = {
    ...banner,
    id: banner.id,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteBanner(bannerId: string): Promise<void> {
  await deleteDoc(doc(db, 'banners', bannerId));
}

// ----------------------------------------------------
// 3. ADMINS REPOSITORY
// ----------------------------------------------------

export async function getAdmins(): Promise<Admin[]> {
  const snapshot = await getDocs(collection(db, 'admins'));
  const list: Admin[] = [];
  snapshot.forEach((docSnap) => {
    list.push({ id: docSnap.id, ...(docSnap.data() as any) });
  });
  return list;
}

export function subscribeToAdmins(callback: (admins: Admin[]) => void) {
  return onSnapshot(
    collection(db, 'admins'),
    (snapshot) => {
      const list: Admin[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      callback(list);
    },
    (err) => {
      console.warn('Admins subscription note:', err);
    }
  );
}

export async function saveAdmin(admin: Admin): Promise<void> {
  const docRef = doc(db, 'admins', admin.id);
  await setDoc(
    docRef,
    {
      ...admin,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// ----------------------------------------------------
// 4. STOCKS REPOSITORY
// ----------------------------------------------------

export async function getStocks(): Promise<Stock[]> {
  const snapshot = await getDocs(collection(db, 'stocks'));
  const list: Stock[] = [];
  snapshot.forEach((docSnap) => {
    list.push({ id: docSnap.id, ...(docSnap.data() as any) });
  });
  return list;
}

export async function getProductStocks(productId: string): Promise<Stock[]> {
  const q = query(collection(db, 'stocks'), where('productId', '==', productId));
  const snapshot = await getDocs(q);
  const list: Stock[] = [];
  snapshot.forEach((docSnap) => {
    list.push({ id: docSnap.id, ...(docSnap.data() as any) });
  });
  return list;
}

export function subscribeToStocks(callback: (stocks: Stock[]) => void) {
  return onSnapshot(
    collection(db, 'stocks'),
    (snapshot) => {
      const list: Stock[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      callback(list);
    },
    (err) => {
      console.warn('Stocks subscription note:', err);
    }
  );
}

export function subscribeToProductStocks(productId: string, callback: (stocks: Stock[]) => void) {
  const q = query(collection(db, 'stocks'), where('productId', '==', productId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Stock[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      callback(list);
    },
    (err) => {
      console.warn(`Stocks subscription note for ${productId}:`, err);
    }
  );
}

export async function saveStock(stock: Stock): Promise<void> {
  const docRef = doc(db, 'stocks', stock.id);
  await setDoc(
    docRef,
    {
      ...stock,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function batchUpdateStocks(stockUpdates: Partial<Stock>[]): Promise<void> {
  const batch = writeBatch(db);
  for (const item of stockUpdates) {
    if (item.id) {
      const stockRef = doc(db, 'stocks', item.id);
      batch.set(
        stockRef,
        {
          ...item,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  }
  await batch.commit();
}

/**
 * Atomically decrements variant stock levels when an order is placed
 */
export async function decrementStockForOrder(items: OrderItem[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const size = item.selectedSize || item.size || 'M';
      const stockId = `${item.productId}_${size}`;
      const stockRef = doc(db, 'stocks', stockId);
      
      // Decrement availableQuantity
      batch.update(stockRef, {
        availableQuantity: increment(-Math.max(1, item.quantity)),
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  } catch (e) {
    console.warn('Stock decrement note:', e);
  }
}

// ----------------------------------------------------
// 5. ORDERS REPOSITORY
// ----------------------------------------------------

export async function getOrders(): Promise<Order[]> {
  const snapshot = await getDocs(collection(db, 'orders'));
  const list: Order[] = [];
  snapshot.forEach((docSnap) => {
    list.push({ id: docSnap.id, ...(docSnap.data() as any) });
  });
  return list.sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  return onSnapshot(
    collection(db, 'orders'),
    (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      list.sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
      callback(list);
    },
    (err) => {
      console.warn('Orders live subscription note:', err);
    }
  );
}

export async function createOrder(orderPayload: Omit<Order, 'id'> & { id?: string }): Promise<string> {
  const orderDocId = orderPayload.id || `order_${Date.now().toString().slice(-8)}`;
  const orderRef = doc(db, 'orders', orderDocId);

  const cleanOrder: Order = {
    id: orderDocId,
    orderNumber: orderPayload.orderNumber || `NANGSAL-${Math.floor(100000 + Math.random() * 900000)}`,
    items: orderPayload.items.map((it) => ({
      productId: it.productId,
      name: it.name,
      selectedSize: it.selectedSize || it.size || 'M',
      quantity: it.quantity || 1,
      priceAtPurchase: it.priceAtPurchase || it.rawPrice || 0,
      formattedPrice: it.formattedPrice || it.price || 'Rs. 0.00',
      image: it.image || '',
      category: it.category || 'TOPS',
    })),
    productIds: orderPayload.items.map((i) => i.productId),
    selectedSizes: orderPayload.items.map((i) => i.selectedSize || i.size || 'M'),
    quantities: orderPayload.items.map((i) => i.quantity || 1),
    totalAmount: orderPayload.totalAmount,
    currency: orderPayload.currency || 'NPR',
    fullName: orderPayload.fullName,
    phoneNumber: orderPayload.phoneNumber,
    city: orderPayload.city,
    deliveryAddress: orderPayload.deliveryAddress,
    orderNotes: orderPayload.orderNotes || '',
    paymentMethod: orderPayload.paymentMethod || 'COD',
    transactionId: orderPayload.transactionId || '',
    uploadedReceipt: orderPayload.uploadedReceipt || '',
    status: orderPayload.status || 'PENDING_VERIFICATION',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(orderPayload.userId ? { userId: orderPayload.userId } : {}),
  };

  await setDoc(orderRef, cleanOrder);

  // Automatically update stock levels in the stocks collection
  await decrementStockForOrder(cleanOrder.items);

  return orderDocId;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}

// ----------------------------------------------------
// 6. BOOTSTRAP & SEEDING ROUTINE
// ----------------------------------------------------

export async function bootstrapAllFirestoreDataIfNeeded(): Promise<void> {
  try {
    // 1. Bootstrap Products
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      console.log('Seeding initial products into Firestore...');
      const batch = writeBatch(db);
      for (let i = 0; i < INITIAL_PRODUCTS.length; i++) {
        const prod = INITIAL_PRODUCTS[i];
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
          inStock: prod.inStock,
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
      console.log('Products seeded successfully.');
    }

    // 2. Bootstrap Banners
    const bannersSnap = await getDocs(collection(db, 'banners'));
    if (bannersSnap.empty) {
      console.log('Seeding default banners into Firestore...');
      const batch = writeBatch(db);
      for (const banner of DEFAULT_BANNERS) {
        const ref = doc(db, 'banners', banner.id);
        batch.set(ref, {
          ...banner,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
      console.log('Banners seeded successfully.');
    }

    // 3. Bootstrap Admin
    const adminsSnap = await getDocs(collection(db, 'admins'));
    if (adminsSnap.empty) {
      console.log('Seeding default master admin...');
      await setDoc(doc(db, 'admins', DEFAULT_ADMIN.id), {
        ...DEFAULT_ADMIN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('Admin seeded successfully.');
    }

    // 4. Bootstrap Stocks
    const stocksSnap = await getDocs(collection(db, 'stocks'));
    if (stocksSnap.empty) {
      console.log('Seeding initial stocks collection...');
      const batch = writeBatch(db);
      for (const prod of INITIAL_PRODUCTS) {
        for (const size of prod.sizes) {
          const stockId = `${prod.id}_${size}`;
          const ref = doc(db, 'stocks', stockId);
          batch.set(ref, {
            id: stockId,
            productId: prod.id,
            productName: prod.name,
            size,
            availableQuantity: 30,
            reservedQuantity: 0,
            lowStockThreshold: 5,
            sku: `${prod.id.toUpperCase()}-${size}`,
            updatedAt: new Date().toISOString(),
          });
        }
      }
      await batch.commit();
      console.log('Stocks collection seeded successfully.');
    }
  } catch (err) {
    console.warn('Bootstrap note:', err);
  }
}
