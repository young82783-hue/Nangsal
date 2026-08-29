import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';

export interface CartItemStockTarget {
  productId: string;
  size: string;
  quantity: number;
  productName?: string;
}

/**
 * Deduct stock for all items in an order from Firestore.
 * Automatically updates both the individual `stocks` document and the parent `products` document.
 */
export async function deductOrderStock(
  items: Array<{
    productId?: string;
    id?: string;
    size: string;
    quantity: number;
    name?: string;
  }>
): Promise<void> {
  if (!items || items.length === 0) return;

  try {
    for (const item of items) {
      const prodId = item.productId || item.id;
      if (!prodId || !item.size) continue;

      const stockId = `${prodId}_${item.size}`;
      const stockRef = doc(db, 'stocks', stockId);
      const stockSnap = await getDoc(stockRef);

      let currentQty = 25; // Default baseline
      if (stockSnap.exists()) {
        const stockData = stockSnap.data();
        if (typeof stockData.availableQuantity === 'number') {
          currentQty = stockData.availableQuantity;
        }
      }

      const newQty = Math.max(0, currentQty - (item.quantity || 1));

      // Update stocks collection
      await setDoc(
        stockRef,
        {
          id: stockId,
          productId: prodId,
          productName: item.name || 'Nangsal Product',
          size: item.size,
          availableQuantity: newQty,
          sku: `${prodId.toUpperCase()}-${item.size}`,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Check parent product stock state
      try {
        const prodRef = doc(db, 'products', prodId);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as Product;
          let availableSizes = Array.isArray(prodData.availableSizes)
            ? [...prodData.availableSizes]
            : Array.isArray(prodData.sizes)
            ? [...prodData.sizes]
            : ['S', 'M', 'L', 'XL'];

          if (newQty === 0) {
            availableSizes = availableSizes.filter((s) => s !== item.size);
          } else if (!availableSizes.includes(item.size)) {
            availableSizes.push(item.size);
          }

          await updateDoc(prodRef, {
            availableSizes,
            inStock: availableSizes.length > 0,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (prodErr) {
        console.warn(`Could not sync parent product for ${prodId}:`, prodErr);
      }
    }
  } catch (err) {
    console.error('Error during stock deduction:', err);
  }
}

/**
 * Restores / replenishes stock when an order is cancelled or rejected.
 */
export async function replenishOrderStock(
  items: Array<{
    productId?: string;
    id?: string;
    size: string;
    quantity: number;
    name?: string;
  }>
): Promise<void> {
  if (!items || items.length === 0) return;

  try {
    for (const item of items) {
      const prodId = item.productId || item.id;
      if (!prodId || !item.size) continue;

      const stockId = `${prodId}_${item.size}`;
      const stockRef = doc(db, 'stocks', stockId);
      const stockSnap = await getDoc(stockRef);

      let currentQty = 0;
      if (stockSnap.exists()) {
        const stockData = stockSnap.data();
        if (typeof stockData.availableQuantity === 'number') {
          currentQty = stockData.availableQuantity;
        }
      }

      const newQty = currentQty + (item.quantity || 1);

      await setDoc(
        stockRef,
        {
          id: stockId,
          productId: prodId,
          productName: item.name || 'Nangsal Product',
          size: item.size,
          availableQuantity: newQty,
          sku: `${prodId.toUpperCase()}-${item.size}`,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Re-enable size on parent product
      try {
        const prodRef = doc(db, 'products', prodId);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as Product;
          let availableSizes = Array.isArray(prodData.availableSizes)
            ? [...prodData.availableSizes]
            : [];

          if (!availableSizes.includes(item.size)) {
            availableSizes.push(item.size);
          }

          await updateDoc(prodRef, {
            availableSizes,
            inStock: true,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (prodErr) {
        console.warn(`Could not sync parent product for ${prodId}:`, prodErr);
      }
    }
  } catch (err) {
    console.error('Error replenishing stock:', err);
  }
}
