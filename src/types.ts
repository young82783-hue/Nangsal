/**
 * Unified TypeScript types and interfaces for NANGSAL APPAREL
 * Firebase Firestore Single Source of Truth
 */

export type GenderType = 'UNISEX' | 'MEN' | 'WOMEN' | 'ALL';
export type ProductCategory = 'TOPS' | 'OUTERWEAR' | 'HOODIES' | string;
export type BannerType = 'HERO' | 'LUXURY' | 'MANIFESTO' | 'PROMO' | 'ANNOUNCEMENT' | 'LOOKBOOK';
export type PaymentMethod = 'BANK' | 'ESEWA' | 'COD';
export type OrderStatus = 'PENDING_VERIFICATION' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
export type AdminRole = 'SUPER_ADMIN' | 'CATALOG_MANAGER' | 'ORDER_MANAGER' | 'ADMIN';

// 1. Products Collection Entity
export interface Product {
  id: string;
  productId?: string;
  name: string;
  description: string;
  price: string;
  rawPrice: number;
  category: ProductCategory;
  gender?: GenderType;
  image: string;
  images: string[];
  sizes: string[];
  availableSizes?: string[];
  isActive?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  sortOrder?: number;
  createdAt?: any;
  updatedAt?: any;
  sku?: string;
}

// 2. Banners Collection Entity
export interface Banner {
  id: string;
  bannerId?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
  type: BannerType;
  gender?: GenderType;
  link?: string;
  badge?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: any;
  updatedAt?: any;
}

// 3. Admin Collection Entity
export interface CustomNavButton {
  id: string;
  label: string;
  category: 'ALL' | 'T-SHIRTS' | 'HOODIES' | 'OUTERWEAR';
  isActive: boolean;
}

export interface SiteBannerContent {
  heroVideoUrl: string;
  heroPosterUrl?: string;
  heroType?: 'video' | 'image';
  luxuryVideoUrl: string;
  luxuryPosterUrl?: string;
  luxuryHeading: string;
  luxuryTagline: string;
  luxuryParagraph1: string;
  luxuryParagraph2: string;
  luxuryBadge: string;
  manifestoHeading: string;
  manifestoTagline: string;
  photoTopLeft: string;
  photoBottomLeft: string;
  photoTopRight: string;
  photoBottomRight: string;
  announcementText: string;
  navButtons: CustomNavButton[];
  updatedAt?: any;
  version?: number | string;
}

export interface AdminPermissions {
  canManageProducts: boolean;
  canManageBanners: boolean;
  canManageStocks: boolean;
  canManageOrders: boolean;
  canManagePrices: boolean;
  canManageVisibility: boolean;
  canManageSiteContent: boolean;
}

export interface Admin {
  id: string;
  uid?: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions?: AdminPermissions;
  isActive: boolean;
  addedBy?: string;
  addedAt?: any;
  lastLogin?: any;
  createdAt?: any;
  updatedAt?: any;
}

// 4. Stocks Collection Entity (Stored independently from product catalog)
export interface Stock {
  id: string; // e.g. `${productId}_${size}`
  productId: string;
  productName?: string;
  size: string; // 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  availableQuantity: number;
  reservedQuantity?: number;
  lowStockThreshold?: number;
  sku?: string;
  updatedAt?: any;
}

// 5. Orders Collection Entity
export interface OrderItem {
  productId: string;
  id?: string;
  name: string;
  selectedSize: string;
  size?: string;
  quantity: number;
  priceAtPurchase: number;
  rawPrice?: number;
  formattedPrice: string;
  price?: string;
  image?: string;
  category?: string;
  sku?: string;
}

export interface OrderCustomerInfo {
  fullName: string;
  phoneNumber: string;
  city: string;
  deliveryAddress: string;
  orderNotes?: string;
}

export interface OrderPaymentInfo {
  paymentMethod: PaymentMethod;
  transactionId?: string;
  uploadedReceipt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  productIds?: string[];
  selectedSizes?: string[];
  quantities?: number[];
  totalAmount: number;
  currency: string;
  
  // Customer details (flattened or nested for maximum compatibility)
  fullName: string;
  phoneNumber: string;
  city: string;
  deliveryAddress: string;
  orderNotes?: string;
  
  // Payment details
  paymentMethod: PaymentMethod;
  transactionId?: string;
  uploadedReceipt?: string;
  
  // Status & Timestamps
  status: OrderStatus;
  createdAt: any;
  updatedAt?: any;
  userId?: string;
}

// Unified dynamic Payment Settings entity stored in Firestore
export interface EsewaPaymentConfig {
  enabled: boolean;
  name: string; // e.g. "eSewa" or "eSewa / Mobile Wallet"
  accountHolder: string; // e.g. "SUNIL GURUNG"
  accountNumber: string; // e.g. "9847459808"
  qrCodeUrl: string; // Direct image URL or base64 data URI
  notes?: string;
}

export interface BankPaymentConfig {
  enabled: boolean;
  name: string; // e.g. "Direct Bank Transfer"
  accountHolder: string; // e.g. "SUNIL GURUNG"
  bankName: string; // e.g. "NABIL BANK / NIC ASIA"
  accountNumber: string; // e.g. "0190 2841 9820 11"
  branch?: string; // e.g. "Kathmandu Branch"
  qrCodeUrl: string; // Direct image URL or base64 data URI
  notes?: string;
}

export interface CodPaymentConfig {
  enabled: boolean;
  name: string; // e.g. "Cash on Delivery (COD)"
  instructions: string; // e.g. "Pay with cash directly to the courier upon delivery"
}

export interface CustomPaymentMethod {
  id: string;
  name: string; // e.g. "Khalti / Fonepay"
  type: string;
  accountHolder: string;
  accountNumber: string;
  bankName?: string;
  qrCodeUrl: string;
  notes?: string;
  enabled: boolean;
}

export interface PaymentSettings {
  esewa: EsewaPaymentConfig;
  bank: BankPaymentConfig;
  cod: CodPaymentConfig;
  customMethods?: CustomPaymentMethod[];
  updatedAt?: any;
  updatedBy?: string;
  version?: number | string;
}
