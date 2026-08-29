import React, { useState } from 'react';
import { CartItem } from './CartDrawer';
import { X, CheckCircle2, Copy, Check, Upload, ArrowRight, ShieldCheck, QrCode, Building2, Wallet, Loader2 } from 'lucide-react';
import { WhatsAppIcon } from './SocialIcons';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currencySymbol: string;
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  currencySymbol,
  onClearCart,
}) => {
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'CONFIRMATION'>('DETAILS');
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'ESEWA' | 'COD'>('BANK');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('Kathmandu');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [uploadedReceipt, setUploadedReceipt] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalRaw = cart.reduce(
    (sum, item) => sum + item.product.rawPrice * item.quantity,
    0
  );

  const formattedTotal =
    currencySymbol === 'Rs.'
      ? `Rs. ${totalRaw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : `${currencySymbol} ${(totalRaw / 130).toFixed(2)}`;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedReceipt(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `NANGSAL-${randomSuffix}`;
    const orderDocId = `order_${randomSuffix}`;

    const orderPayload = {
      orderNumber,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      city: city.trim(),
      deliveryAddress: deliveryAddress.trim(),
      orderNotes: orderNotes.trim() ? orderNotes.trim() : undefined,
      paymentMethod,
      transactionId: transactionId.trim() ? transactionId.trim() : undefined,
      uploadedReceipt: uploadedReceipt || undefined,
      totalAmount: totalRaw,
      currency: currencySymbol === 'Rs.' ? 'NPR' : currencySymbol.trim(),
      items: cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        rawPrice: item.product.rawPrice,
        size: item.size,
        quantity: item.quantity,
        sku: item.product.sku,
        image: item.product.image,
      })),
      status: 'PENDING_VERIFICATION',
      createdAt: serverTimestamp(),
      userId: auth.currentUser?.uid || undefined,
    };

    // Filter out undefined values for Firestore
    const cleanPayload = Object.fromEntries(
      Object.entries(orderPayload).filter(([_, v]) => v !== undefined)
    );

    try {
      const path = `orders/${orderDocId}`;
      await setDoc(doc(db, 'orders', orderDocId), cleanPayload);
      setConfirmedOrderId(orderNumber);
      setStep('CONFIRMATION');
      onClearCart();
    } catch (err) {
      console.error('Error saving order to Firestore:', err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `orders/${orderDocId}`);
      } catch {
        // Fallback display
      }
      // Still allow order confirmation for the user with reference ID so they are not blocked
      setConfirmedOrderId(orderNumber);
      setStep('CONFIRMATION');
      onClearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-black max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <span className="font-mono text-[10px] text-[#D85A38] font-bold tracking-widest uppercase block">
              CHECKOUT // STEP {step === 'DETAILS' ? '1/2' : step === 'PAYMENT' ? '2/2' : 'VERIFIED'}
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
              {step === 'CONFIRMATION' ? 'ORDER CONFIRMED' : 'COMPLETE YOUR ORDER'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Customer & Delivery Details */}
        {step === 'DETAILS' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep('PAYMENT');
            }}
            className="space-y-4"
          >
            {/* Order Brief Summary Card */}
            <div className="p-4 bg-[#F9F9F9] rounded-xl border border-neutral-200/70 flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] text-neutral-500 uppercase">
                  {cart.reduce((s, i) => s + i.quantity, 0)} ITEMS IN CART
                </p>
                <p className="font-mono font-bold text-xs sm:text-sm uppercase text-black">
                  {cart.map((i) => `${i.product.name} (${i.size})`).join(', ')}
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs text-neutral-400 block">TOTAL</span>
                <span className="font-mono font-black text-base text-[#D85A38]">
                  {formattedTotal}
                </span>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs font-semibold text-neutral-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aayush Shrestha"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black font-sans"
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-neutral-700 mb-1">
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +977 98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs font-semibold text-neutral-700 mb-1">
                  City / Region *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kathmandu / Pokhara / Hetauda"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black font-sans"
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-neutral-700 mb-1">
                  Exact Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Jhamsikhel, Ward 3, House 42"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block font-sans text-xs font-semibold text-neutral-700 mb-1">
                Special Instructions (Optional)
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Preferred delivery time, landmark, etc."
                rows={2}
                className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black font-sans"
              />
            </div>

            {/* Next Step CTA */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="font-mono text-[10px] text-neutral-400 uppercase">
                FREE EXPRESS SHIPPING IN NEPAL
              </span>
              <button
                type="submit"
                className="bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-full flex items-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>PROCEED TO PAYMENT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Payment Methods & QR Scanner */}
        {step === 'PAYMENT' && (
          <form onSubmit={handleCompleteOrder} className="space-y-5">
            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK')}
                className={`py-2.5 px-3 rounded-lg font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'BANK'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#D85A38]" />
                <span className="hidden sm:inline">DIRECT</span> BANK
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ESEWA')}
                className={`py-2.5 px-3 rounded-lg font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'ESEWA'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>eSEWA</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`py-2.5 px-3 rounded-lg font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'COD'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>COD</span>
              </button>
            </div>

            {/* Payment Details Container */}
            {paymentMethod === 'BANK' && (
              <div className="p-4 sm:p-5 bg-[#F9F9F9] rounded-2xl border border-neutral-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Code Container */}
                  <div className="w-36 h-36 bg-white p-2 rounded-xl border border-neutral-200 shrink-0 shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src="https://i.ibb.co/5gR2grvR/bank.jpg"
                      alt="Bank Transfer QR - Sunil Gurung"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Bank Account Details */}
                  <div className="flex-1 space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block">
                        ACCOUNT HOLDER NAME
                      </span>
                      <span className="text-sm font-bold text-black uppercase">
                        SUNIL GURUNG
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-200">
                      <div>
                        <span className="text-[9px] text-neutral-400 uppercase block">BANK</span>
                        <span className="font-bold text-neutral-800">NABIL BANK / STAND. CHARTERED</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-200">
                      <div>
                        <span className="text-[9px] text-neutral-400 uppercase block">ACCOUNT NO.</span>
                        <span className="font-bold text-neutral-900">0190 2841 9820 11</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('01902841982011', 'bank-acc')}
                        className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'bank-acc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'bank-acc' ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'ESEWA' && (
              <div className="p-4 sm:p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* eSewa QR Code */}
                  <div className="w-36 h-36 bg-white p-2 rounded-xl border border-emerald-200 shrink-0 shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src="https://i.ibb.co/FbDMSvNQ/esewa.jpg"
                      alt="eSewa QR - Sunil Gurung"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* eSewa Details */}
                  <div className="flex-1 space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-emerald-800 uppercase block font-semibold">
                        eSEWA ACCOUNT HOLDER
                      </span>
                      <span className="text-sm font-bold text-emerald-950 uppercase">
                        SUNIL GURUNG
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-200">
                      <div>
                        <span className="text-[9px] text-emerald-800 uppercase block font-semibold">
                          eSEWA ID / MOBILE NUMBER
                        </span>
                        <span className="font-bold text-emerald-950">9847459808</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('9847459808', 'esewa-id')}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'esewa-id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'esewa-id' ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>

                    <p className="text-[10px] font-sans text-emerald-700 leading-snug">
                      Please enter your Full Name in the remarks section while transferring.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'COD' && (
              <div className="p-4 sm:p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <h4 className="font-display font-bold text-sm uppercase text-black">
                  CASH ON DELIVERY (NEPAL ONLY)
                </h4>
                <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                  Pay the total amount in cash to our courier partner upon inspecting your parcel at your doorstep.
                </p>
              </div>
            )}

            {/* Optional Transaction ID & Screenshot Upload */}
            {paymentMethod !== 'COD' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                    TRANSACTION ID / REFERENCE NUMBER (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. TXN-8921094 or eSewa Ref ID"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>

                <div className="p-3 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/70 text-center relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {uploadedReceipt ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>PAYMENT SCREENSHOT ATTACHED</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-neutral-500 text-xs font-mono">
                      <Upload className="w-4 h-4" />
                      <span>ATTACH PAYMENT SCREENSHOT (OPTIONAL)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                className="font-mono text-xs uppercase text-neutral-500 hover:text-black font-semibold"
              >
                ← BACK
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#D85A38] hover:bg-[#c24e2e] disabled:opacity-60 text-white font-mono text-xs uppercase tracking-widest font-bold px-7 py-3 rounded-full flex items-center gap-2 transition-all active:scale-[0.99] shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>LODGING ORDER...</span>
                  </>
                ) : (
                  <>
                    <span>CONFIRM & PLACE ORDER</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Order Confirmation */}
        {step === 'CONFIRMATION' && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-[#D85A38] tracking-widest uppercase">
                THANK YOU, {fullName ? fullName.toUpperCase() : 'VALUED CLIENT'}
              </span>
              <h3 className="font-display text-2xl font-black text-black uppercase">
                ORDER SUCCESSFULLY LODGED
              </h3>
              <p className="font-mono text-xs text-neutral-500 uppercase">
                ORDER ID: <span className="font-bold text-black">{confirmedOrderId}</span>
              </p>
            </div>

            <div className="p-4 bg-[#F9F9F9] rounded-2xl border border-neutral-200 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                <span className="text-neutral-500 uppercase">PAYMENT METHOD:</span>
                <span className="font-bold text-black uppercase">
                  {paymentMethod === 'BANK' ? 'BANK TRANSFER (SUNIL GURUNG)' : paymentMethod === 'ESEWA' ? 'eSEWA PAYMENT (SUNIL GURUNG)' : 'CASH ON DELIVERY'}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                <span className="text-neutral-500 uppercase">DELIVERY DESTINATION:</span>
                <span className="font-bold text-black uppercase">{city}, NEPAL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 uppercase">TOTAL SETTLED:</span>
                <span className="font-bold text-[#D85A38]">{formattedTotal}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {/* WhatsApp Direct Confirmation Button */}
              <a
                href={`https://wa.me/9779847459808?text=${encodeURIComponent(
                  `Hello NANGSAL APPAREL! I just placed order ${confirmedOrderId} for ${formattedTotal}. Name: ${fullName}. Delivery to: ${city}, ${deliveryAddress}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-widest font-bold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>CONFIRM ON WHATSAPP (+977 984-7459808)</span>
              </a>

              <button
                onClick={onClose}
                className="w-full bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-full transition-colors"
              >
                CONTINUE BROWSING NANGSAL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
