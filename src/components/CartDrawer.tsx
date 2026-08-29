import React from 'react';
import { Product } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  currencySymbol: string;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  currencySymbol,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const totalRaw = cart.reduce(
    (sum, item) => sum + item.product.rawPrice * item.quantity,
    0
  );

  const formattedTotal =
    currencySymbol === 'Rs.'
      ? `Rs. ${totalRaw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : `${currencySymbol} ${(totalRaw / 130).toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-2xl p-6 text-black animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-black" />
            <h2 className="font-display text-lg font-black uppercase tracking-wider">
              YOUR BAG ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <ShoppingBag className="w-12 h-12 text-neutral-300 stroke-[1.2]" />
              <p className="font-mono text-xs font-bold text-neutral-500 uppercase tracking-wider">
                YOUR BAG IS CURRENTLY EMPTY.
              </p>
              <button
                onClick={onClose}
                className="bg-black text-white font-mono text-xs uppercase px-6 py-2.5 rounded-full hover:bg-neutral-800 transition-colors"
              >
                EXPLORE DROPS
              </button>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemFormattedPrice =
                currencySymbol === 'Rs.'
                  ? item.product.price
                  : `${currencySymbol} ${(item.product.rawPrice / 130).toFixed(2)}`;

              return (
                <div
                  key={`${item.product.id}-${item.size}-${idx}`}
                  className="flex gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100"
                >
                  <img
                    key={`${item.product.id}-${item.product.image}`}
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg shrink-0 bg-neutral-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-mono text-xs font-bold uppercase">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="text-neutral-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-mono text-[10px] text-neutral-500 uppercase">
                        SIZE: {item.size}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-neutral-200 rounded-lg bg-white">
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs font-bold hover:bg-neutral-100 rounded-l-lg font-mono"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            if (item.quantity >= 5) {
                              alert('Maximum 5 units allowed per product per order.');
                              return;
                            }
                            onUpdateQuantity(idx, item.quantity + 1);
                          }}
                          className="px-2 py-0.5 text-xs font-bold hover:bg-neutral-100 rounded-r-lg font-mono"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono text-xs font-bold">
                        {itemFormattedPrice}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout CTA */}
        {cart.length > 0 && (
          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase">
              <span>ESTIMATED TOTAL:</span>
              <span className="text-sm font-mono font-black text-black">
                {formattedTotal}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full bg-[#D85A38] hover:bg-[#c24e2e] text-white font-mono text-xs uppercase tracking-widest py-3.5 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-md font-bold"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
