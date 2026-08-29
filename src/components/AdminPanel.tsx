import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Video,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  TrendingUp,
  Clock,
  Truck,
  DollarSign,
  Boxes,
  Upload,
  MessageCircle,
  Eye,
  Sparkles,
  ShieldCheck,
  Phone,
  MapPin,
  Menu,
} from 'lucide-react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { auth, googleAuthProvider, db } from '../lib/firebase';
import { uploadImageToStorage } from '../lib/storageManager';
import {
  SiteBannerContent,
  DEFAULT_SITE_CONTENT,
  DEFAULT_NAV_BUTTONS,
  updateSiteContent,
  saveProduct,
  deleteProduct,
} from '../lib/siteContent';
import { Product } from '../types';
import { purgeStaleCaches, forceHardReload } from '../lib/cacheManager';
import { replenishOrderStock } from '../lib/stockManager';
import { AdminProductModal } from './AdminProductModal';

// Allowed Super Admin Google Emails
const AUTHORIZED_ADMIN_EMAILS = [
  'young82783@gmail.com',
  'admin@nangsalapparel.com',
  'sunil@nangsalapparel.com',
];

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  siteContent: SiteBannerContent;
  products: Product[];
  onNavigateHome: () => void;
}

type AdminTab =
  | 'DASHBOARD'
  | 'ORDERS'
  | 'PRODUCTS'
  | 'STOCK'
  | 'BANNERS'
  | 'SETTINGS';

interface OrderItem {
  id: string;
  orderNumber?: string;
  fullName: string;
  phoneNumber: string;
  city?: string;
  deliveryAddress: string;
  deliveryLocation?: {
    name: string;
    zone: string;
    zoneLabel: string;
    charge: number;
  };
  deliveryCharge?: number;
  paymentMethod: string;
  totalAmount: number;
  subtotal?: number;
  items: Array<{
    id?: string;
    productId?: string;
    name: string;
    size: string;
    quantity: number;
    price?: string;
    rawPrice?: number;
    image?: string;
  }>;
  status: 'PENDING_VERIFICATION' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus?: string;
  uploadedReceipt?: string;
  paymentScreenshot?: string;
  transactionId?: string;
  orderNotes?: string;
  createdAt?: any;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  siteContent,
  products,
  onNavigateHome,
}) => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Firestore State
  const [liveOrders, setLiveOrders] = useState<OrderItem[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderItem | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  // Live Stocks State
  const [stockRecords, setStockRecords] = useState<any[]>([]);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingProductStock, setEditingProductStock] = useState<Record<string, number>>({});
  const [isNewProduct, setIsNewProduct] = useState(false);

  // Banner Editing State
  const [bannerForm, setBannerForm] = useState<SiteBannerContent>(siteContent);
  const [isSavingBanners, setIsSavingBanners] = useState(false);
  const [bannerSaveSuccess, setBannerSaveSuccess] = useState(false);
  const [uploadingBannerField, setUploadingBannerField] = useState<string | null>(null);

  // 1. Firebase Auth Listener & Admin Authorization Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticating(true);
      if (user) {
        setCurrentUser(user);
        const email = user.email?.toLowerCase().trim() || '';
        
        // Check if user is in authorized superadmin list
        const isSuperAdminEmail = AUTHORIZED_ADMIN_EMAILS.some(
          (adminEmail) => adminEmail.toLowerCase() === email
        );

        if (isSuperAdminEmail) {
          setIsAdminAuthorized(true);
          setAuthError('');
          // Upsert admin record in Firestore
          try {
            await setDoc(
              doc(db, 'admins', user.uid),
              {
                id: user.uid,
                email: user.email,
                name: user.displayName || 'Admin',
                role: 'SUPER_ADMIN',
                isActive: true,
                lastLogin: serverTimestamp(),
              },
              { merge: true }
            );
          } catch (e) {
            console.warn('Admin record sync notice:', e);
          }
        } else {
          // Check if admin doc exists in Firestore /admins collection
          try {
            const adminDoc = await getDocs(collection(db, 'admins'));
            let found = false;
            adminDoc.forEach((d) => {
              const data = d.data();
              if (
                data.email?.toLowerCase() === email ||
                d.id === user.uid
              ) {
                if (data.isActive !== false) {
                  found = true;
                }
              }
            });

            if (found) {
              setIsAdminAuthorized(true);
              setAuthError('');
            } else {
              // Unauthorized user: revoke session & sign out
              await signOut(auth);
              setCurrentUser(null);
              setIsAdminAuthorized(false);
              setAuthError(
                `Access Denied: ${user.email} is not registered as an authorized administrator for NANGSAL APPAREL.`
              );
            }
          } catch (err) {
            await signOut(auth);
            setCurrentUser(null);
            setIsAdminAuthorized(false);
            setAuthError('Authentication error. Please contact the store owner.');
          }
        }
      } else {
        setCurrentUser(null);
        setIsAdminAuthorized(false);
      }
      setIsAuthenticating(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Orders Subscription from Firestore
  useEffect(() => {
    if (!isAdminAuthorized) return;
    try {
      const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const list: OrderItem[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setLiveOrders(list);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Orders subscription error:', e);
    }
  }, [isAdminAuthorized]);

  // 3. Real-time Stocks Subscription from Firestore
  useEffect(() => {
    if (!isAdminAuthorized) return;
    try {
      const unsub = onSnapshot(collection(db, 'stocks'), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        setStockRecords(list);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Stocks subscription error:', e);
    }
  }, [isAdminAuthorized]);

  // Sync banner form with prop updates
  useEffect(() => {
    setBannerForm(siteContent || DEFAULT_SITE_CONTENT);
  }, [siteContent]);

  // Handler for Google Sign-In
  const handleGoogleSignIn = async () => {
    setAuthError('');
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      setAuthError(error?.message || 'Google sign-in failed. Please try again.');
      setIsAuthenticating(false);
    }
  };

  // Handler for Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdminAuthorized(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Handler to Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderItem['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const prevOrder = liveOrders.find((o) => o.id === orderId);

      await updateDoc(orderRef, {
        status: newStatus,
        orderStatus: newStatus,
        updatedAt: serverTimestamp(),
      });

      // If status changed to CANCELLED and was not previously CANCELLED, restore stock
      if (newStatus === 'CANCELLED' && prevOrder && prevOrder.status !== 'CANCELLED' && prevOrder.items) {
        await replenishOrderStock(prevOrder.items);
      }

      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (e) {
      console.error('Failed to update order status:', e);
      alert('Failed to update order status.');
    }
  };

  // Helper to open Add Product Modal
  const handleOpenAddProductModal = () => {
    const defaultSizes = ['S', 'M', 'L', 'XL'];
    setEditingProduct({
      sizes: defaultSizes,
      availableSizes: defaultSizes,
      category: 'T-SHIRTS',
      gender: 'UNISEX',
      inStock: true,
      isActive: true,
      price: 'Rs. 2,500',
      name: '',
      description: '',
      image: '',
      images: [],
    });
    const initialStock: Record<string, number> = {};
    defaultSizes.forEach((sz) => {
      initialStock[sz] = 25;
    });
    setEditingProductStock(initialStock);
    setIsNewProduct(true);
    setIsProductModalOpen(true);
  };

  // Helper to open Edit Product Modal
  const handleOpenEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setIsNewProduct(false);
    const loadedStock: Record<string, number> = {};
    const productSizes =
      product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'];
    productSizes.forEach((sz) => {
      const stockDoc = stockRecords.find(
        (s) => s.productId === product.id && s.size === sz
      );
      loadedStock[sz] = stockDoc?.availableQuantity ?? 25;
    });
    setEditingProductStock(loadedStock);
    setIsProductModalOpen(true);
  };

  // Save product logic (called from AdminProductModal)
  const handleSaveProductFromModal = async (
    savedProduct: Partial<Product>,
    stockMap: Record<string, number>,
    images: string[]
  ) => {
    const productId =
      savedProduct.id ||
      `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const rawPriceNumber =
      Number(
        String(savedProduct.price || '0').replace(/[^0-9.]/g, '')
      ) || savedProduct.rawPrice || 0;

    const productSizes =
      savedProduct.sizes && savedProduct.sizes.length > 0
        ? savedProduct.sizes
        : ['S', 'M', 'L', 'XL'];

    const availableSizes = productSizes.filter(
      (sz) => (stockMap[sz] ?? 25) > 0
    );

    const fullProduct: Product = {
      id: productId,
      productId: productId,
      name: savedProduct.name?.trim() || 'Nangsal Product',
      category: (savedProduct.category as any) || 'T-SHIRTS',
      price: savedProduct.price?.trim().startsWith('Rs.')
        ? savedProduct.price?.trim()
        : `Rs. ${savedProduct.price?.trim()}`,
      rawPrice: rawPriceNumber,
      image:
        images[0] ||
        savedProduct.image ||
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
      images: images.length > 0 ? images : [savedProduct.image || ''],
      description: savedProduct.description || '',
      inStock: availableSizes.length > 0 && savedProduct.inStock !== false,
      sizes: productSizes,
      availableSizes:
        availableSizes.length > 0
          ? availableSizes
          : savedProduct.inStock !== false
          ? productSizes
          : [],
      isActive: savedProduct.isActive !== false,
      isBestSeller: Boolean(savedProduct.isBestSeller),
      gender: (savedProduct.gender as any) || 'UNISEX',
      sortOrder:
        typeof savedProduct.sortOrder === 'number'
          ? savedProduct.sortOrder
          : products.length + 1,
    };

    await saveProduct(fullProduct);

    // Save stock records in Firestore for each enabled size
    for (const sz of productSizes) {
      const stockId = `${productId}_${sz}`;
      const stockQty =
        typeof stockMap[sz] === 'number' ? Math.max(0, stockMap[sz]) : 25;
      try {
        await setDoc(
          doc(db, 'stocks', stockId),
          {
            id: stockId,
            productId,
            productName: fullProduct.name,
            size: sz,
            availableQuantity: stockQty,
            sku: `${productId.toUpperCase()}-${sz}`,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (stockErr) {
        console.warn(`Failed to sync stock doc for ${stockId}:`, stockErr);
      }
    }
  };

  // Handler to Delete Product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (
      confirm(
        `Are you sure you want to permanently delete "${productName}" from the store catalog?`
      )
    ) {
      try {
        await deleteProduct(productId);
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete product.');
      }
    }
  };

  // Handler to set exact stock for a size
  const handleSetExactStock = async (
    productId: string,
    size: string,
    exactQty: number
  ) => {
    const stockId = `${productId}_${size}`;
    const newQty = Math.max(0, exactQty);
    try {
      const prod = products.find((p) => p.id === productId);
      await setDoc(
        doc(db, 'stocks', stockId),
        {
          id: stockId,
          productId,
          productName: prod?.name || '',
          size,
          availableQuantity: newQty,
          sku: `${productId.toUpperCase()}-${size}`,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Check if product needs stock update
      if (prod) {
        let updatedAvailable = [...(prod.availableSizes || prod.sizes || [])];
        if (newQty === 0) {
          updatedAvailable = updatedAvailable.filter((s) => s !== size);
        } else if (!updatedAvailable.includes(size)) {
          updatedAvailable.push(size);
        }
        await updateDoc(doc(db, 'products', productId), {
          availableSizes: updatedAvailable,
          inStock: updatedAvailable.length > 0,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Failed to update stock:', e);
    }
  };

  // Handler to Adjust Stock for a size by +/- delta
  const handleAdjustStock = async (
    productId: string,
    size: string,
    delta: number,
    currentQty: number
  ) => {
    const newQty = Math.max(0, currentQty + delta);
    await handleSetExactStock(productId, size, newQty);
  };

  // Handler to Save Banners & Site Content
  const handleSaveBanners = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBanners(true);
    setBannerSaveSuccess(false);
    try {
      await updateSiteContent(bannerForm);
      setBannerSaveSuccess(true);
      setTimeout(() => setBannerSaveSuccess(false), 4000);
    } catch (e: any) {
      console.error('Failed to save banners:', e);
      alert(`Failed to save banners: ${e?.message || e}`);
    } finally {
      setIsSavingBanners(false);
    }
  };

  // Dedicated helper to upload media file for any specific banner field
  const handleUploadBannerPhoto = async (
    fieldKey: keyof SiteBannerContent,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBannerField(String(fieldKey));
    try {
      const url = await uploadImageToStorage(file, 'banners');
      setBannerForm((prev) => ({
        ...prev,
        [fieldKey]: url,
      }));
    } catch (err) {
      console.error(`Upload failed for banner field ${String(fieldKey)}:`, err);
      alert('Failed to upload banner media. Please try again.');
    } finally {
      setUploadingBannerField(null);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return liveOrders.filter((order) => {
      const matchesFilter =
        orderStatusFilter === 'ALL' || order.status === orderStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.fullName?.toLowerCase().includes(q) ||
        order.phoneNumber?.includes(q) ||
        order.id?.toLowerCase().includes(q) ||
        order.city?.toLowerCase().includes(q) ||
        order.deliveryAddress?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [liveOrders, orderStatusFilter, searchQuery]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Dashboard Stats Calculations
  const stats = useMemo(() => {
    const totalSales = liveOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = liveOrders.filter(
      (o) => o.status === 'PENDING_VERIFICATION'
    ).length;
    const deliveredOrders = liveOrders.filter(
      (o) => o.status === 'DELIVERED'
    ).length;
    const outOfStockCount = products.filter((p) => p.inStock === false).length;

    return {
      totalSales,
      pendingOrders,
      deliveredOrders,
      totalProducts: products.length,
      outOfStockCount,
    };
  }, [liveOrders, products]);

  if (!isOpen) return null;

  // =========================================================================
  // VIEW 1: ADMIN LOGIN SCREEN (If not authorized)
  // =========================================================================
  if (!currentUser || !isAdminAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-b from-[#C9E6FD] via-[#DCEEFD] to-[#EEF7FE] overflow-y-auto">
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-40">
          <div className="w-[800px] h-[800px] rounded-full border border-white/60 -translate-y-12 animate-pulse" />
          <div className="w-[1100px] h-[1100px] rounded-full border border-white/40 -translate-y-12" />
        </div>

        {/* Return to Store button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-white/70 hover:bg-white text-neutral-600 transition-all shadow-sm backdrop-blur-md cursor-pointer"
          title="Return to Store"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Centered Login Card */}
        <div className="relative z-10 w-full max-w-[420px] bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_24px_60px_rgba(30,50,90,0.12)] rounded-[32px] p-8 sm:p-10 text-center">
          <div className="w-14 h-14 bg-white/95 rounded-2xl shadow-sm border border-neutral-100/90 flex items-center justify-center mx-auto mb-6">
            <span className="font-mono text-xl font-bold text-neutral-800">&rarr;]</span>
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Admin Panel
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 mb-8 leading-relaxed max-w-[280px] mx-auto">
            Sign in to securely manage your store.
          </p>

          {authError && (
            <div className="mb-6 p-3.5 bg-red-50/90 border border-red-200/80 rounded-2xl text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-snug font-medium">
                {authError}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-6 bg-white hover:bg-neutral-50 active:scale-[0.98] border border-neutral-200/90 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 font-semibold text-sm text-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>
                {isAuthenticating ? 'Authenticating...' : 'Continue with Google'}
              </span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-100/80 flex items-center justify-center gap-1.5 text-[11px] font-mono text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Firebase Security &bull; Admin Access Only</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD (Mobile & Desktop Responsive)
  // =========================================================================
  const pendingOrdersCount = liveOrders.filter((o) => o.status === 'PENDING_VERIFICATION').length;

  const NAV_ITEMS = [
    { id: 'DASHBOARD' as AdminTab, label: 'Dashboard', icon: TrendingUp },
    {
      id: 'ORDERS' as AdminTab,
      label: 'Orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
    },
    {
      id: 'PRODUCTS' as AdminTab,
      label: 'Products',
      icon: Package,
      badge: products.length,
    },
    { id: 'STOCK' as AdminTab, label: 'Stock', icon: Boxes },
    { id: 'BANNERS' as AdminTab, label: 'Banners', icon: Sparkles },
    { id: 'SETTINGS' as AdminTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6FB] flex items-center justify-center p-0 md:p-4 sm:p-6 overflow-hidden">
      {/* Outer Dashboard Card */}
      <div className="w-full h-full md:max-w-[1440px] md:h-[94vh] bg-white md:rounded-[28px] shadow-[0_10px_50px_rgba(0,0,0,0.06)] border border-neutral-100 flex flex-col md:flex-row overflow-hidden pb-14 md:pb-0">
        
        {/* ================================================================= */}
        {/* DESKTOP SIDEBAR */}
        {/* ================================================================= */}
        <aside className="hidden md:flex w-64 bg-white border-r border-neutral-100 p-5 flex-col justify-between flex-shrink-0">
          <div>
            {/* Top Brand Header */}
            <div className="flex items-center gap-3 pb-6 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm tracking-tighter">
                N
              </div>
              <div>
                <h2 className="font-mono text-sm font-black tracking-wider text-black">
                  NANGSAL
                </h2>
                <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-widest">
                  Control Desk
                </p>
              </div>
            </div>

            {/* Navigation Menu Links */}
            <nav className="mt-6 space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#FFF0EE] text-[#E0533C] font-bold shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#E0533C]' : 'text-neutral-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isActive
                            ? 'bg-[#E0533C] text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Lower Sidebar: Logout */}
          <div className="pt-6 border-t border-neutral-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-neutral-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4 text-neutral-400" />
                <span>Logout</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Sign out</span>
            </button>
          </div>
        </aside>

        {/* ================================================================= */}
        {/* MAIN DASHBOARD AREA */}
        {/* ================================================================= */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          
          {/* Top Bar (Mobile + Desktop Responsive) */}
          <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-100 flex items-center justify-between gap-3 flex-shrink-0 bg-white">
            {/* Left: Mobile Brand & Search */}
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <div className="md:hidden w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs font-mono flex-shrink-0">
                N
              </div>
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders, products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-[#F8F9FD] border border-neutral-200/70 rounded-full text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                />
              </div>
            </div>

            {/* Header Right: Storefront Link & Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-[11px] sm:text-xs font-mono font-medium text-neutral-700 transition-colors cursor-pointer"
              >
                <span>Live Store</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </button>

              {/* Profile Avatar */}
              <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser?.displayName?.charAt(0) || 'A'
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-neutral-900 leading-tight">
                    {currentUser?.displayName || 'Store Admin'}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    Super Admin
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAFBFE]">
            
            {/* ============================================================= */}
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {/* ============================================================= */}
            {activeTab === 'DASHBOARD' && (
              <div className="space-y-6 max-w-6xl">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                    Store Overview
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Real-time operational health and metrics for NANGSAL APPAREL.
                  </p>
                </div>

                {/* 4 Primary Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-[10px] sm:text-xs font-mono uppercase font-bold">Total Sales</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-black text-neutral-900 font-mono">
                      Rs. {stats.totalSales.toLocaleString()}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-emerald-600 font-mono flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Live revenue recorded
                    </p>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-[10px] sm:text-xs font-mono uppercase font-bold">Pending</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-600">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-black text-neutral-900 font-mono">
                      {stats.pendingOrders}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-amber-600 font-mono">
                      Awaiting verification
                    </p>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-[10px] sm:text-xs font-mono uppercase font-bold">Products</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600">
                        <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-black text-neutral-900 font-mono">
                      {stats.totalProducts}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-neutral-500 font-mono">
                      Active store styles
                    </p>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-[10px] sm:text-xs font-mono uppercase font-bold">Delivered</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-purple-50 text-purple-600">
                        <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-black text-neutral-900 font-mono">
                      {stats.deliveredOrders}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-purple-600 font-mono">
                      Completed fulfillments
                    </p>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 space-y-3">
                    <h3 className="font-bold text-sm text-neutral-900">Quick Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleOpenAddProductModal}
                        className="px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 hover:bg-neutral-800 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>Add New Product</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('ORDERS')}
                        className="px-4 py-2.5 bg-neutral-100 text-neutral-800 rounded-xl text-xs font-mono font-bold hover:bg-neutral-200 cursor-pointer"
                      >
                        Review Orders ({liveOrders.length})
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 space-y-2">
                    <h3 className="font-bold text-sm text-neutral-900">System Cache</h3>
                    <p className="text-xs text-neutral-500">
                      Instant cache flush forces all clients and phones to refresh directly from Firestore.
                    </p>
                    <button
                      onClick={() => {
                        purgeStaleCaches();
                        forceHardReload();
                      }}
                      className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      Purge Cache &amp; Reload
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: ORDERS (Responsive Mobile Cards + Desktop Table) */}
            {/* ============================================================= */}
            {activeTab === 'ORDERS' && (
              <div className="space-y-4 max-w-7xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                      Order Management ({liveOrders.length})
                    </h1>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Live customer orders synced directly from Firestore.
                    </p>
                  </div>

                  {/* Status Filters Bar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'PENDING_VERIFICATION', label: 'Pending' },
                      { id: 'PROCESSING', label: 'Processing' },
                      { id: 'DISPATCHED', label: 'Dispatched' },
                      { id: 'DELIVERED', label: 'Delivered' },
                      { id: 'CANCELLED', label: 'Cancelled' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setOrderStatusFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer ${
                          orderStatusFilter === tab.id
                            ? 'bg-neutral-900 text-white font-bold shadow-sm'
                            : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MOBILE ORDER CARDS (< 768px) */}
                <div className="md:hidden space-y-3">
                  {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-xs text-neutral-400 font-mono border border-neutral-100">
                      No orders found for this status.
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-sm space-y-3"
                      >
                        {/* Header: Order ID + Status */}
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                          <div>
                            <span className="text-xs font-mono font-bold text-neutral-900">
                              #{order.orderNumber || order.id.slice(0, 8)}
                            </span>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recent'}
                            </p>
                          </div>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order.id, e.target.value as OrderItem['status'])
                            }
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border-0 cursor-pointer ${
                              order.status === 'DELIVERED'
                                ? 'bg-purple-100 text-purple-800'
                                : order.status === 'DISPATCHED'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'PROCESSING'
                                ? 'bg-amber-100 text-amber-800'
                                : order.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            <option value="PENDING_VERIFICATION">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="DISPATCHED">Dispatched</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>

                        {/* Customer Info & Contact Buttons */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className="font-bold text-xs text-neutral-900">{order.fullName}</p>
                            <p className="text-[11px] text-neutral-500 font-mono">{order.phoneNumber}</p>
                            <p className="text-[10px] text-neutral-400">
                              {order.deliveryLocation?.name || order.city} &bull; {order.deliveryAddress}
                            </p>
                          </div>

                          {/* Quick 1-Tap Actions: Call & WhatsApp */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <a
                              href={`tel:${order.phoneNumber}`}
                              className="p-2 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                              title="Call customer"
                            >
                              <Phone className="w-4 h-4 text-neutral-700" />
                            </a>
                            <a
                              href={`https://wa.me/${order.phoneNumber.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                                order.fullName
                              )},%20regarding%20your%20NANGSAL%20order%20%23${order.id.slice(0, 8)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              title="WhatsApp chat"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </div>

                        {/* Items Summary */}
                        <div className="bg-neutral-50 p-2.5 rounded-xl space-y-1 text-xs">
                          {order.items?.map((it, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-neutral-800 font-medium truncate max-w-[200px]">
                                {it.name} ({it.size}) &times; {it.quantity}
                              </span>
                              <span className="text-neutral-500">{it.price || ''}</span>
                            </div>
                          ))}
                        </div>

                        {/* Payment & Amount */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <div>
                            <span className="font-mono text-neutral-600">{order.paymentMethod}</span>
                            {(order.uploadedReceipt || order.paymentScreenshot) && (
                              <button
                                onClick={() =>
                                  setViewingReceiptUrl(
                                    order.uploadedReceipt || order.paymentScreenshot || null
                                  )
                                }
                                className="block text-[10px] font-mono text-emerald-600 font-bold hover:underline"
                              >
                                View QR Screenshot &rarr;
                              </button>
                            )}
                          </div>
                          <p className="text-sm font-black font-mono text-neutral-900">
                            Rs. {order.totalAmount?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* DESKTOP ORDERS TABLE (>= 768px) */}
                <div className="hidden md:block bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F9FAFC] border-b border-neutral-100 text-neutral-400 font-mono text-[11px] uppercase">
                        <tr>
                          <th className="py-3.5 px-4 font-semibold">Order ID</th>
                          <th className="py-3.5 px-4 font-semibold">Customer</th>
                          <th className="py-3.5 px-4 font-semibold">Location</th>
                          <th className="py-3.5 px-4 font-semibold">Items</th>
                          <th className="py-3.5 px-4 font-semibold">Payment</th>
                          <th className="py-3.5 px-4 font-semibold">Total</th>
                          <th className="py-3.5 px-4 font-semibold">Status</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-neutral-400 font-mono">
                              No orders found matching the selected criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-[#F9FAFC] transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                                #{order.orderNumber || order.id.slice(0, 8)}
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-bold text-neutral-900">{order.fullName}</p>
                                <p className="text-[11px] text-neutral-500 font-mono">{order.phoneNumber}</p>
                              </td>
                              <td className="py-3.5 px-4 max-w-[180px]">
                                <p className="font-medium text-neutral-800 truncate">
                                  {order.deliveryLocation?.name || order.city || 'Kathmandu'}
                                </p>
                                <p className="text-[10px] text-neutral-400 truncate">
                                  {order.deliveryAddress}
                                </p>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-semibold text-neutral-700">
                                  {order.items?.length || 1} item(s)
                                </span>
                                <div className="text-[10px] text-neutral-400 truncate max-w-[160px]">
                                  {order.items?.map((it) => `${it.name} (${it.size})`).join(', ')}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-neutral-800">
                                  {order.paymentMethod}
                                </span>
                                {(order.uploadedReceipt || order.paymentScreenshot) && (
                                  <button
                                    onClick={() =>
                                      setViewingReceiptUrl(
                                        order.uploadedReceipt || order.paymentScreenshot || null
                                      )
                                    }
                                    className="block mt-1 text-[10px] font-mono text-emerald-600 hover:underline font-bold"
                                  >
                                    View Receipt &rarr;
                                  </button>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-black text-neutral-900">
                                Rs. {order.totalAmount?.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4">
                                <select
                                  value={order.status}
                                  onChange={(e) =>
                                    handleUpdateOrderStatus(
                                      order.id,
                                      e.target.value as OrderItem['status']
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border-0 focus:ring-1 focus:ring-neutral-400 cursor-pointer ${
                                    order.status === 'DELIVERED'
                                      ? 'bg-purple-100 text-purple-800'
                                      : order.status === 'DISPATCHED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : order.status === 'PROCESSING'
                                      ? 'bg-amber-100 text-amber-800'
                                      : order.status === 'CANCELLED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                                  <option value="PROCESSING">Processing</option>
                                  <option value="DISPATCHED">Dispatched</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={`https://wa.me/${order.phoneNumber.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                                      order.fullName
                                    )},%20regarding%20your%20NANGSAL%20order%20%23${order.id.slice(0, 8)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                    title="Contact via WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    onClick={() => setSelectedOrderDetails(order)}
                                    className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                                    title="View Full Order"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 3: PRODUCTS (Full Catalog & Quick Mobile Add Product) */}
            {/* ============================================================= */}
            {activeTab === 'PRODUCTS' && (
              <div className="space-y-4 max-w-7xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                      Product Catalog ({products.length})
                    </h1>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Manage product styles, pricing, sizes, inventory, and pictures.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenAddProductModal}
                    className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all self-start shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Add New Product</span>
                  </button>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {/* Thumbnail Image */}
                        <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden">
                          <img
                            src={product.image || product.images?.[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Stock Status Badge */}
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shadow-sm ${
                                product.inStock !== false
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
                            </span>
                            {product.isBestSeller && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-black uppercase shadow-sm">
                                Best Seller
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-4 space-y-1">
                          <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                            {product.category} &bull; {product.gender || 'UNISEX'}
                          </p>
                          <h3 className="font-bold text-sm text-neutral-900 truncate">
                            {product.name}
                          </h3>
                          <p className="font-mono font-black text-sm text-neutral-900">
                            {product.price}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            Sizes: {(product.availableSizes || product.sizes || []).join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="p-4 pt-0 flex items-center justify-between border-t border-neutral-100/60 mt-2">
                        <button
                          onClick={() => handleOpenEditProductModal(product)}
                          className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: STOCK MANAGEMENT BY SIZE */}
            {/* ============================================================= */}
            {activeTab === 'STOCK' && (
              <div className="space-y-4 max-w-6xl">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                    Stock &amp; Inventory Management
                  </h1>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Real-time stock controls by size. Adjustments synchronize automatically to customer store.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100">
                  {products.map((product) => (
                    <div key={product.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Product Thumbnail & Title */}
                      <div className="flex items-center gap-3.5">
                        <img
                          src={product.image || product.images?.[0]}
                          alt={product.name}
                          className="w-12 h-16 object-cover rounded-lg bg-neutral-100 flex-shrink-0"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-neutral-900">
                            {product.name}
                          </h3>
                          <p className="text-xs text-neutral-400 font-mono">
                            {product.category} &bull; {product.price}
                          </p>
                        </div>
                      </div>

                      {/* Size Controls with Large Stepper Touch Targets */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {['S', 'M', 'L', 'XL'].map((size) => {
                          const stockItem = stockRecords.find(
                            (s) => s.productId === product.id && s.size === size
                          );
                          const qty = stockItem?.availableQuantity ?? 25;
                          const isAvailable = (product.availableSizes || product.sizes || []).includes(size);

                          return (
                            <div
                              key={size}
                              className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                                isAvailable && qty > 0
                                  ? 'bg-neutral-50 border-neutral-200'
                                  : 'bg-red-50/60 border-red-200 text-red-800'
                              }`}
                            >
                              <span className="font-mono font-bold text-xs uppercase w-6 text-center">
                                {size}:
                              </span>

                              <button
                                type="button"
                                onClick={() => handleAdjustStock(product.id, size, -1, qty)}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center font-bold text-xs active:scale-95 cursor-pointer"
                              >
                                -
                              </button>

                              <input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                  handleSetExactStock(product.id, size, val);
                                }}
                                className="w-12 text-center font-mono font-bold text-xs bg-white border border-neutral-200 rounded py-1 focus:outline-none focus:ring-1 focus:ring-black"
                              />

                              <button
                                type="button"
                                onClick={() => handleAdjustStock(product.id, size, +1, qty)}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center font-bold text-xs active:scale-95 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 5: BANNERS & DYNAMIC SITE CONTENT */}
            {/* ============================================================= */}
            {activeTab === 'BANNERS' && (
              <form onSubmit={handleSaveBanners} className="space-y-6 max-w-5xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                      Banner &amp; Media Management
                    </h1>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Upload hero media and lookbook photos directly from device gallery.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingBanners}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 self-start cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isSavingBanners ? 'Saving to Firebase...' : 'Save All Changes'}</span>
                  </button>
                </div>

                {bannerSaveSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All banner updates saved to Firestore!</span>
                  </div>
                )}

                {/* Hero Video / Photo */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <Video className="w-4 h-4 text-neutral-800" />
                    <h3 className="font-bold text-sm text-neutral-900">
                      Hero Section Media &amp; Top Bar
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold text-neutral-800 uppercase">
                          Hero Media (Video / Photo)
                        </label>
                        <label className="text-xs font-mono font-bold bg-neutral-900 text-white px-3 py-1.5 rounded-xl hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5 transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingBannerField === 'heroVideoUrl' ? 'Uploading...' : 'Choose File'}</span>
                          <input
                            type="file"
                            accept="video/*,image/*"
                            onChange={(e) => handleUploadBannerPhoto('heroVideoUrl', e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {bannerForm.heroVideoUrl ? (
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-20 bg-black rounded-xl overflow-hidden flex-shrink-0 border border-neutral-300 relative">
                            {bannerForm.heroVideoUrl.includes('.mp4') || bannerForm.heroVideoUrl.includes('video') ? (
                              <video
                                src={bannerForm.heroVideoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={bannerForm.heroVideoUrl}
                                alt="Hero Media"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setBannerForm({ ...bannerForm, heroVideoUrl: '' })}
                            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
                          >
                            Remove Media
                          </button>
                        </div>
                      ) : (
                        <div className="py-4 text-center border-2 border-dashed border-neutral-200 rounded-xl">
                          <p className="text-xs text-neutral-400 font-mono">
                            No media uploaded yet. Tap &quot;Choose File&quot; to pick from gallery.
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                        Top Announcement Bar Text
                      </label>
                      <input
                        type="text"
                        value={bannerForm.announcementText || ''}
                        onChange={(e) =>
                          setBannerForm({ ...bannerForm, announcementText: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                        placeholder="NEW DROP LIVE NOW."
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Lookbook Photos */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <ImageIcon className="w-4 h-4 text-neutral-800" />
                    <h3 className="font-bold text-sm text-neutral-900">
                      Lookbook 4-Photo Grid
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'photoTopLeft' as const, label: 'Photo 1 (Top Left)' },
                      { key: 'photoBottomLeft' as const, label: 'Photo 2 (Bottom Left)' },
                      { key: 'photoTopRight' as const, label: 'Photo 3 (Top Right)' },
                      { key: 'photoBottomRight' as const, label: 'Photo 4 (Bottom Right)' },
                    ].map((slot) => (
                      <div key={slot.key} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2">
                        <span className="text-[10px] font-mono font-bold text-neutral-700 uppercase block truncate">
                          {slot.label}
                        </span>
                        <div className="aspect-[3/4] bg-neutral-200 rounded-lg overflow-hidden relative">
                          {bannerForm[slot.key] ? (
                            <img
                              src={bannerForm[slot.key]}
                              alt={slot.label}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-mono">
                              Empty
                            </div>
                          )}
                        </div>
                        <label className="w-full py-1.5 bg-neutral-900 text-white rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingBannerField === slot.key ? 'Uploading...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadBannerPhoto(slot.key, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* ============================================================= */}
            {/* TAB 6: SETTINGS */}
            {/* ============================================================= */}
            {activeTab === 'SETTINGS' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                    Store Settings &amp; Authorized Admins
                  </h1>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Authorized Google accounts and cache tools.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-neutral-900">
                    Authorized Google Admin Accounts
                  </h3>
                  <div className="divide-y divide-neutral-100">
                    {AUTHORIZED_ADMIN_EMAILS.map((email) => (
                      <div key={email} className="py-2.5 flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-neutral-800">
                          {email}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">
                          SUPER ADMIN
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-neutral-900">
                    Purge System Cache
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Purge local browser storage caches to force an immediate refresh from Firestore.
                  </p>
                  <button
                    onClick={() => {
                      purgeStaleCaches();
                      forceHardReload();
                    }}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold font-mono transition-colors cursor-pointer"
                  >
                    Purge All Caches &amp; Reload Store
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =================================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px) */}
      {/* =================================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-neutral-200 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive ? 'text-[#E0533C]' : 'text-neutral-500'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.5]'}`} />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-[#E0533C] text-white text-[9px] font-mono font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-mono tracking-tight mt-0.5 ${isActive ? 'font-bold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* =================================================================== */}
      {/* PRODUCT ADD / EDIT MODAL (Mobile + Desktop Optimized) */}
      {/* =================================================================== */}
      <AdminProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        stockMap={editingProductStock}
        isNew={isNewProduct}
        onSave={handleSaveProductFromModal}
      />

      {/* =================================================================== */}
      {/* RECEIPT SCREENSHOT VIEWER LIGHTBOX */}
      {/* =================================================================== */}
      {viewingReceiptUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setViewingReceiptUrl(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-mono text-xs font-bold uppercase text-neutral-900">
                Payment Screenshot Verification
              </h3>
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-2xl bg-neutral-100 flex items-center justify-center">
              <img
                src={viewingReceiptUrl}
                alt="Payment Receipt"
                className="max-w-full h-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FULL ORDER DETAILS MODAL */}
      {/* =================================================================== */}
      {selectedOrderDetails && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedOrderDetails(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="font-mono font-black text-sm uppercase text-neutral-900">
                  Order Details #{selectedOrderDetails.orderNumber || selectedOrderDetails.id.slice(0, 8)}
                </h2>
                <p className="text-[10px] text-neutral-400 font-mono">
                  {selectedOrderDetails.createdAt?.toDate
                    ? selectedOrderDetails.createdAt.toDate().toLocaleString()
                    : 'Recent Order'}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="bg-neutral-50 p-4 rounded-2xl space-y-2 text-xs font-mono">
              <div>
                <span className="font-bold text-neutral-900">Customer:</span>{' '}
                {selectedOrderDetails.fullName}
              </div>
              <div>
                <span className="font-bold text-neutral-900">Phone:</span>{' '}
                <a
                  href={`tel:${selectedOrderDetails.phoneNumber}`}
                  className="text-emerald-700 underline"
                >
                  {selectedOrderDetails.phoneNumber}
                </a>
              </div>
              <div>
                <span className="font-bold text-neutral-900">Address:</span>{' '}
                {selectedOrderDetails.deliveryAddress}
              </div>
              <div>
                <span className="font-bold text-neutral-900">Zone:</span>{' '}
                {selectedOrderDetails.deliveryLocation?.name || selectedOrderDetails.city}{' '}
                ({selectedOrderDetails.deliveryLocation?.zoneLabel || 'Valley'})
              </div>
              <div>
                <span className="font-bold text-neutral-900">Payment:</span>{' '}
                {selectedOrderDetails.paymentMethod}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase text-neutral-700">
                Ordered Garments
              </h4>
              <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden">
                {selectedOrderDetails.items?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs font-mono">
                    <div>
                      <p className="font-bold text-neutral-900">{item.name}</p>
                      <p className="text-neutral-400 text-[10px]">
                        Size: {item.size} &bull; Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-neutral-900">{item.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-neutral-700">Total Charged:</span>
              <span className="text-base font-black text-neutral-900">
                Rs. {selectedOrderDetails.totalAmount?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
