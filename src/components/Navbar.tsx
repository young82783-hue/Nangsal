import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Menu, ChevronDown, X, ArrowRight, Instagram, MessageCircle } from 'lucide-react';
import { CustomNavButton } from '../types';
import { DEFAULT_NAV_BUTTONS } from '../lib/siteContent';

interface NavbarProps {
  cartCount: number;
  isCartBlinking?: boolean;
  announcementText?: string;
  navButtons?: CustomNavButton[];
  activeCategory?: string;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  onOpenTerms: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateExchange?: () => void;
  onOpenAdmin?: () => void;
  onNavigateHome?: () => void;
  onSelectCategory?: (category: 'ALL' | 'T-SHIRTS' | 'OUTERWEAR' | 'HOODIES') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  isCartBlinking = false,
  announcementText = 'NEW DROP LIVE NOW.',
  navButtons,
  activeCategory = 'ALL',
  onOpenCart,
  onOpenSearch,
  onOpenHelp,
  onOpenTerms,
  onNavigatePrivacy,
  onNavigateExchange,
  onNavigateHome,
  onSelectCategory,
}) => {
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  // Active buttons list (from admin site content or default fallback)
  const buttonsToDisplay = (navButtons && navButtons.length > 0
    ? navButtons
    : DEFAULT_NAV_BUTTONS
  ).filter((b) => b.isActive !== false);

  const handleCategoryClick = (category: 'ALL' | 'T-SHIRTS' | 'OUTERWEAR' | 'HOODIES', targetId: string = 'products') => {
    if (onNavigateHome) {
      onNavigateHome();
    }
    if (onSelectCategory) {
      onSelectCategory(category);
    }
    setIsShopMenuOpen(false);
    setIsMenuDropdownOpen(false);
    setIsMobileDrawerOpen(false);
    
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
        {/* Left Column: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center justify-start gap-2.5 sm:gap-3">
          {/* Mobile Slide-in Drawer Hamburger Button */}
          <button
            id="mobile-nav-toggle"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden p-1.5 -ml-1 text-black hover:text-[#D85A38] rounded-lg hover:bg-neutral-100 transition-colors active:scale-95"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 stroke-[2]" />
          </button>

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
              className="h-7 sm:h-9 md:h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>

        {/* Center Column: Minimal Navigation Links (HOME, SHOP ∨, TERMS) - Desktop */}
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

        {/* Right Column: Search, Shopping Bag Cart, Category Menu */}
        <div className="flex items-center justify-end gap-2.5 sm:gap-4 text-black">
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

          {/* 3-Line Menu Category Dropdown for quick collection access */}
          <div className="relative">
            <button
              id="nav-menu-btn"
              onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
              className={`p-1.5 transition-colors flex items-center justify-center rounded-lg active:scale-95 ${
                isMenuDropdownOpen
                  ? 'bg-neutral-900 text-white'
                  : 'hover:text-[#D85A38] hover:bg-neutral-100 text-black'
              }`}
              title="Collections"
              aria-label="Category Menu"
            >
              {isMenuDropdownOpen ? (
                <X className="w-5 h-5 stroke-[2]" />
              ) : (
                <Menu className="w-5 h-5 stroke-[2]" />
              )}
            </button>

            {/* Category Buttons Dropdown Popup */}
            {isMenuDropdownOpen && (
              <>
                {/* Backdrop to dismiss on click outside */}
                <div
                  className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
                  onClick={() => setIsMenuDropdownOpen(false)}
                />

                {/* Dropdown Menu Card */}
                <div className="absolute right-0 top-full mt-2.5 w-48 sm:w-56 bg-white/95 backdrop-blur-xl border border-neutral-200/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 p-2 space-y-1.5 text-left font-mono animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                    Collections
                  </div>

                  <div className="space-y-1">
                    {buttonsToDisplay.map((btn) => {
                      const isSelected = activeCategory === btn.category;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => handleCategoryClick(btn.category, 'products')}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] ${
                            isSelected
                              ? 'bg-black text-white shadow-sm'
                              : 'text-neutral-800 hover:bg-neutral-100 hover:text-black'
                          }`}
                        >
                          <span>{btn.label}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D85A38]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SMOOTH SLIDE-IN MOBILE NAVIGATION DRAWER */}
      {/* =================================================================== */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container (Smooth Slide-In from Left) */}
          <div
            id="mobile-nav-drawer"
            className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between z-10 transform transition-transform duration-300 ease-out animate-in slide-in-from-left"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <img
                src="https://i.ibb.co/Fb2vYJTL/nangsal-logo-transparent-1.png"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/src/assets/images/brand_logo_transparent.png";
                }}
                alt="NANGSAL APPAREL"
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 -mr-1 rounded-full text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
                aria-label="Close Navigation Menu"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Drawer Body Links & Categories */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              {/* Search Bar in Mobile Menu */}
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onOpenSearch();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 rounded-2xl text-xs font-mono border border-neutral-200 transition-colors text-left"
              >
                <Search className="w-4 h-4 text-neutral-400" />
                <span>Search collection or products...</span>
              </button>

              {/* Collections / Categories Section */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold tracking-[0.25em] text-neutral-400 uppercase">
                  Collections
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {buttonsToDisplay.map((btn) => {
                    const isSelected = activeCategory === btn.category;
                    return (
                      <button
                        key={btn.id}
                        onClick={() => handleCategoryClick(btn.category, 'products')}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                          isSelected
                            ? 'bg-black text-white'
                            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-100'
                        }`}
                      >
                        <span>{btn.label}</span>
                        <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Pages Section */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <p className="text-[10px] font-mono font-bold tracking-[0.25em] text-neutral-400 uppercase">
                  Information &amp; Policies
                </p>
                <div className="space-y-1 font-mono text-xs uppercase tracking-wider">
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      if (onNavigateHome) onNavigateHome();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-50 text-neutral-800 font-bold"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenTerms();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-50 text-neutral-700"
                  >
                    Terms &amp; Conditions
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      if (onNavigateExchange) onNavigateExchange();
                      else onOpenHelp();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-50 text-neutral-700"
                  >
                    Exchange Policy
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      if (onNavigatePrivacy) onNavigatePrivacy();
                      else onOpenHelp();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-50 text-neutral-700"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenHelp();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-50 text-neutral-700"
                  >
                    Contact &amp; Help Desk
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer: WhatsApp Support & Social */}
            <div className="p-5 border-t border-neutral-100 bg-neutral-50/70 space-y-3">
              <a
                href="https://wa.me/9779847459808?text=Hello%20Nangsal%20Apparel,%20I%20have%20an%20inquiry%20regarding%20an%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Hotline</span>
              </a>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  BY NANGSAL - NEPAL
                </span>
                <a
                  href="https://www.instagram.com/by_nangsal?igsi=aWpldjB4anIwd3gz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-600"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

