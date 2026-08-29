import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity?: number) => void;
  onBuyNow?: (product: Product, size: string, quantity?: number) => void;
  currencySymbol: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  currencySymbol,
}) => {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  // Safe image list strictly belonging to the currently viewed product
  const safeImages = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter((img): img is string => Boolean(img && typeof img === 'string'));
    }
    return product.image ? [product.image] : [];
  }, [product.id, product.productId, product.images, product.image]);

  // Available sizes for this product
  const availableSizes = useMemo(() => {
    if (Array.isArray(product.availableSizes) && product.availableSizes.length > 0) {
      return product.availableSizes;
    }
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes;
    }
    return ['S', 'M', 'L'];
  }, [product.availableSizes, product.sizes]);

  // Reset all state immediately when product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    setAddedSuccess(false);
    setSelectedSize(availableSizes[0] || 'M');
  }, [product.id, product.productId, availableSizes]);

  const activeIndex = safeImages.length > 0 ? activeImageIndex % safeImages.length : 0;
  const currentImg = safeImages[activeIndex] || product.image || '';

  // Touch Swipe Handling on the main product image
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || safeImages.length <= 1) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 35) {
      // Swipe Left -> Next Image
      setActiveImageIndex((prev) => (prev + 1) % safeImages.length);
    } else if (distance < -35) {
      // Swipe Right -> Prev Image
      setActiveImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (safeImages.length > 1) {
      setActiveImageIndex((prev) => (prev + 1) % safeImages.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (safeImages.length > 1) {
      setActiveImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    }
  };

  const handleAdd = () => {
    onAddToCart(product, selectedSize, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const handleBuyNowClick = () => {
    if (onBuyNow) {
      onBuyNow(product, selectedSize, quantity);
    } else {
      handleAdd();
    }
  };

  const formattedPrice =
    currencySymbol === 'Rs.'
      ? product.price
      : `${currencySymbol} ${(product.rawPrice / 130).toFixed(2)}`;

  const categoryLabel = (product.category || 'T-SHIRTS').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Product Detail Modal Card */}
      <div className="relative z-10 w-full max-w-xl bg-white min-h-screen sm:min-h-0 sm:rounded-2xl overflow-hidden shadow-2xl text-black my-0 sm:my-8 transition-all">
        {/* Top Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/90 hover:bg-white text-black transition-all border border-neutral-200 shadow-md active:scale-95"
          title="Close"
          aria-label="Close product view"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 sm:p-6 md:p-8 space-y-5">
          {/* Main Product Image with Left/Right Navigation Arrows */}
          <div className="relative w-full">
            <div
              className="relative aspect-[3/4] sm:aspect-[4/5] w-full rounded-none overflow-hidden bg-neutral-950 flex items-center justify-center touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                key={`${product.productId || product.id}-${activeIndex}-${currentImg}`}
                src={currentImg}
                alt={product.name}
                className="w-full h-full object-cover object-center select-none"
                referrerPolicy="no-referrer"
              />

              {/* Left & Right Chevron Navigation Controls */}
              {safeImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center shadow-md border border-neutral-200/80 transition-transform active:scale-90 z-20"
                    title="Previous Image"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center shadow-md border border-neutral-200/80 transition-transform active:scale-90 z-20"
                    title="Next Image"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery Underneath Main Image */}
            {safeImages.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 mt-3.5 overflow-x-auto py-1 scrollbar-none">
                {safeImages.map((imgUrl, idx) => {
                  const isSelected = activeIndex === idx;
                  return (
                    <button
                      type="button"
                      key={`${product.productId || product.id}-thumb-${idx}-${imgUrl}`}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative flex-shrink-0 w-14 h-16 sm:w-16 sm:h-20 bg-neutral-950 overflow-hidden transition-all ${
                        isSelected
                          ? 'border-2 border-black ring-1 ring-black scale-100'
                          : 'border border-neutral-200 opacity-60 hover:opacity-100 hover:border-neutral-400'
                      }`}
                      title={`View image ${idx + 1}`}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Information Section */}
          <div className="pt-2 space-y-4 text-left">
            {/* Category / Season */}
            <div className="font-mono text-xs text-neutral-400 uppercase tracking-widest font-semibold">
              {categoryLabel} — SS26
            </div>

            {/* Product Title */}
            <h1 className="font-display sm:font-mono text-2xl sm:text-3xl font-black uppercase tracking-tight text-black leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="font-mono text-xl sm:text-2xl font-extrabold text-black">
              {formattedPrice}
            </div>

            {/* Size Selector */}
            <div className="pt-2 space-y-2">
              <label className="block font-mono text-[11px] text-neutral-500 uppercase tracking-wider font-bold">
                SELECT SIZE
              </label>
              <div className="flex flex-wrap gap-2.5">
                {availableSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 min-w-[56px] px-4 font-mono text-xs flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-2 border-black text-black bg-white font-bold ring-1 ring-black'
                          : 'border border-neutral-200 text-neutral-800 bg-white hover:border-neutral-400 font-medium'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="pt-2 space-y-2">
              <label className="block font-mono text-[11px] text-neutral-500 uppercase tracking-wider font-bold">
                QUANTITY
              </label>
              <div className="inline-flex items-center border border-neutral-200 bg-white px-5 py-3 text-xs font-mono gap-8">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-neutral-500 hover:text-black font-extrabold text-base leading-none select-none px-1"
                  aria-label="Decrease quantity"
                >
                  —
                </button>
                <span className="font-extrabold text-black min-w-[16px] text-center text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="text-neutral-500 hover:text-black font-extrabold text-base leading-none select-none px-1"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Height and Weight Input Fields */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                  HEIGHT (CM/FT)
                </label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="E.G. 5'10"
                  className="w-full py-2 border-b border-neutral-300 text-xs font-mono uppercase text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors rounded-none bg-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                  WEIGHT (KG/LBS)
                </label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="E.G. 70KG"
                  className="w-full py-2 border-b border-neutral-300 text-xs font-mono uppercase text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors rounded-none bg-transparent"
                />
              </div>
            </div>

            {/* Technical Description Specifications */}
            <div className="pt-4 space-y-2.5">
              <h3 className="font-mono text-xs font-black uppercase tracking-widest text-black">
                TECHNICAL DESCRIPTION
              </h3>
              <ul className="space-y-2 font-mono text-[10px] sm:text-[11px] text-neutral-700 uppercase tracking-wide leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-black font-bold select-none">•</span>
                  <span>PREMIUM HEAVYWEIGHT COTTON DROP-SHOULDER CUT</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-black font-bold select-none">•</span>
                  <span>HIGH-DENSITY {product.name.toUpperCase()} GRAPHIC PRINT ON FRONT &amp; BACK</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-black font-bold select-none">•</span>
                  <span>REINFORCED COLLAR &amp; DOUBLE-NEEDLE STITCHING</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-black font-bold select-none">•</span>
                  <span>UNISEX OVERSIZED FIT DESIGNED IN NEPAL</span>
                </li>
              </ul>
            </div>

            {/* Primary Action Buttons: ADD TO BAG & BUY IT NOW */}
            <div className="space-y-3 pt-6 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleAdd}
                className="w-full bg-black hover:bg-neutral-900 text-white font-mono text-xs uppercase tracking-widest py-4 font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2 rounded-none"
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>ADDED TO BAG!</span>
                  </>
                ) : (
                  <span>ADD TO BAG</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNowClick}
                className="w-full bg-white hover:bg-neutral-50 text-black border border-black font-mono text-xs uppercase tracking-widest py-4 font-bold transition-all active:scale-[0.99] flex items-center justify-center rounded-none"
              >
                BUY IT NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
