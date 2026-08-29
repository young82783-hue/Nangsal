/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MoreThanClothes } from './components/MoreThanClothes';
import { LuxuryStreetwearBanner } from './components/LuxuryStreetwearBanner';
import { ProductCatalog } from './components/ProductCatalog';
import { StudioArchivesFAQ } from './components/StudioArchivesFAQ';
import { ValuePropsSection } from './components/ValuePropsSection';
import { Footer } from './components/Footer';
import { ProductModal } from './components/ProductModal';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { NeedHelpModal } from './components/NeedHelpModal';
import { CheckoutPage } from './components/CheckoutPage';
import { AdminPanel } from './components/AdminPanel';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { ExchangePage } from './components/ExchangePage';
import { ContactPage } from './components/ContactPage';
import { Product } from './types';
import { testFirestoreConnection } from './lib/firebase';
import { purgeStaleCaches } from './lib/cacheManager';
import { preloadEssentialImages } from './lib/imagePreloader';
import {
  SiteBannerContent,
  DEFAULT_SITE_CONTENT,
  INITIAL_PRODUCTS_SEED,
  bootstrapFirestoreDataIfNeeded,
  subscribeToSiteContent,
  subscribeToProducts,
} from './lib/siteContent';

export type Page = 'home' | 'terms' | 'privacy' | 'exchange' | 'contact' | 'checkout';

export function getInitialPage(): Page {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  if (path.includes('checkout') || hash.includes('checkout') || search.includes('page=checkout')) {
    return 'checkout';
  }
  if (path.includes('terms') || hash.includes('terms') || search.includes('page=terms')) {
    return 'terms';
  }
  if (path.includes('privacy') || hash.includes('privacy') || search.includes('page=privacy')) {
    return 'privacy';
  }
  if (
    path.includes('exchange') ||
    path.includes('returns') ||
    hash.includes('exchange') ||
    hash.includes('returns') ||
    search.includes('page=exchange')
  ) {
    return 'exchange';
  }
  if (
    path.includes('contact') ||
    path.includes('help') ||
    hash.includes('contact') ||
    search.includes('page=contact')
  ) {
    return 'contact';
  }
  return 'home';
}

function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return path === '/admin' || path.startsWith('/admin/') || path.includes('admin') || hash.includes('admin') || search.includes('admin=true');
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);
  
  // Consolidated appState containing siteContent, products, and isInitialized flag
  const [appState, setAppState] = useState<{
    siteContent: SiteBannerContent;
    products: Product[];
    isInitialized: boolean;
  }>({
    siteContent: DEFAULT_SITE_CONTENT,
    products: INITIAL_PRODUCTS_SEED,
    isInitialized: false,
  });
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(checkIsAdminRoute);

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('nangsal_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse cart from localStorage:', e);
      return [];
    }
  });
  const [isCartBlinking, setIsCartBlinking] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'T-SHIRTS' | 'OUTERWEAR' | 'HOODIES'>('ALL');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [currency, setCurrency] = useState('NPR');

  const handleOpenAdmin = () => {
    setIsAdminOpen(true);
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
      window.history.pushState({ page: 'admin' }, '', '/admin');
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (typeof window !== 'undefined' && checkIsAdminRoute()) {
      window.history.pushState({}, '', '/');
    }
  };

  // Purge any stale caches and legacy storage keys immediately on application startup
  useEffect(() => {
    purgeStaleCaches();
    testFirestoreConnection();
    bootstrapFirestoreDataIfNeeded();

    let currentContent: SiteBannerContent | null = null;
    let currentProducts: Product[] | null = null;

    // Subscribe to live Firestore Banners & Site Content and Products atomically
    const unsubBanners = subscribeToSiteContent((content) => {
      currentContent = content;
      setAppState((prev) => ({
        ...prev,
        siteContent: content,
        isInitialized: true,
      }));
    });

    // Subscribe to live Firestore Products catalog
    const unsubProducts = subscribeToProducts((prods) => {
      currentProducts = prods;
      setAppState((prev) => ({
        ...prev,
        products: prods,
        isInitialized: true,
      }));
    });

    const handleLocationChange = () => {
      setCurrentPage(getInitialPage());
      if (checkIsAdminRoute()) {
        setIsAdminOpen(true);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      unsubBanners();
      unsubProducts();
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Preload essential images from Firebase only after isInitialized is confirmed true
  useEffect(() => {
    if (appState.isInitialized) {
      preloadEssentialImages(appState.siteContent, appState.products);
    }
  }, [appState.isInitialized, appState.siteContent, appState.products]);

  // Save cart to local storage whenever cart state changes
  useEffect(() => {
    try {
      localStorage.setItem('nangsal_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    let targetPath = '/';
    if (page === 'checkout') targetPath = '/checkout';
    else if (page === 'terms') targetPath = '/terms';
    else if (page === 'privacy') targetPath = '/privacy';
    else if (page === 'exchange') targetPath = '/exchange-policy';
    else if (page === 'contact') targetPath = '/contact';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleNavigateBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('home');
    }
  };

  const currencySymbols: { [key: string]: string } = {
    NPR: 'Rs.',
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };

  const handleAddToCart = (product: Product, size: string, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prevCart, { product, size, quantity }];
      }
    });

    // Trigger vibrant orange cart blink animation
    setIsCartBlinking(true);
    setTimeout(() => {
      setIsCartBlinking(false);
    }, 2000);
  };

  const handleBuyNow = (product: Product, size: string, quantity: number = 1) => {
    handleAddToCart(product, size, quantity);
    setSelectedProduct(null);
    setIsCartOpen(false);
    navigateTo('checkout');
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      setCart((prev) => {
        const updated = [...prev];
        updated[index].quantity = newQty;
        return updated;
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const { siteContent, products, isInitialized } = appState;
  const liveProducts = products || [];

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased selection:bg-black selection:text-white">
      {/* Navbar Header with Live Announcement Ticker */}
      <Navbar
        cartCount={cartCount}
        isCartBlinking={isCartBlinking}
        announcementText={siteContent?.announcementText || 'NEW DROP LIVE NOW.'}
        navButtons={siteContent?.navButtons}
        activeCategory={activeCategory}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenHelp={() => navigateTo('contact')}
        onOpenTerms={() => navigateTo('terms')}
        onNavigatePrivacy={() => navigateTo('privacy')}
        onNavigateExchange={() => navigateTo('exchange')}
        onNavigateHome={() => navigateTo('home')}
        onSelectCategory={(category) => {
          navigateTo('home');
          setActiveCategory(category);
        }}
      />

      {/* Main Content Area */}
      <main>
        {currentPage === 'terms' && (
          <TermsPage
            onNavigateHome={() => navigateTo('home')}
            onNavigateBack={handleNavigateBack}
          />
        )}
        {currentPage === 'privacy' && (
          <PrivacyPage
            onNavigateHome={() => navigateTo('home')}
            onNavigateBack={handleNavigateBack}
          />
        )}
        {currentPage === 'exchange' && (
          <ExchangePage
            onNavigateHome={() => navigateTo('home')}
            onNavigateBack={handleNavigateBack}
          />
        )}
        {currentPage === 'contact' && (
          <ContactPage
            onNavigateBack={handleNavigateBack}
          />
        )}
        {currentPage === 'checkout' && (
          <CheckoutPage
            cart={cart}
            currencySymbol={currencySymbols[currency] || 'Rs.'}
            onNavigateHome={() => navigateTo('home')}
            onNavigateBack={handleNavigateBack}
            onClearCart={handleClearCart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        )}
        {currentPage === 'home' && (
          <>
            {/* Hero Section - Live Firestore Media */}
            <HeroSection banner={siteContent} />

            {/* Section 1: More Than Clothes Brand Manifesto Grid */}
            <MoreThanClothes banner={siteContent} />

            {/* Section 2: Luxury Streetwear Hero Overlay Banner */}
            <LuxuryStreetwearBanner banner={siteContent} />

            {/* Section 3: Product Catalog Grid with Category Filtering */}
            <ProductCatalog
              products={liveProducts}
              onSelectProduct={(product) => setSelectedProduct(product)}
              currencySymbol={currencySymbols[currency] || 'Rs.'}
              activeFilter={activeCategory}
              onFilterChange={(filter) => setActiveCategory(filter)}
            />

            {/* Studio Archives & FAQ */}
            <StudioArchivesFAQ />

            {/* Value Proposition Badges */}
            <ValuePropsSection />
          </>
        )}
      </main>

      {/* Footer with Terms, Privacy, Exchange, and Contact links */}
      <Footer
        onOpenHelp={() => navigateTo('contact')}
        onNavigateHome={() => navigateTo('home')}
        onNavigateTerms={() => navigateTo('terms')}
        onNavigatePrivacy={() => navigateTo('privacy')}
        onNavigateExchange={() => navigateTo('exchange')}
        onNavigateContact={() => navigateTo('contact')}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Interactive Quick View Product Modal */}
      <ProductModal
        key={selectedProduct ? (selectedProduct.productId || selectedProduct.id) : 'product-modal-closed'}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        currencySymbol={currencySymbols[currency] || 'Rs.'}
      />

      {/* Cart Slide-over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        currencySymbol={currencySymbols[currency] || 'Rs.'}
        onCheckout={() => {
          setIsCartOpen(false);
          navigateTo('checkout');
        }}
      />

      {/* Search Overlay Modal - uses live Firestore products */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={liveProducts}
        onSelectProduct={(product) => setSelectedProduct(product)}
        currencySymbol={currencySymbols[currency] || 'Rs.'}
      />

      {/* Concierge Need Help Support Modal (retained if invoked directly) */}
      <NeedHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Admin Control Desk Modal - Accessible exclusively via direct URL (/admin) */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        siteContent={siteContent || DEFAULT_SITE_CONTENT}
        products={liveProducts}
        onNavigateHome={() => {
          handleCloseAdmin();
          navigateTo('home');
        }}
      />
    </div>
  );
}
