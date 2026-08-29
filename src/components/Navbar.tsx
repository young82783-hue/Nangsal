import React, { useState } from 'react';
import { Search, ShoppingBag, Menu, ChevronDown, X, Settings } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  isCartBlinking?: boolean;
  announcementText?: string;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  onOpenTerms: () => void;
  onOpenAdmin?: () => void;
  onNavigateHome?: () => void;
  onSelectCategory?: (category: 'ALL' | 'T-SHIRTS' | 'OUTERWEAR' | 'HOODIES') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  isCartBlinking = false,
  announcementText = 'NEW DROP LIVE NOW.',
  onOpenCart,
  onOpenSearch,
  onOpenHelp,
  onOpenTerms,
  onOpenAdmin,
  onNavigateHome,
  onSelectCategory,
}) => {
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [isThreeDotOpen, setIsThreeDotOpen] = useState(false);

  const handleCategoryClick = (category: 'ALL' | 'T-SHIRTS' | 'OUTERWEAR' | 'HOODIES', targetId: string = 'products') => {
    if (onNavigateHome) {
      onNavigateHome();
    }
    if (onSelectCategory) {
      onSelectCategory(category);
    }
    setIsShopMenuOpen(false);
    setIsThreeDotOpen(false);
    
    setTimeout(() => {
      if (targetId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 50);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-100 transition-all duration-200">
      {/* Top Announcement Bar - Dynamic live text from Firestore */}
      {announcementText && (
        <div id="top-announcement" className="bg-white border-b border-neutral-100 py-2 px-4 text-center">
          <p className="text-[10px] sm:text-[11px] font-display font-bold tracking-[0.28em] text-neutral-900 uppercase">
            {announcementText}
          </p>
        </div>
      )}

      {/* Main Responsive Navbar */}
      <div id="main-nav" className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between md:grid md:grid-cols-3">
        {/* Left Column: Brand Logo NANGSAL */}
        <div className="flex items-center justify-start">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleCategoryClick('ALL', 'top');
            }}
            className="hover:opacity-90 transition-opacity flex items-center"
          >
            <img
              src="https://i.ibb.co/Fb2vYJTL/nangsal-logo-transparent-1.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/src/assets/images/brand_logo_transparent.png";
              }}
              alt="NANGSAL APPAREL"
              className="h-8 sm:h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>

        {/* Center Column: Minimal Navigation Links (HOME, SHOP ∨, TERMS) */}
        <nav className="hidden md:flex items-center justify-center gap-6 text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-wider text-[#111111]">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleCategoryClick('ALL', 'top');
            }}
            className="hover:text-[#D85A38] transition-colors"
          >
            HOME
          </a>

          {/* SHOP ∨ Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsShopMenuOpen(!isShopMenuOpen)}
              className="flex items-center gap-1 hover:text-[#D85A38] transition-colors py-1"
            >
              <span>SHOP</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isShopMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsShopMenuOpen(false)}
                />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 py-2 space-y-1 text-left font-mono text-xs uppercase">
                  <button
                    onClick={() => handleCategoryClick('ALL')}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-900 font-bold"
                  >
                    ALL PRODUCTS
                  </button>
                  <button
                    onClick={() => handleCategoryClick('T-SHIRTS')}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700"
                  >
                    T-SHIRTS
                  </button>
                  <button
                    onClick={() => handleCategoryClick('OUTERWEAR')}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700"
                  >
                    OUTERWEAR
                  </button>
                  <button
                    onClick={() => handleCategoryClick('HOODIES')}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700"
                  >
                    HOODIES
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onOpenTerms}
            className="hover:text-[#D85A38] transition-colors uppercase"
          >
            TERMS
          </button>
        </nav>

        {/* Right Column: Search, Shopping Bag Cart, Three Line Menu */}
        <div className="flex items-center justify-end gap-3 sm:gap-4 text-black">
          {/* Search Icon Button */}
          <button
            id="nav-search-btn"
            onClick={onOpenSearch}
            className="p-1.5 hover:text-[#D85A38] transition-colors flex items-center justify-center rounded-lg hover:bg-neutral-100 active:scale-95"
            title="Search Products"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Cart Icon with Item Count Badge & Orange Blink Animation */}
          <button
            id="nav-cart-btn"
            onClick={onOpenCart}
            className={`p-1.5 transition-all duration-300 relative flex items-center justify-center rounded-lg active:scale-95 ${
              isCartBlinking
                ? 'text-[#FF5500] bg-orange-100 ring-2 ring-[#FF5500] scale-110 shadow-lg animate-bounce'
                : 'hover:text-[#D85A38] hover:bg-neutral-100'
            }`}
            title="View Shopping Cart"
          >
            <ShoppingBag className={`w-5 h-5 stroke-[2] ${isCartBlinking ? 'stroke-[#FF5500]' : ''}`} />
            {cartCount > 0 && (
              <span
                id="cart-badge-count"
                className={`absolute -top-1 -right-1 text-[10px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                  isCartBlinking
                    ? 'bg-[#FF5500] text-white ring-2 ring-white scale-125 shadow-md'
                    : 'bg-black text-white'
                }`}
              >
                {cartCount}
              </span>
            )}
            {isCartBlinking && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5500] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF5500]"></span>
              </span>
            )}
          </button>

          {/* Three Line Menu Button */}
          <div className="relative">
            <button
              id="nav-menu-btn"
              onClick={() => setIsThreeDotOpen(!isThreeDotOpen)}
              className="p-1.5 hover:text-[#D85A38] transition-colors flex items-center justify-center rounded-lg hover:bg-neutral-100 active:scale-95"
              title="Menu Options"
            >
              {isThreeDotOpen ? <X className="w-5 h-5 stroke-[2]" /> : <Menu className="w-5 h-5 stroke-[2]" />}
            </button>

            {/* Three Line Dropdown Menu */}
            {isThreeDotOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThreeDotOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 sm:w-52 bg-white border border-neutral-200 rounded-2xl shadow-2xl z-50 py-2.5 space-y-1 text-left font-mono text-xs uppercase animate-in fade-in zoom-in-95 duration-150">
                  {/* Home */}
                  <button
                    onClick={() => handleCategoryClick('ALL', 'top')}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 hover:text-black font-bold tracking-wider transition-colors"
                  >
                    <span>Home</span>
                  </button>

                  {/* Collection */}
                  <button
                    onClick={() => handleCategoryClick('ALL', 'products')}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 hover:text-black font-medium tracking-wider transition-colors"
                  >
                    <span>Collection</span>
                  </button>

                  {/* T shirts */}
                  <button
                    onClick={() => handleCategoryClick('T-SHIRTS', 'products')}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 hover:text-black font-medium tracking-wider transition-colors"
                  >
                    <span>T shirts</span>
                  </button>

                  {/* Outerwear */}
                  <button
                    onClick={() => handleCategoryClick('OUTERWEAR', 'products')}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 hover:text-black font-medium tracking-wider transition-colors"
                  >
                    <span>Outerwear</span>
                  </button>

                  {/* Hoodies */}
                  <button
                    onClick={() => handleCategoryClick('HOODIES', 'products')}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 hover:text-black font-medium tracking-wider transition-colors"
                  >
                    <span>Hoodies</span>
                  </button>

                  {onOpenAdmin && (
                    <div className="pt-2 mt-1 border-t border-neutral-100">
                      <button
                        onClick={() => {
                          setIsThreeDotOpen(false);
                          onOpenAdmin();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-[#D85A38] hover:bg-orange-50 font-bold tracking-wider transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Control Desk</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
