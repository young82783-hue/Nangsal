import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CartItem } from './CartDrawer';
import { DELIVERY_LOCATIONS, DeliveryLocation } from '../data/deliveryLocations';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Upload,
  Check,
  ChevronDown,
  Lock,
  Loader2,
  Trash2,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { WhatsAppIcon } from './SocialIcons';

interface CheckoutPageProps {
  cart: CartItem[];
  currencySymbol: string;
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  onClearCart: () => void;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cart,
  currencySymbol,
  onNavigateHome,
  onNavigateBack,
  onClearCart,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation>(
    DELIVERY_LOCATIONS[0] // Default Kathmandu City
  );
  const [locationSearch, setLocationSearch] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'ESEWA' | 'BANK' | 'COD'>('ESEWA');
  const [selectedQrType, setSelectedQrType] = useState<'ESEWA' | 'BANK'>('ESEWA');

  // Screenshot Upload
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    fullName: string;
    phone: string;
    location: string;
    address: string;
    totalAmount: number;
    paymentMethod: string;
    whatsAppUrl: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter locations by search query
  const filteredLocations = useMemo(() => {
    if (!locationSearch.trim()) return DELIVERY_LOCATIONS;
    const query = locationSearch.toLowerCase().trim();
    return DELIVERY_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.district.toLowerCase().includes(query) ||
        loc.zoneLabel.toLowerCase().includes(query)
    );
  }, [locationSearch]);

  // Pricing calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.rawPrice * item.quantity, 0);
  }, [cart]);

  const deliveryCharge = selectedLocation ? selectedLocation.charge : 100;
  const totalAmount = subtotal + deliveryCharge;

  const formattedSubtotal = `Rs. ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formattedDelivery = `Rs. ${deliveryCharge.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formattedTotal = `Rs. ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // File Upload Handler with base64 conversion
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please choose an image under 5MB.');
        return;
      }
      setScreenshotFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotDataUrl(reader.result as string);
        setSubmitError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Build formatted WhatsApp link
  const generateWhatsAppUrl = (
    orderId: string,
    custName: string,
    custPhone: string,
    custAddr: string,
    loc: DeliveryLocation,
    method: string,
    itemsList: CartItem[],
    subTot: number,
    shipFee: number,
    grandTot: number
  ) => {
    const itemsFormatted = itemsList
      .map((it) => `• ${it.quantity}x ${it.product.name} (Size: ${it.size}) - Rs. ${(it.product.rawPrice * it.quantity).toLocaleString()}`)
      .join('\n');

    const rawMessage = `🛍️ *NEW ORDER - NANGSAL APPAREL*
━━━━━━━━━━━━━━━━━━━━━
*Order ID:* ${orderId}
*Customer:* ${custName}
*Phone:* ${custPhone}
*Address:* ${custAddr}
*Delivery Location:* ${loc.name}, ${loc.district} (${loc.zoneLabel} - Rs. ${shipFee})

*ITEMS:*
${itemsFormatted}

*PAYMENT SUMMARY:*
Subtotal: Rs. ${subTot.toLocaleString()}
Delivery: Rs. ${shipFee.toLocaleString()}
*Total Amount: Rs. ${grandTot.toLocaleString()}*
*Payment Method:* ${method}
${method !== 'COD' ? '✓ Payment Screenshot Uploaded to System' : 'Cash to be collected upon delivery'}
━━━━━━━━━━━━━━━━━━━━━
Please confirm order verification & dispatch schedule.`;

    const encoded = encodeURIComponent(rawMessage);
    return `https://wa.me/9779847459808?text=${encoded}`;
  };

  // Submit Order to Firebase and trigger WhatsApp
  const handleVerifyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Form Validations
    if (!fullName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setSubmitError('Please enter a valid phone number (e.g. 98XXXXXXXX).');
      return;
    }

    if (!address.trim()) {
      setSubmitError('Please enter your complete street / house delivery address.');
      return;
    }

    if (!selectedLocation) {
      setSubmitError('Please select a delivery location from the list.');
      return;
    }

    if ((paymentMethod === 'ESEWA' || paymentMethod === 'BANK') && !screenshotDataUrl) {
      setSubmitError('Please upload a screenshot (SS) of your payment transfer before verifying.');
      return;
    }

    if (cart.length === 0) {
      setSubmitError('Your shopping bag is empty.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderId = `NANGSAL-${randomDigits}`;
    const orderDocId = `order_${randomDigits}`;

    const orderPayload = {
      orderId,
      orderNumber: orderId,
      fullName: fullName.trim(),
      phoneNumber: cleanPhone,
      deliveryAddress: address.trim(),
      deliveryLocation: {
        id: selectedLocation.id,
        name: selectedLocation.name,
        district: selectedLocation.district,
        zone: selectedLocation.zone,
        zoneLabel: selectedLocation.zoneLabel,
      },
      city: `${selectedLocation.name}, ${selectedLocation.district}`,
      deliveryZone: selectedLocation.zone,
      deliveryCharge,
      subtotal,
      totalAmount,
      currency: 'NPR',
      items: cart.map((item) => ({
        id: item.product.id,
        productId: item.product.productId || item.product.id,
        name: item.product.name,
        price: item.product.price,
        rawPrice: item.product.rawPrice,
        size: item.size,
        quantity: item.quantity,
        image: item.product.image || (item.product.images && item.product.images[0]) || '',
      })),
      paymentMethod,
      uploadedReceipt: screenshotDataUrl || null,
      paymentScreenshot: screenshotDataUrl || null,
      orderStatus: 'PENDING_VERIFICATION',
      status: 'PENDING_VERIFICATION',
      paymentStatus: paymentMethod === 'COD' ? 'COD_PENDING' : 'SCREENSHOT_SUBMITTED',
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString(),
      userId: auth.currentUser?.uid || null,
    };

    try {
      // 1. Save permanently to Firestore orders collection
      await setDoc(doc(db, 'orders', orderDocId), orderPayload);

      // 2. Generate WhatsApp link
      const waUrl = generateWhatsAppUrl(
        orderId,
        fullName.trim(),
        cleanPhone,
        address.trim(),
        selectedLocation,
        paymentMethod,
        cart,
        subtotal,
        deliveryCharge,
        totalAmount
      );

      // 3. Clear cart from state & localStorage
      onClearCart();

      // 4. Update UI to Confirmation State
      setConfirmedOrder({
        orderId,
        fullName: fullName.trim(),
        phone: cleanPhone,
        location: `${selectedLocation.name}, ${selectedLocation.district}`,
        address: address.trim(),
        totalAmount,
        paymentMethod,
        whatsAppUrl: waUrl,
      });

      // 5. Open WhatsApp in new window/tab safely
      try {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Could not auto-open WhatsApp popup, user can click link on confirmation screen', err);
      }
    } catch (err: any) {
      console.error('Firebase save order failed:', err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `orders/${orderDocId}`);
      } catch {}
      setSubmitError(
        'Could not save order to system. Please check your internet connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // RENDER CONFIRMATION STATE
  // ----------------------------------------------------
  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-white text-black py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="font-mono text-xs text-emerald-600 font-extrabold tracking-widest uppercase block">
              ORDER SAVED &amp; LOGGED TO SYSTEM
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              ORDER CONFIRMATION
            </h1>
            <p className="font-mono text-xs text-neutral-500">
              Your order has been permanently recorded in our system.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <span className="text-neutral-500 uppercase font-bold">ORDER ID</span>
              <span className="font-black text-sm text-[#D85A38]">{confirmedOrder.orderId}</span>
            </div>

            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <span className="text-neutral-500 uppercase font-bold">CUSTOMER</span>
              <span className="font-bold text-black">{confirmedOrder.fullName} ({confirmedOrder.phone})</span>
            </div>

            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <span className="text-neutral-500 uppercase font-bold">DELIVERY LOCATION</span>
              <span className="font-bold text-black text-right">{confirmedOrder.location}</span>
            </div>

            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <span className="text-neutral-500 uppercase font-bold">PAYMENT METHOD</span>
              <span className="font-bold text-black">{confirmedOrder.paymentMethod}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-neutral-500 uppercase font-bold">TOTAL AMOUNT</span>
              <span className="font-black text-base text-emerald-600">
                Rs. {confirmedOrder.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* WhatsApp Direct Action CTA */}
          <div className="space-y-3">
            <a
              href={confirmedOrder.whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-mono text-xs uppercase tracking-wider py-4 px-6 font-bold flex items-center justify-center gap-2 rounded-none shadow-md transition-all active:scale-[0.99]"
            >
              <WhatsAppIcon className="w-5 h-5 text-white" />
              <span>OPEN WHATSAPP ORDER CHAT</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full bg-black hover:bg-neutral-900 text-white font-mono text-xs uppercase tracking-widest py-4 font-bold transition-all active:scale-[0.99] rounded-none"
            >
              RETURN TO SHOPPING
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER EMPTY SHOPPING BAG STATE
  // ----------------------------------------------------
  if (cart.length === 0) {
    return (
      <div className="min-h-[80vh] bg-white text-black flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            YOUR SHOPPING BAG IS EMPTY
          </h2>
          <p className="font-mono text-xs text-neutral-500 max-w-md mx-auto">
            You do not have any items in your bag. Explore our luxury streetwear drops and add your favorite pieces to checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateHome}
          className="bg-black hover:bg-neutral-900 text-white font-mono text-xs uppercase tracking-widest py-4 px-8 font-bold rounded-none transition-all"
        >
          EXPLORE CATALOG
        </button>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN CHECKOUT PAGE LAYOUT
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-white text-black py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation Bar / Return Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <button
            type="button"
            onClick={onNavigateBack}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold text-neutral-700 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO STORE</span>
          </button>
          <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 font-bold">
            CHECKOUT
          </span>
        </div>

        {/* Product Items List */}
        <div className="divide-y divide-neutral-100 border-y border-neutral-100 py-2">
          {cart.map((item, idx) => (
            <div key={`${item.product.id}-${item.size}-${idx}`} className="py-4 flex gap-4 items-start">
              <div className="w-18 h-22 sm:w-20 sm:h-24 bg-neutral-950 flex-shrink-0 overflow-hidden flex items-center justify-center">
                <img
                  src={item.product.image || (item.product.images && item.product.images[0]) || ''}
                  alt={item.product.name}
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-[10px] text-neutral-400 uppercase font-semibold">
                      {item.product.category || 'T-SHIRTS'}
                    </div>
                    <h2 className="font-mono text-xs sm:text-sm font-extrabold uppercase text-black tracking-tight truncate">
                      {item.product.name}
                    </h2>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-extrabold text-black ml-2">
                    {item.product.price}
                  </div>
                </div>

                <div className="font-mono text-xs text-neutral-600">
                  SIZE: <span className="font-bold text-black">{item.size}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="inline-flex items-center border border-neutral-200 bg-white px-2.5 py-1 text-xs font-mono gap-4">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                      className="text-neutral-500 hover:text-black font-extrabold select-none"
                      aria-label="Decrease quantity"
                    >
                      —
                    </button>
                    <span className="font-bold text-black min-w-[12px] text-center text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                      className="text-neutral-500 hover:text-black font-extrabold select-none"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(idx)}
                    className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleVerifyOrder} className="space-y-6">
          {/* Customer Inputs: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                NAME *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="YOUR NAME"
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-xs font-mono uppercase text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                PHONE *
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-xs font-mono uppercase text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
              />
            </div>
          </div>

          {/* Address & Delivery Location Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                ADDRESS *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="HOUSE NO., STREET"
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-xs font-mono uppercase text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
              />
            </div>

            {/* Delivery Location Selector with Live Search */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
              <div className="flex justify-between items-center">
                <label className="block font-mono text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                  CITY / LOCATION *
                </label>
                <span className="font-mono text-[9px] text-neutral-400 font-bold uppercase flex items-center gap-0.5">
                  <Search className="w-2.5 h-2.5" /> SEARCH
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsLocationDropdownOpen((prev) => !prev)}
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-xs font-mono uppercase text-black text-left flex items-center justify-between bg-white hover:border-neutral-400 transition-colors"
              >
                <span className="truncate">
                  {selectedLocation
                    ? `${selectedLocation.name} (Rs. ${selectedLocation.charge})`
                    : 'SELECT LOCATION'}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {isLocationDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden max-h-72 flex flex-col">
                  <div className="p-2 border-b border-neutral-100 bg-neutral-50 sticky top-0">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder="Search district, city or zone..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-neutral-200 rounded-md focus:outline-none focus:border-black uppercase bg-white text-black"
                      />
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 divide-y divide-neutral-50">
                    {filteredLocations.length === 0 ? (
                      <div className="p-4 text-center font-mono text-xs text-neutral-400">
                        No locations matching "{locationSearch}"
                      </div>
                    ) : (
                      filteredLocations.map((loc) => {
                        const isSelected = selectedLocation?.id === loc.id;
                        return (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setSelectedLocation(loc);
                              setIsLocationDropdownOpen(false);
                              setLocationSearch('');
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs font-mono flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-neutral-100 font-bold text-black'
                                : 'hover:bg-neutral-50 text-neutral-800'
                            }`}
                          >
                            <div>
                              <div className="uppercase font-extrabold">{loc.name}</div>
                              <div className="text-[10px] text-neutral-400">
                                {loc.district} &bull; {loc.zoneLabel}
                              </div>
                            </div>
                            <span className="font-mono text-xs font-extrabold text-neutral-900 ml-2">
                              Rs. {loc.charge}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Summary & Total Amount - Positioned right below details and directly above QR/Payment */}
          <div className="space-y-2.5 font-mono text-xs bg-neutral-50 border border-neutral-200 rounded-xl p-4">
            <div className="flex justify-between items-center text-neutral-500 uppercase font-bold">
              <span>SUBTOTAL</span>
              <span className="text-black font-extrabold">{formattedSubtotal}</span>
            </div>

            <div className="flex justify-between items-center text-neutral-500 uppercase font-bold">
              <span>
                DELIVERY CHARGE ({selectedLocation?.zoneLabel?.toUpperCase() || 'INSIDE VALLEY'})
              </span>
              <span className="text-black font-extrabold">{formattedDelivery}</span>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-neutral-200">
              <span className="font-black text-sm uppercase tracking-wide text-black">
                TOTAL AMOUNT
              </span>
              <span className="font-black text-base sm:text-lg text-black">
                {formattedTotal}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2">
            <label className="block font-mono text-[11px] text-neutral-600 uppercase font-bold tracking-wider">
              SELECT PAYMENT METHOD *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('ESEWA');
                  setSelectedQrType('ESEWA');
                }}
                className={`py-3 px-2 text-center rounded-lg border transition-all ${
                  paymentMethod === 'ESEWA'
                    ? 'bg-[#00B14F] text-white border-[#00B14F] font-bold shadow-sm'
                    : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="font-mono text-xs font-black uppercase">ESEWA</div>
                <div className="font-mono text-[9px] opacity-80 uppercase tracking-tighter">
                  DIRECT QR
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('BANK');
                  setSelectedQrType('BANK');
                }}
                className={`py-3 px-2 text-center rounded-lg border transition-all ${
                  paymentMethod === 'BANK'
                    ? 'bg-black text-white border-black font-bold shadow-sm'
                    : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="font-mono text-xs font-black uppercase">BANK</div>
                <div className="font-mono text-[9px] opacity-80 uppercase tracking-tighter">
                  TRANSFER
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`py-3 px-2 text-center rounded-lg border transition-all ${
                  paymentMethod === 'COD'
                    ? 'bg-black text-white border-black font-bold shadow-sm'
                    : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="font-mono text-xs font-black uppercase">COD</div>
                <div className="font-mono text-[9px] opacity-80 uppercase tracking-tighter">
                  ON DELIVERY
                </div>
              </button>
            </div>
          </div>

          {/* Payment Details Container */}
          {(paymentMethod === 'ESEWA' || paymentMethod === 'BANK') && (
            <div className="p-4 sm:p-5 border border-neutral-200 rounded-xl space-y-4 bg-neutral-50/50">
              <div className="space-y-1 text-left">
                <div className="font-mono text-xs font-black uppercase text-black">
                  {selectedQrType === 'ESEWA'
                    ? 'ESEWA DIRECT ONLINE PAYMENT'
                    : 'BANK TRANSFER ONLINE PAYMENT'}
                </div>
                <p className="font-mono text-[11px] text-neutral-500">
                  Pay the total amount <strong className="text-black">{formattedTotal}</strong> using {selectedQrType === 'ESEWA' ? 'eSewa' : 'Bank'} QR below.
                </p>
              </div>

              {/* QR Toggle Switch */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                  SELECT QR CODE TO SCAN:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQrType('ESEWA')}
                    className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      selectedQrType === 'ESEWA'
                        ? 'bg-[#00B14F] text-white border-[#00B14F]'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                    <span>ESEWA QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedQrType('BANK')}
                    className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      selectedQrType === 'BANK'
                        ? 'bg-[#0F52BA] text-white border-[#0F52BA]'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                    <span>BANK QR</span>
                  </button>
                </div>
              </div>

              {/* QR Code Presentation Box */}
              <div className="bg-white border border-neutral-200 rounded-xl p-5 text-center space-y-3 shadow-sm">
                <div className="font-mono text-xs font-black uppercase tracking-wider text-black">
                  SCAN {selectedQrType === 'ESEWA' ? 'ESEWA' : 'BANK'} QR
                </div>

                {/* SVG Rendered High-Quality QR Placeholder */}
                <div className="w-48 h-48 mx-auto bg-white border-2 border-neutral-900 rounded-lg p-2.5 flex items-center justify-center shadow-inner">
                  {selectedQrType === 'ESEWA' ? (
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=9847459808_ESEWA_NANGSAL"
                      alt="eSewa QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SUNIL_GURUNG_BANK_NANGSAL"
                      alt="Bank Transfer QR Code"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                <div className="bg-neutral-50 border border-neutral-200/80 rounded-lg py-2 px-4 font-mono text-xs font-bold text-neutral-800 tracking-wider">
                  HOLDER: SUNIL GURUNG
                </div>

                {selectedQrType === 'BANK' && (
                  <div className="text-[10px] font-mono text-neutral-500 space-y-0.5 pt-1">
                    <div>Bank: NIC ASIA BANK / GLOBAL IME</div>
                    <div>A/C Name: SUNIL GURUNG &bull; A/C No: 20268847459808</div>
                  </div>
                )}
              </div>

              {/* Required Total Payment Highlight Banner (from screenshot) */}
              <div className="bg-[#111] text-white rounded-xl p-4 text-center space-y-1">
                <div className="font-mono text-[10px] text-neutral-400 uppercase font-bold tracking-widest">
                  REQUIRED TOTAL PAYMENT
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-black text-[#00E5FF] tracking-tight">
                  {formattedTotal}
                </div>
                <div className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider">
                  FULL ORDER TOTAL
                </div>
              </div>

              {/* Upload Screenshot (SS) Section with yellow highlight frame */}
              <div className="bg-[#FFFDF0] border-2 border-[#F6C343] rounded-xl p-4 space-y-2">
                <label className="block font-mono text-[11px] font-black uppercase text-black">
                  UPLOAD SCREENSHOT (SS) *
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="ss-upload-input"
                  />
                  <label
                    htmlFor="ss-upload-input"
                    className="w-full sm:w-auto bg-[#F25C05] hover:bg-[#d95204] text-white font-mono text-xs font-bold uppercase py-2.5 px-4 rounded cursor-pointer text-center select-none transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose file</span>
                  </label>
                  <span className="font-mono text-xs text-neutral-600 truncate max-w-xs">
                    {screenshotFileName || 'No file chosen'}
                  </span>
                </div>

                {/* Thumbnail Preview */}
                {screenshotDataUrl && (
                  <div className="pt-2 flex items-center gap-3">
                    <img
                      src={screenshotDataUrl}
                      alt="Uploaded Receipt Preview"
                      className="w-16 h-16 object-cover rounded border border-neutral-300"
                    />
                    <div className="font-mono text-[10px] text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      <span>Payment screenshot ready for verification</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COD Notice */}
          {paymentMethod === 'COD' && (
            <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50 space-y-2 font-mono text-xs">
              <div className="font-bold text-neutral-900 uppercase">
                CASH ON DELIVERY (COD) SELECTED
              </div>
              <p className="text-neutral-600 text-[11px] leading-relaxed">
                You will pay <strong className="text-black">{formattedTotal}</strong> in cash directly to the delivery personnel upon parcel arrival.
              </p>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-700 font-mono text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Verification CTA: VERIFY ORDER */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black hover:bg-neutral-900 disabled:bg-neutral-400 text-white font-mono text-xs uppercase tracking-widest py-4 font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2 rounded-none shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>VERIFYING ORDER...</span>
              </>
            ) : (
              <span>VERIFY ORDER</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
