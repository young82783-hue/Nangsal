import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  currencySymbol: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  currencySymbol,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Safe images strictly belonging to this product
  const safeImages = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    return product.image ? [product.image] : [];
  }, [product.images, product.image]);

  // Reset image index when product identity changes
  useEffect(() => {
    setCurrentImgIndex(0);
  }, [product.id, product.productId]);

  const activeIndex = safeImages.length > 0 ? currentImgIndex % safeImages.length : 0;
  const currentImg = safeImages[activeIndex] || product.image || '';

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (safeImages.length > 1) {
      setCurrentImgIndex((prev) => (prev + 1) % safeImages.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (safeImages.length > 1) {
      setCurrentImgIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    }
  };

  const handleDotClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex(idx);
  };

  const formattedPrice =
    currencySymbol === 'Rs.'
      ? product.price
      : `${currencySymbol} ${(product.rawPrice / 130).toFixed(2)}`;

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group cursor-pointer flex flex-col text-left transition-all duration-200"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-none">
        <img
          key={`${product.productId || product.id}-${activeIndex}-${currentImg}`}
          src={currentImg}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />



        {/* Out of Stock Badge Overlay */}
        {(product.inStock === false || (Array.isArray(product.availableSizes) && product.availableSizes.length === 0)) && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
            <span className="bg-black text-white font-mono text-[10px] sm:text-xs font-bold tracking-widest uppercase px-3 py-1.5 shadow-lg">
              OUT OF STOCK
            </span>
          </div>
        )}


      </div>

      {/* Product Details */}
      <div className="mt-3 space-y-1">
        <h4 className="font-mono font-bold text-[11px] sm:text-xs text-black tracking-wider uppercase leading-snug group-hover:text-neutral-700 transition-colors">
          {product.name}
        </h4>
        <p className="font-mono text-[11px] sm:text-xs text-neutral-500 font-bold">
          {formattedPrice}
        </p>
      </div>
    </div>
  );
};

interface ProductCatalogProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  currencySymbol: string;
  activeFilter?: 'ALL' | 'T-SHIRTS' | 'OUTERWEAR' | 'HOODIES';
  onFilterChange?: (filter: 'ALL' | 'T-SHIRTS' | 'OUTERWEAR' | 'HOODIES') => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onSelectProduct,
  currencySymbol,
  activeFilter: controlledFilter,
  onFilterChange,
}) => {
  const [internalFilter, setInternalFilter] = useState<'ALL' | 'T-SHIRTS' | 'OUTERWEAR' | 'HOODIES'>('ALL');
  const activeFilter = controlledFilter !== undefined ? controlledFilter : internalFilter;
  const setActiveFilter = (filter: 'ALL' | 'T-SHIRTS' | 'OUTERWEAR' | 'HOODIES') => {
    if (onFilterChange) {
      onFilterChange(filter);
    } else {
      setInternalFilter(filter);
    }
  };

  const filterCounts = {
    ALL: products.length,
    'T-SHIRTS': products.filter((p) => p.category === 'TOPS').length,
    OUTERWEAR: products.filter((p) => p.category === 'OUTERWEAR').length,
    HOODIES: products.filter((p) => p.category === 'HOODIES').length,
  };

  const filteredProducts = products.filter((p) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'T-SHIRTS') return p.category === 'TOPS';
    if (activeFilter === 'OUTERWEAR') return p.category === 'OUTERWEAR';
    if (activeFilter === 'HOODIES') return p.category === 'HOODIES';
    return true;
  });

  const topsProducts = filteredProducts.filter((p) => p.category === 'TOPS');
  const outerwearProducts = filteredProducts.filter((p) => p.category === 'OUTERWEAR');
  const hoodiesProducts = filteredProducts.filter((p) => p.category === 'HOODIES');

  return (
    <section id="products" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Category Filter Navigation Bar */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-6 border-b border-neutral-200 pb-3 mb-10 text-xs font-mono tracking-wider uppercase">
        {(['ALL', 'T-SHIRTS', 'OUTERWEAR', 'HOODIES'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`whitespace-nowrap transition-colors relative pb-1 ${
              activeFilter === filter
                ? 'font-bold text-black'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {filter} <span className="text-[10px] text-neutral-400 font-mono">({filterCounts[filter]})</span>
            {activeFilter === filter && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </button>
        ))}
      </div>

      {/* Tops Category */}
      {topsProducts.length > 0 && (
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-3">
            <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-wider text-black">
              TOPS
            </h3>
            <button
              onClick={() => setActiveFilter('T-SHIRTS')}
              className="bg-black text-white hover:bg-neutral-800 text-[10px] font-mono uppercase tracking-widest px-4 py-1.5 rounded-full transition-colors font-bold"
            >
              VIEW ALL
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {topsProducts.map((product) => (
              <ProductCard
                key={product.productId || product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        </div>
      )}

      {/* Outerwear Category */}
      {outerwearProducts.length > 0 && (
        <div className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-neutral-100 pb-3">
            <h3 className="font-display text-base sm:text-xl font-black uppercase tracking-wider text-black">
              OUTERWEAR
            </h3>
            <button
              onClick={() => setActiveFilter('OUTERWEAR')}
              className="bg-black text-white hover:bg-neutral-800 text-[10px] font-mono uppercase tracking-widest px-3.5 sm:px-4 py-1.5 rounded-full transition-colors font-bold"
            >
              VIEW ALL
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {outerwearProducts.map((product) => (
              <ProductCard
                key={product.productId || product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hoodies Category */}
      {hoodiesProducts.length > 0 && (
        <div className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-neutral-100 pb-3">
            <h3 className="font-display text-base sm:text-xl font-black uppercase tracking-wider text-black">
              HOODIES
            </h3>
            <button
              onClick={() => setActiveFilter('HOODIES')}
              className="bg-black text-white hover:bg-neutral-800 text-[10px] font-mono uppercase tracking-widest px-3.5 sm:px-4 py-1.5 rounded-full transition-colors font-bold"
            >
              VIEW ALL
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {hoodiesProducts.map((product) => (
              <ProductCard
                key={product.productId || product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
