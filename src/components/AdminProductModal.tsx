import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Sparkles,
  Trash2,
  Maximize2,
  Layers,
  Tag,
  DollarSign,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Product } from '../types';
import { uploadImageToStorage } from '../lib/storageManager';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Partial<Product> | null;
  stockMap: Record<string, number>;
  isNew: boolean;
  onSave: (savedProduct: Partial<Product>, stock: Record<string, number>, images: string[]) => Promise<void>;
}

const CATEGORY_OPTIONS = [
  { id: 'T-SHIRTS', label: 'T-SHIRTS / Oversized Tees' },
  { id: 'OUTERWEAR', label: 'OUTERWEAR / Jackets & Coats' },
  { id: 'HOODIES', label: 'HOODIES / Heavy Sweatshirts' },
  { id: 'PANTS', label: 'PANTS / Bottoms & Cargos' },
  { id: 'ACCESSORIES', label: 'ACCESSORIES / Headwear & Bags' },
];

const GENDER_OPTIONS = [
  { id: 'UNISEX', label: 'UNISEX (All Fits)' },
  { id: 'MEN', label: 'MEN (Masculine Cut)' },
  { id: 'WOMEN', label: 'WOMEN (Feminine Cut)' },
];

const AVAILABLE_SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREE SIZE'];

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  product,
  stockMap,
  isNew,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 'Rs. 2,500',
    category: 'T-SHIRTS',
    gender: 'UNISEX',
    description: '',
    inStock: true,
    isBestSeller: false,
    sizes: ['S', 'M', 'L', 'XL'],
  });

  const [currentStock, setCurrentStock] = useState<Record<string, number>>({
    S: 25,
    M: 25,
    L: 25,
    XL: 25,
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  // Sync state when opening
  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      setFormData({
        ...product,
        sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'],
        category: product.category || 'T-SHIRTS',
        gender: product.gender || 'UNISEX',
      });
      setCurrentStock({ ...stockMap });
      const existingImages = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : product.image ? [product.image] : [];
      setImageUrls(existingImages.filter(Boolean));
    } else {
      setFormData({
        name: '',
        price: 'Rs. 2,500',
        category: 'T-SHIRTS',
        gender: 'UNISEX',
        description: '',
        inStock: true,
        isBestSeller: false,
        sizes: ['S', 'M', 'L', 'XL'],
      });
      setCurrentStock({
        S: 25,
        M: 25,
        L: 25,
        XL: 25,
      });
      setImageUrls([]);
    }
    setValidationError('');
  }, [isOpen, product, stockMap]);

  if (!isOpen) return null;

  // Handle Multi-file Upload directly from phone gallery / camera
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setValidationError('');
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Processing & uploading ${i + 1} of ${files.length}...`);
        const file = files[i];
        const url = await uploadImageToStorage(file, 'products');
        newUrls.push(url);
      }
      setImageUrls((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Mobile upload error:', err);
      setValidationError('Failed to upload some images. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      // Reset input value to allow re-selecting same files
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    setImageUrls((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
  };

  const handleToggleSize = (size: string) => {
    const currentSizes = formData.sizes || ['S', 'M', 'L', 'XL'];
    const isSelected = currentSizes.includes(size);
    let updated: string[];
    if (isSelected) {
      updated = currentSizes.filter((s) => s !== size);
      if (updated.length === 0) updated = [size]; // Keep at least one size
    } else {
      updated = [...currentSizes, size];
      if (typeof currentStock[size] !== 'number') {
        setCurrentStock((prev) => ({ ...prev, [size]: 25 }));
      }
    }
    setFormData((prev) => ({ ...prev, sizes: updated }));
  };

  const handleApplyPresetStock = (qty: number) => {
    const activeSizes = formData.sizes || ['S', 'M', 'L', 'XL'];
    const newStock: Record<string, number> = {};
    activeSizes.forEach((sz) => {
      newStock[sz] = qty;
    });
    setCurrentStock(newStock);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const trimmedName = formData.name?.trim();
    if (!trimmedName) {
      setValidationError('Please enter the Product Name.');
      return;
    }

    const trimmedPrice = formData.price?.trim();
    if (!trimmedPrice) {
      setValidationError('Please specify the Product Price.');
      return;
    }

    const activeSizes = formData.sizes && formData.sizes.length > 0
      ? formData.sizes
      : ['S', 'M', 'L', 'XL'];

    // Verify stock exists
    let totalStock = 0;
    activeSizes.forEach((sz) => {
      totalStock += currentStock[sz] ?? 0;
    });

    if (imageUrls.length === 0) {
      // Warning prompt but can still proceed with placeholder
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          ...formData,
          name: trimmedName,
          price: trimmedPrice.startsWith('Rs.') ? trimmedPrice : `Rs. ${trimmedPrice}`,
          inStock: totalStock > 0 && formData.inStock !== false,
        },
        currentStock,
        imageUrls
      );
      onClose();
    } catch (err: any) {
      console.error('Error submitting product form:', err);
      setValidationError(`Could not save product: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Container - Bottom sheet on mobile, centered modal on desktop */}
      <div className="w-full sm:max-w-2xl bg-white rounded-t-[32px] sm:rounded-[28px] max-h-[94vh] flex flex-col shadow-2xl border border-neutral-200/90 overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
        
        {/* Sticky Modal Top Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-neutral-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono">
              {isNew ? '+' : '✎'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                {isNew ? 'Add New Product' : 'Edit Product'}
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                {isNew ? 'Upload styles directly from device' : `Editing #${formData.id?.slice(0, 8) || 'Product'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-left">
          
          {/* Validation Banner */}
          {validationError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-red-800 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. PRODUCT PICTURES / GALLERY UPLOAD */}
          <div className="space-y-2.5 bg-neutral-50/80 p-4 rounded-2xl border border-neutral-200/70">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-800 tracking-wider">
                  Product Pictures ({imageUrls.length})
                </label>
                <p className="text-[11px] text-neutral-500 font-mono">
                  Select 1 or more photos from phone gallery or camera.
                </p>
              </div>

              {/* Upload Button */}
              <label className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>{isUploading ? 'Uploading...' : 'Choose Photos'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelection}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Progress feedback */}
            {isUploading && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-700 text-xs font-mono">
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>{uploadProgress || 'Compressing & uploading pictures...'}</span>
              </div>
            )}

            {/* Images Grid / Previews */}
            {imageUrls.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-200 border-2 border-neutral-300 group shadow-sm"
                  >
                    <img
                      src={url}
                      alt={`Product preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Main Tag */}
                    {idx === 0 ? (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black text-white text-[9px] font-mono font-bold shadow-md">
                        MAIN
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-white/95 text-neutral-900 text-[9px] font-mono font-bold shadow hover:bg-white transition-all"
                      >
                        Set Main
                      </button>
                    )}

                    {/* Full Preview Tap */}
                    <button
                      type="button"
                      onClick={() => setActivePreviewImage(url)}
                      className="absolute top-1.5 left-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity"
                      title="Zoom photo"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>

                    {/* Remove Photo */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white shadow-md active:scale-90 transition-transform"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center border-2 border-dashed border-neutral-200 rounded-xl bg-white">
                <ImageIcon className="w-6 h-6 text-neutral-300 mx-auto mb-1.5" />
                <p className="text-xs text-neutral-400 font-mono">
                  No pictures uploaded yet. Tap &quot;Choose Photos&quot; above to add images.
                </p>
              </div>
            )}
          </div>

          {/* 2. PRODUCT NAME */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. MOUNTAIN LOGO OVERSIZED TEE"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs sm:text-sm font-bold text-neutral-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* 3. PRICE, CATEGORY & GENDER FIT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Price */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1.5">
                Price (NPR) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Rs. 2,500"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs sm:text-sm font-mono font-black text-neutral-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1.5">
                Category
              </label>
              <select
                value={formData.category || 'T-SHIRTS'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-bold text-neutral-900 focus:bg-white focus:outline-none focus:border-black cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender / Fit */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1.5">
                Fit / Gender
              </label>
              <select
                value={formData.gender || 'UNISEX'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-bold text-neutral-900 focus:bg-white focus:outline-none focus:border-black cursor-pointer"
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. SIZES & REAL-TIME STOCK MATRIX */}
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-900">
                  Sizes &amp; Stock Quantities *
                </label>
                <p className="text-[11px] text-neutral-500 font-mono">
                  Tap size pills to enable/disable. Stock auto-deducts on orders.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Quick set:</span>
                {[10, 25, 50].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => handleApplyPresetStock(qty)}
                    className="px-2 py-0.5 rounded-lg bg-white border border-neutral-200 text-[10px] font-mono font-bold text-neutral-700 hover:bg-neutral-100"
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Pills */}
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_SIZE_PRESETS.map((sz) => {
                const isSelected = (formData.sizes || []).includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleToggleSize(sz)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {sz} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>

            {/* Per-size Stepper Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {(formData.sizes || ['S', 'M', 'L', 'XL']).map((sz) => {
                const qty = currentStock[sz] ?? 25;
                return (
                  <div
                    key={sz}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-neutral-200/90 shadow-sm"
                  >
                    <span className="text-xs font-mono font-bold text-neutral-900 w-8">{sz}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentStock((prev) => ({
                            ...prev,
                            [sz]: Math.max(0, (prev[sz] ?? 25) - 1),
                          }))
                        }
                        className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-xs font-black text-neutral-800 active:scale-95"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setCurrentStock((prev) => ({ ...prev, [sz]: val }));
                        }}
                        className="w-12 py-1 text-center font-mono font-bold text-xs bg-neutral-50 rounded-lg border border-neutral-200 focus:bg-white focus:border-black outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentStock((prev) => ({
                            ...prev,
                            [sz]: (prev[sz] ?? 25) + 1,
                          }))
                        }
                        className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-xs font-black text-neutral-800 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. DESCRIPTION */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1.5">
              Product Description &amp; Garment Details
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. 280 GSM heavy combed cotton, boxy oversized streetwear silhouette, high-density screen print..."
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* 6. STATUS TOGGLES (In Stock, Best Seller) */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.inStock !== false}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="w-5 h-5 rounded-lg text-black focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-bold text-neutral-800 font-mono uppercase">
                In Stock (Available for purchase)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(formData.isBestSeller)}
                onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                className="w-5 h-5 rounded-lg text-black focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-bold text-amber-800 font-mono uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Best Seller Badge</span>
              </span>
            </label>
          </div>
        </form>

        {/* Sticky Action Footer */}
        <div className="px-5 py-4 sm:px-6 sm:py-4 bg-neutral-50/90 border-t border-neutral-100 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border border-neutral-200 text-xs font-mono font-bold text-neutral-700 hover:bg-white active:scale-95 transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="flex-1 sm:flex-none px-8 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving to Firebase...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isNew ? 'Publish Product' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lightbox for zooming selected product photo */}
      {activePreviewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActivePreviewImage(null)}
        >
          <div className="relative max-w-lg w-full max-h-[85vh] flex items-center justify-center">
            <button
              onClick={() => setActivePreviewImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-neutral-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activePreviewImage}
              alt="Zoomed product preview"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
