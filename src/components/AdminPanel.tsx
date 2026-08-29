import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Image as ImageIcon,
  Video,
  ShoppingBag,
  Package,
  Layers,
  Settings,
  LogOut,
  Search,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  Truck,
  DollarSign,
  Boxes,
  Upload,
  Copy,
  MessageCircle,
  Eye,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Phone,
  MapPin,
  FileCheck,
  MoreVertical,
  Menu,
  Bell,
  Lock,
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
  deleteDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { auth, googleAuthProvider, db } from '../lib/firebase';
import { uploadImageToStorage } from '../lib/storageManager';
import {
  SiteBannerContent,
  DEFAULT_SITE_CONTENT,
  updateSiteContent,
  saveProduct,
  deleteProduct,
} from '../lib/siteContent';
import { Product } from '../types';
import { purgeStaleCaches, forceHardReload } from '../lib/cacheManager';

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
  | 'IMAGES'
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
    name: string;
    size: string;
    quantity: number;
    price?: string;
    rawPrice?: number;
    image?: string;
  }>;
  status: 'PENDING_VERIFICATION' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Firestore State
  const [liveOrders, setLiveOrders] = useState<OrderItem[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderItem | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  // Live Stocks State
  const [stockRecords, setStockRecords] = useState<any[]>([]);

  // Product Editing State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productImagesInput, setProductImagesInput] = useState<string[]>([]);
  const [directImageUrlInput, setDirectImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Banner Editing State
  const [bannerForm, setBannerForm] = useState<SiteBannerContent>(siteContent);
  const [isSavingBanners, setIsSavingBanners] = useState(false);
  const [bannerSaveSuccess, setBannerSaveSuccess] = useState(false);
  const [uploadingBannerField, setUploadingBannerField] = useState<string | null>(null);

  // Image Library Upload State
  const [uploadedGallery, setUploadedGallery] = useState<string[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Settings State
  const [storeWhatsApp, setStoreWhatsApp] = useState('9847459808');
  const [storeNotification, setStoreNotification] = useState('New Drop Live Now');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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

  // 2. Real-time Orders Subscription
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

  // 3. Real-time Stocks Subscription
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
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to update order status:', e);
    }
  };

  // Handler to Save Product (Add or Edit)
  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.price) {
      alert('Please provide product name and price.');
      return;
    }

    setIsSavingProduct(true);
    try {
      const productId =
        editingProduct.id ||
        `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const rawPriceNumber =
        Number(
          String(editingProduct.price || '0').replace(/[^0-9.]/g, '')
        ) || editingProduct.rawPrice || 0;

      const fullProduct: Product = {
        id: productId,
        productId: productId,
        name: editingProduct.name.trim(),
        category: (editingProduct.category as any) || 'T-SHIRTS',
        price: editingProduct.price.trim().startsWith('Rs.')
          ? editingProduct.price.trim()
          : `Rs. ${editingProduct.price.trim()}`,
        rawPrice: rawPriceNumber,
        image:
          productImagesInput[0] ||
          editingProduct.image ||
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
        images:
          productImagesInput.length > 0
            ? productImagesInput
            : editingProduct.images || [editingProduct.image || ''],
        description: editingProduct.description || '',
        inStock: editingProduct.inStock !== false,
        sizes:
          editingProduct.sizes && editingProduct.sizes.length > 0
            ? editingProduct.sizes
            : ['S', 'M', 'L', 'XL'],
        availableSizes:
          editingProduct.availableSizes && editingProduct.availableSizes.length > 0
            ? editingProduct.availableSizes
            : editingProduct.sizes || ['S', 'M', 'L', 'XL'],
        isActive: editingProduct.isActive !== false,
        isBestSeller: Boolean(editingProduct.isBestSeller),
        gender: (editingProduct.gender as any) || 'UNISEX',
        sortOrder: typeof editingProduct.sortOrder === 'number' ? editingProduct.sortOrder : products.length + 1,
      };

      await saveProduct(fullProduct);
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductImagesInput([]);
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert(`Error saving product: ${err?.message || err}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Handler to Delete Product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (confirm(`Are you sure you want to permanently delete "${productName}" from the store catalog?`)) {
      try {
        await deleteProduct(productId);
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete product.');
      }
    }
  };

  // Handler to Adjust Stock for a size
  const handleAdjustStock = async (
    productId: string,
    size: string,
    delta: number,
    currentQty: number
  ) => {
    const stockId = `${productId}_${size}`;
    const newQty = Math.max(0, currentQty + delta);
    try {
      await setDoc(
        doc(db, 'stocks', stockId),
        {
          id: stockId,
          productId,
          size,
          availableQuantity: newQty,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Check if product needs stock update
      const prod = products.find((p) => p.id === productId);
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

  // Image Upload helper for Product Images
  const handleUploadProductImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadImageToStorage(file, 'products');
        urls.push(url);
      }
      setProductImagesInput((prev) => [...prev, ...urls]);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Please check format or try a direct URL.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Image Upload helper for General Gallery
  const handleUploadGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageToStorage(files[i], 'general');
        urls.push(url);
      }
      setUploadedGallery((prev) => [...urls, ...prev]);
    } catch (e) {
      console.error('Gallery upload failed:', e);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  // Dedicated helper to upload image for any specific banner field
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
      alert('Failed to upload banner image. Please try again.');
    } finally {
      setUploadingBannerField(null);
    }
  };

  // Helper to add direct image URL to product
  const handleAddDirectImageUrl = () => {
    const trimmed = directImageUrlInput.trim();
    if (!trimmed) return;
    if (!productImagesInput.includes(trimmed)) {
      setProductImagesInput((prev) => [...prev, trimmed]);
    }
    setDirectImageUrlInput('');
  };

  // Helper to set image as primary main image
  const handleSetPrimaryProductImage = (index: number) => {
    setProductImagesInput((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
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
  // VIEW 1: ADMIN LOGIN SCREEN (Modeled 1:1 after Reference Screenshot 1)
  // =========================================================================
  if (!currentUser || !isAdminAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-b from-[#C9E6FD] via-[#DCEEFD] to-[#EEF7FE] overflow-y-auto">
        {/* Subtle ambient radiating background curves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-40">
          <div className="w-[800px] h-[800px] rounded-full border border-white/60 -translate-y-12 animate-pulse" />
          <div className="w-[1100px] h-[1100px] rounded-full border border-white/40 -translate-y-12" />
        </div>

        {/* Close / Return to Store button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-white/60 hover:bg-white/90 text-neutral-600 transition-all shadow-sm backdrop-blur-md"
          title="Return to Store"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Centered Glass / Frosted Login Card (Strict 1:1 layout to Screenshot 1) */}
        <div className="relative z-10 w-full max-w-[420px] bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_24px_60px_rgba(30,50,90,0.12)] rounded-[32px] p-8 sm:p-10 text-center">
          {/* Top Square Icon Pill with ->] Entry Icon */}
          <div className="w-14 h-14 bg-white/95 rounded-2xl shadow-sm border border-neutral-100/90 flex items-center justify-center mx-auto mb-6">
            <div className="flex items-center justify-center text-neutral-800">
              <span className="font-mono text-xl font-bold">&rarr;]</span>
            </div>
          </div>

          {/* Clean Modern Typography */}
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Admin Panel
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 mb-8 leading-relaxed max-w-[280px] mx-auto">
            Sign in to securely manage your store.
          </p>

          {/* Authentication Error Banner */}
          {authError && (
            <div className="mb-6 p-3.5 bg-red-50/90 border border-red-200/80 rounded-2xl text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-snug font-medium">
                {authError}
              </p>
            </div>
          )}

          {/* SINGLE AUTH METHOD: Continue with Google */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-6 bg-white hover:bg-neutral-50 active:scale-[0.98] border border-neutral-200/90 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 font-semibold text-sm text-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              {/* Official Google Vector Icon */}
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

          {/* Footer Security Badge */}
          <div className="mt-8 pt-6 border-t border-neutral-100/80 flex items-center justify-center gap-1.5 text-[11px] font-mono text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Firebase Security &bull; Admin Access Only</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ADMIN DASHBOARD (Modeled 1:1 after Reference Screenshot 2)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6FB] flex items-center justify-center p-0 md:p-4 sm:p-6 overflow-hidden">
      {/* Outer Dashboard Card (matching Reference Screenshot 2 rounded modern container) */}
      <div className="w-full h-full md:max-w-[1440px] md:h-[94vh] bg-white md:rounded-[28px] shadow-[0_10px_50px_rgba(0,0,0,0.06)] border border-neutral-100 flex flex-col md:flex-row overflow-hidden">
        
        {/* ================================================================= */}
        {/* LEFT SIDEBAR (Matching Reference Screenshot 2 navigation hierarchy) */}
        {/* ================================================================= */}
        <aside className="w-full md:w-64 bg-white border-r border-neutral-100 p-5 flex flex-col justify-between flex-shrink-0">
          <div>
            {/* Top Brand Header */}
            <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
              <div className="flex items-center gap-3">
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

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Menu Links */}
            <nav className={`mt-6 space-y-1.5 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`}>
              {[
                {
                  id: 'DASHBOARD',
                  label: 'Dashboard',
                  icon: TrendingUp,
                },
                {
                  id: 'ORDERS',
                  label: 'Orders',
                  icon: ShoppingBag,
                  badge: liveOrders.filter((o) => o.status === 'PENDING_VERIFICATION').length || null,
                },
                {
                  id: 'PRODUCTS',
                  label: 'Products',
                  icon: Package,
                  badge: products.length,
                },
                {
                  id: 'STOCK',
                  label: 'Stock',
                  icon: Boxes,
                },
                {
                  id: 'IMAGES',
                  label: 'Images',
                  icon: ImageIcon,
                },
                {
                  id: 'BANNERS',
                  label: 'Banners',
                  icon: Sparkles,
                },
                {
                  id: 'SETTINGS',
                  label: 'Settings',
                  icon: Settings,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as AdminTab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
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
          <div className="pt-6 border-t border-neutral-100 space-y-2">
            {/* Logout Action */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-neutral-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-colors font-medium"
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
          
          {/* Top Bar (matching Reference Screenshot 2 top header) */}
          <header className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between gap-4 flex-shrink-0">
            {/* Search Input */}
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, products, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F8F9FD] border border-neutral-200/70 rounded-full text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
              />
            </div>

            {/* Header Right Status & Profile Pill */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Storefront Link */}
              <button
                onClick={onClose}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-xs font-mono font-medium text-neutral-700 transition-colors"
              >
                <span>Live Store</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </button>

              {/* Admin Profile Pill (Lubomir Dvorak avatar style from screenshot) */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-200">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center overflow-hidden">
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
                <div className="hidden sm:block text-left">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-xs font-mono uppercase font-bold">Total Sales</span>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900 font-mono">
                      Rs. {stats.totalSales.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-mono flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Live revenue recorded
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-xs font-mono uppercase font-bold">Pending Orders</span>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900 font-mono">
                      {stats.pendingOrders}
                    </p>
                    <p className="text-[11px] text-amber-600 font-mono">
                      Awaiting verification
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-xs font-mono uppercase font-bold">Total Products</span>
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                        <Package className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900 font-mono">
                      {stats.totalProducts}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Active store styles
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-xs font-mono uppercase font-bold">Delivered</span>
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                        <Truck className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900 font-mono">
                      {stats.deliveredOrders}
                    </p>
                    <p className="text-[11px] text-purple-600 font-mono">
                      Completed fulfillments
                    </p>
                  </div>
                </div>

                {/* Quick Actions & Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Orders Preview */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-neutral-900">
                        Recent Orders
                      </h3>
                      <button
                        onClick={() => setActiveTab('ORDERS')}
                        className="text-xs text-[#E0533C] font-semibold hover:underline"
                      >
                        View All ({liveOrders.length})
                      </button>
                    </div>

                    {liveOrders.length === 0 ? (
                      <div className="py-8 text-center text-xs text-neutral-400 font-mono">
                        No orders recorded yet. Live orders will populate automatically.
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {liveOrders.slice(0, 5).map((order) => (
                          <div
                            key={order.id}
                            className="py-3 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <p className="font-bold text-neutral-900">
                                {order.fullName}{' '}
                                <span className="font-mono text-neutral-400 font-normal">
                                  ({order.id.slice(0, 8)})
                                </span>
                              </p>
                              <p className="text-[11px] text-neutral-500 font-mono">
                                {order.items?.length || 1} items &bull;{' '}
                                {order.paymentMethod}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-mono font-bold text-neutral-900">
                                Rs. {order.totalAmount?.toLocaleString()}
                              </p>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  order.status === 'DELIVERED'
                                    ? 'bg-purple-50 text-purple-700'
                                    : order.status === 'DISPATCHED'
                                    ? 'bg-blue-50 text-blue-700'
                                    : order.status === 'CANCELLED'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fast Action Shortcuts */}
                  <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 space-y-3">
                    <h3 className="font-bold text-sm text-neutral-900">
                      Quick Store Actions
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setEditingProduct({
                            sizes: ['S', 'M', 'L', 'XL'],
                            availableSizes: ['S', 'M', 'L', 'XL'],
                            category: 'T-SHIRTS',
                            gender: 'UNISEX',
                            inStock: true,
                            isActive: true,
                          });
                          setIsNewProduct(true);
                          setProductImagesInput([]);
                          setIsProductModalOpen(true);
                        }}
                        className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          <span>Add New Product</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setActiveTab('STOCK')}
                        className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Boxes className="w-4 h-4" />
                          <span>Manage Stock by Size</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setActiveTab('BANNERS')}
                        className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          <span>Update Hero Banners</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: ORDERS (Modeled after Reference Screenshot 2 table) */}
            {/* ============================================================= */}
            {activeTab === 'ORDERS' && (
              <div className="space-y-4 max-w-7xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                      Order Management
                    </h1>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Live customer orders synced directly from Firestore.
                    </p>
                  </div>

                  {/* Order Status Filters (matching tabs in screenshot 2) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: 'ALL', label: 'All Orders' },
                      { id: 'PENDING_VERIFICATION', label: 'Pending' },
                      { id: 'PROCESSING', label: 'Processing' },
                      { id: 'DISPATCHED', label: 'Dispatched' },
                      { id: 'DELIVERED', label: 'Delivered' },
                      { id: 'CANCELLED', label: 'Cancelled' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setOrderStatusFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                          orderStatusFilter === tab.id
                            ? 'bg-neutral-900 text-white font-bold'
                            : 'bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders Table (Styled with soft rounded rows like screenshot 2) */}
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
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
                            <tr
                              key={order.id}
                              className="hover:bg-[#F9FAFC] transition-colors"
                            >
                              {/* Order ID */}
                              <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                                #{order.orderNumber || order.id.slice(0, 8)}
                              </td>

                              {/* Customer info */}
                              <td className="py-3.5 px-4">
                                <p className="font-bold text-neutral-900">
                                  {order.fullName}
                                </p>
                                <p className="text-[11px] text-neutral-500 font-mono">
                                  {order.phoneNumber}
                                </p>
                              </td>

                              {/* Delivery Location */}
                              <td className="py-3.5 px-4 max-w-[180px]">
                                <p className="font-medium text-neutral-800 truncate">
                                  {order.deliveryLocation?.name || order.city || 'Kathmandu'}
                                </p>
                                <p className="text-[10px] text-neutral-400 truncate">
                                  {order.deliveryAddress}
                                </p>
                              </td>

                              {/* Items Breakdown */}
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-semibold text-neutral-700">
                                  {order.items?.length || 1} item(s)
                                </span>
                                <div className="text-[10px] text-neutral-400 truncate max-w-[160px]">
                                  {order.items?.map((it) => `${it.name} (${it.size})`).join(', ')}
                                </div>
                              </td>

                              {/* Payment & Receipt */}
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

                              {/* Total Amount */}
                              <td className="py-3.5 px-4 font-mono font-black text-neutral-900">
                                Rs. {order.totalAmount?.toLocaleString()}
                              </td>

                              {/* Status Dropdown */}
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

                              {/* Action Buttons */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* WhatsApp Direct Contact */}
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

                                  {/* Full Details Modal Toggle */}
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
            {/* TAB 3: PRODUCTS (Full CRUD & Image Reorder) */}
            {/* ============================================================= */}
            {activeTab === 'PRODUCTS' && (
              <div className="space-y-4 max-w-7xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                      Product Catalog ({products.length})
                    </h1>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Manage product styles, pricing, categories, and media.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingProduct({
                        sizes: ['S', 'M', 'L', 'XL'],
                        availableSizes: ['S', 'M', 'L', 'XL'],
                        category: 'T-SHIRTS',
                        gender: 'UNISEX',
                        inStock: true,
                        isActive: true,
                        price: 'Rs. 2,500',
                      });
                      setIsNewProduct(true);
                      setProductImagesInput([]);
                      setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-start"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col justify-between group"
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
                            {product.category}
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
                          onClick={() => {
                            setEditingProduct(product);
                            setIsNewProduct(false);
                            setProductImagesInput(
                              Array.isArray(product.images) && product.images.length > 0
                                ? product.images
                                : [product.image]
                            );
                            setIsProductModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

                      {/* Size Controls */}
                      <div className="flex flex-wrap items-center gap-3">
                        {['S', 'M', 'L', 'XL'].map((size) => {
                          const stockItem = stockRecords.find(
                            (s) => s.productId === product.id && s.size === size
                          );
                          const qty = stockItem?.availableQuantity ?? 25;
                          const isAvailable = (product.availableSizes || product.sizes || []).includes(size);

                          return (
                            <div
                              key={size}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                isAvailable && qty > 0
                                  ? 'bg-neutral-50 border-neutral-200'
                                  : 'bg-red-50/60 border-red-200 text-red-800'
                              }`}
                            >
                              <span className="font-mono font-bold text-xs uppercase w-6">
                                {size}:
                              </span>

                              <button
                                onClick={() => handleAdjustStock(product.id, size, -1, qty)}
                                className="w-6 h-6 rounded bg-white hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center font-bold text-xs"
                              >
                                -
                              </button>

                              <span className="font-mono font-bold text-xs min-w-[20px] text-center">
                                {qty}
                              </span>

                              <button
                                onClick={() => handleAdjustStock(product.id, size, +1, qty)}
                                className="w-6 h-6 rounded bg-white hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center font-bold text-xs"
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
            {/* TAB 5: IMAGE ASSETS & FIREBASE STORAGE */}
            {/* ============================================================= */}
            {activeTab === 'IMAGES' && (
              <div className="space-y-6 max-w-6xl">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                    Image Asset Library
                  </h1>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Upload and manage high-resolution photos and banners stored on Firebase.
                  </p>
                </div>

                {/* Upload Box */}
                <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-neutral-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mx-auto text-neutral-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">
                      Upload Photos to Firebase Storage
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Select JPG, PNG, WEBP files to generate instant CDN URLs.
                    </p>
                  </div>

                  <label className="inline-block px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                    <span>{isUploadingGallery ? 'Uploading...' : 'Browse Images'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUploadGalleryImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded Gallery Grid */}
                {uploadedGallery.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-neutral-900">
                      Recently Uploaded Assets
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {uploadedGallery.map((imgUrl, i) => (
                        <div
                          key={i}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-neutral-100 group shadow-sm bg-neutral-100"
                        >
                          <img
                            src={imgUrl}
                            alt="Asset"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(imgUrl);
                                setCopiedUrl(imgUrl);
                                setTimeout(() => setCopiedUrl(null), 2000);
                              }}
                              className="p-2 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 text-xs font-mono font-bold flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedUrl === imgUrl ? 'Copied!' : 'Copy URL'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 6: BANNERS & DYNAMIC SITE CONTENT */}
            {/* ============================================================= */}
            {activeTab === 'BANNERS' && (
              <form onSubmit={handleSaveBanners} className="space-y-6 max-w-5xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                      Banner &amp; Media Management
                    </h1>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Upload and manage hero media, lookbook photos, luxury statements, and brand text.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingBanners}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isSavingBanners ? 'Saving to Firebase...' : 'Save All Changes'}</span>
                  </button>
                </div>

                {bannerSaveSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All banner updates saved to Firestore with zero-flicker cache synchronization!</span>
                  </div>
                )}

                {/* 1. Hero Section Media */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <Video className="w-4 h-4 text-neutral-800" />
                    <h3 className="font-bold text-sm text-neutral-900">
                      Hero Section Media &amp; Top Bar
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                        Hero Video URL (.mp4)
                      </label>
                      <input
                        type="text"
                        value={bannerForm.heroVideoUrl || ''}
                        onChange={(e) =>
                          setBannerForm({ ...bannerForm, heroVideoUrl: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                        placeholder="https://cdn.phototourl.com/...mp4"
                      />
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

                {/* 2. More Than Clothes Lookbook 4-Photo Grid */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-5">
                  <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <ImageIcon className="w-4 h-4 text-neutral-800" />
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900">
                        "More Than Clothes" Lookbook Photos
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Upload or replace high-resolution images for the 4-photo lookbook grid.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Photo Top Left */}
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-neutral-800 uppercase">
                          Photo 1: Top Left
                        </span>
                        <label className="text-[11px] font-mono font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingBannerField === 'photoTopLeft' ? 'Uploading...' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadBannerPhoto('photoTopLeft', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-20 bg-neutral-200 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-300">
                          {bannerForm.photoTopLeft ? (
                            <img
                              src={bannerForm.photoTopLeft}
                              alt="Top Left"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">No Image</div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={bannerForm.photoTopLeft || ''}
                          onChange={(e) =>
                            setBannerForm({ ...bannerForm, photoTopLeft: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono"
                          placeholder="Image URL or upload file"
                        />
                      </div>
                    </div>

                    {/* Photo Bottom Left */}
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-neutral-800 uppercase">
                          Photo 2: Bottom Left
                        </span>
                        <label className="text-[11px] font-mono font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingBannerField === 'photoBottomLeft' ? 'Uploading...' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadBannerPhoto('photoBottomLeft', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-20 bg-neutral-200 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-300">
                          {bannerForm.photoBottomLeft ? (
                            <img
                              src={bannerForm.photoBottomLeft}
                              alt="Bottom Left"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">No Image</div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={bannerForm.photoBottomLeft || ''}
                          onChange={(e) =>
                            setBannerForm({ ...bannerForm, photoBottomLeft: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono"
                          placeholder="Image URL or upload file"
                        />
                      </div>
                    </div>

                    {/* Photo Top Right */}
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-neutral-800 uppercase">
                          Photo 3: Top Right
                        </span>
                        <label className="text-[11px] font-mono font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingBannerField === 'photoTopRight' ? 'Uploading...' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadBannerPhoto('photoTopRight', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-20 bg-neutral-200 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-300">
                          {bannerForm.photoTopRight ? (
                            <img
                              src={bannerForm.photoTopRight}
                              alt="Top Right"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">No Image</div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={bannerForm.photoTopRight || ''}
                          onChange={(e) =>
                            setBannerForm({ ...bannerForm, photoTopRight: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono"
                          placeholder="Image URL or upload file"
                        />
                      </div>
                    </div>

                    {/* Photo Bottom Right */}
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-neutral-800 uppercase">
                          Photo 4: Bottom Right
                        </span>
                        <label className="text-[11px] font-mono font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingBannerField === 'photoBottomRight' ? 'Uploading...' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadBannerPhoto('photoBottomRight', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-20 bg-neutral-200 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-300">
                          {bannerForm.photoBottomRight ? (
                            <img
                              src={bannerForm.photoBottomRight}
                              alt="Bottom Right"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">No Image</div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={bannerForm.photoBottomRight || ''}
                          onChange={(e) =>
                            setBannerForm({ ...bannerForm, photoBottomRight: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono"
                          placeholder="Image URL or upload file"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Manifesto Texts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                        Manifesto Heading
                      </label>
                      <input
                        type="text"
                        value={bannerForm.manifestoHeading || ''}
                        onChange={(e) =>
                          setBannerForm({ ...bannerForm, manifestoHeading: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold"
                        placeholder="MORE THAN\nCLOTHES"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                        Manifesto Tagline
                      </label>
                      <input
                        type="text"
                        value={bannerForm.manifestoTagline || ''}
                        onChange={(e) =>
                          setBannerForm({ ...bannerForm, manifestoTagline: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold"
                        placeholder="NANGSAL APPAREL"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Luxury Manifesto Section */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-sm text-neutral-900">
                      Brand Luxury &amp; Manifesto Section
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                        Luxury Video URL (.mp4)
                      </label>
                      <input
                        type="text"
                        value={bannerForm.luxuryVideoUrl || ''}
                        onChange={(e) =>
                          setBannerForm({ ...bannerForm, luxuryVideoUrl: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                        placeholder="https://cdn.phototourl.com/...mp4"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                          Luxury Heading
                        </label>
                        <input
                          type="text"
                          value={bannerForm.luxuryHeading || ''}
                          onChange={(e) =>
                            setBannerForm({ ...bannerForm, luxuryHeading: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold"
                          placeholder="WE ARE LUXURY STREETWEAR"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                          Luxury Tagline
                        </label>
                        <input
                          type="text"
                          value={bannerForm.luxuryTagline || ''}
                          onChange={(e) =>
                            setBannerForm({ ...bannerForm, luxuryTagline: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                          placeholder="Every product from NANGSAL APPAREL is made with care."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                          Paragraph 1
                        </label>
                        <textarea
                          rows={2}
                          value={bannerForm.luxuryParagraph1 || ''}
                          onChange={(e) =>
                            setBannerForm({ ...bannerForm, luxuryParagraph1: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                          placeholder="We are not traditional luxury and we are not traditional streetwear."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                          Paragraph 2
                        </label>
                        <textarea
                          rows={2}
                          value={bannerForm.luxuryParagraph2 || ''}
                          onChange={(e) =>
                            setBannerForm({ ...bannerForm, luxuryParagraph2: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                          placeholder="We are a fusion of both..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                        Accent Badge Text
                      </label>
                      <input
                        type="text"
                        value={bannerForm.luxuryBadge || ''}
                        onChange={(e) =>
                          setBannerForm({ ...bannerForm, luxuryBadge: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold"
                        placeholder="MADE IN NEPAL"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* ============================================================= */}
            {/* TAB 7: STORE SETTINGS */}
            {/* ============================================================= */}
            {activeTab === 'SETTINGS' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                    Store Settings &amp; Authorized Admins
                  </h1>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Configure store WhatsApp hotline, delivery fees, and administrator accounts.
                  </p>
                </div>

                {/* Authorized Admins List */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-neutral-900">
                    Authorized Google Admin Accounts
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Only signed-in Google users on this authorized list have access to this Control Desk.
                  </p>
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

                {/* Cache Management */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-neutral-900">
                    System Cache &amp; Firestore Synchronization
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Purge local browser storage caches to force an immediate refresh from Firestore.
                  </p>
                  <button
                    onClick={() => {
                      purgeStaleCaches();
                      forceHardReload();
                    }}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold font-mono transition-colors"
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
      {/* PRODUCT ADD / EDIT MODAL */}
      {/* =================================================================== */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-100 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h2 className="text-lg font-bold text-neutral-900">
                {isNewProduct ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductForm} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                  placeholder="e.g. MOUNTAIN LOGO OVERSIZED TEE"
                />
              </div>

              {/* Price, Category & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                    Price (NPR) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold"
                    placeholder="Rs. 2,500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={editingProduct.category || 'T-SHIRTS'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                  >
                    <option value="T-SHIRTS">T-SHIRTS</option>
                    <option value="OUTERWEAR">OUTERWEAR</option>
                    <option value="HOODIES">HOODIES</option>
                    <option value="PANTS">PANTS</option>
                    <option value="ACCESSORIES">ACCESSORIES</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={editingProduct.gender || 'UNISEX'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        gender: e.target.value as any,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                  >
                    <option value="UNISEX">UNISEX</option>
                    <option value="MEN">MEN</option>
                    <option value="WOMEN">WOMEN</option>
                  </select>
                </div>
              </div>

              {/* Sizes Selection */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1.5">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                    const currentSizes = editingProduct.sizes || ['S', 'M', 'L', 'XL'];
                    const isSelected = currentSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? currentSizes.filter((s) => s !== size)
                            : [...currentSizes, size];
                          setEditingProduct({
                            ...editingProduct,
                            sizes: updated.length ? updated : [size],
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product Images (Upload file + Direct URL input) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-neutral-600 uppercase">
                    Product Images ({productImagesInput.length})
                  </label>
                  <label className="text-[11px] font-mono font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>{isUploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUploadProductImageFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct URL input bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={directImageUrlInput}
                    onChange={(e) => setDirectImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDirectImageUrl();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                    placeholder="Paste direct image URL (https://...)"
                  />
                  <button
                    type="button"
                    onClick={handleAddDirectImageUrl}
                    className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold font-mono"
                  >
                    + Add URL
                  </button>
                </div>

                {/* Images list / thumbnails with reordering */}
                {productImagesInput.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {productImagesInput.map((url, index) => (
                      <div
                        key={index}
                        className="relative w-24 h-32 rounded-2xl overflow-hidden border-2 border-neutral-200 group bg-neutral-100 shadow-sm"
                      >
                        <img src={url} alt="Product" className="w-full h-full object-cover" />
                        {index === 0 ? (
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black text-white text-[9px] font-mono font-bold shadow">
                            MAIN
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryProductImage(index)}
                            className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-white/90 text-neutral-900 text-[8px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setProductImagesInput((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 font-mono italic">
                    No images added yet. Upload a file or paste an image URL above.
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  placeholder="Describe garment materials, GSM, fit, and details..."
                />
              </div>

              {/* Toggles: In Stock & Best Seller */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.inStock !== false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, inStock: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-black focus:ring-0"
                  />
                  <span className="text-xs font-bold text-neutral-800">In Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isBestSeller)}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isBestSeller: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-black focus:ring-0"
                  />
                  <span className="text-xs font-bold text-neutral-800">Best Seller</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold font-mono disabled:opacity-50"
                >
                  {isSavingProduct ? 'Saving Product...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  Order Details #{selectedOrderDetails.id.slice(0, 8)}
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
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs font-bold uppercase text-neutral-800">
                Purchased Items
              </h4>
              <div className="divide-y divide-neutral-100 border-y border-neutral-100 py-1">
                {selectedOrderDetails.items?.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs font-mono">
                    <div>
                      <p className="font-bold text-neutral-900">{it.name}</p>
                      <p className="text-neutral-500">Size: {it.size} &bull; Qty: {it.quantity}</p>
                    </div>
                    <span className="font-black text-neutral-900">
                      {it.price || `Rs. ${it.rawPrice}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 font-mono text-xs pt-1">
              <div className="flex justify-between text-neutral-500">
                <span>DELIVERY CHARGE:</span>
                <span>Rs. {selectedOrderDetails.deliveryCharge || 100}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-neutral-900 pt-1 border-t border-neutral-200">
                <span>TOTAL AMOUNT:</span>
                <span>Rs. {selectedOrderDetails.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
