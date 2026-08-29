import React, { useState } from 'react';
import { Product } from '../types';
import { Search, X, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  currencySymbol: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  currencySymbol,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl p-5 space-y-4 text-black">
        {/* Search Bar Input */}
        <div className="relative flex items-center border-b border-neutral-200 pb-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drops, hoodies, tees..."
            autoFocus
            className="w-full text-sm font-mono uppercase bg-transparent text-black placeholder:text-neutral-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-black mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[10px] font-mono uppercase text-neutral-500 pb-1">
          <span className="font-bold text-black">SUGGESTED:</span>
          {['17 HOODIE', 'DENIM JACKET', 'RIRI T-SHIRT', 'CRIMSON', 'STATEMENT'].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="bg-neutral-100 hover:bg-neutral-200 text-black px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-semibold"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pt-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-neutral-400 uppercase">
              NO DROPS MATCHED "{query}"
            </div>
          ) : (
            filtered.map((product) => {
              const formattedPrice =
                currencySymbol === 'Rs.'
                  ? product.price
                  : `${currencySymbol} ${(product.rawPrice / 130).toFixed(2)}`;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 cursor-pointer border border-transparent hover:border-neutral-100 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      key={`${product.id}-${product.image}`}
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg bg-neutral-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-mono text-xs font-bold uppercase group-hover:text-[#D96332] transition-colors">
                        {product.name}
                      </h4>
                      <p className="font-mono text-[10px] text-neutral-400 uppercase">
                        {product.category} — {formattedPrice}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
