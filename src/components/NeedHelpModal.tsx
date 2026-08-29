import React, { useState } from 'react';
import { X, Instagram, ShieldCheck, CreditCard, QrCode } from 'lucide-react';
import { WhatsAppIcon, TikTokIcon } from './SocialIcons';

interface NeedHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NeedHelpModal: React.FC<NeedHelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'CONTACT' | 'PAYMENT'>('CONTACT');
  const [selectedPaymentImg, setSelectedPaymentImg] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5 text-black max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h2 className="font-display text-base sm:text-lg font-black uppercase tracking-wider">
            NANGSAL DESK // ASSISTANCE
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('CONTACT')}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'CONTACT'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-black'
            }`}
          >
            DIRECT CONTACT
          </button>
          <button
            onClick={() => setActiveTab('PAYMENT')}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'PAYMENT'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-black'
            }`}
          >
            PAYMENT METHODS
          </button>
        </div>

        {activeTab === 'CONTACT' ? (
          <div className="space-y-4">
            <p className="font-mono text-xs text-neutral-600 uppercase leading-relaxed font-semibold">
              DIRECT CONCIERGE CHANNELS FOR SIZING ADVICE, ORDER ASSISTANCE, AND SHIPMENT TRACKING.
            </p>

            {/* Channels List */}
            <div className="space-y-3 font-mono text-xs">
              <a
                href="https://wa.me/9779847459808"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200/80 transition-colors"
              >
                <div className="p-2 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <WhatsAppIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-black uppercase">WHATSAPP DIRECT CONCIERGE</div>
                  <div className="text-[11px] text-emerald-800 font-semibold uppercase">+977 984-7459808</div>
                </div>
              </a>

              <a
                href="https://www.instagram.com/by_nangsal?igsh=aWpldjB4anIwd3gz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200/70 transition-colors"
              >
                <div className="p-2 rounded-lg bg-black text-white">
                  <span className="font-mono text-xs font-bold">IG</span>
                </div>
                <div>
                  <div className="font-bold text-black uppercase">INSTAGRAM DIRECT MESSAGE</div>
                  <div className="text-[10px] text-neutral-500 uppercase">@by_nangsal</div>
                </div>
              </a>

              <a
                href="https://www.tiktok.com/@nangsal_apparel?_r=1&_t=ZS-994Uz0eclJl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200/70 transition-colors"
              >
                <div className="p-2 rounded-lg bg-black text-white">
                  <TikTokIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-black uppercase">TIKTOK OFFICIAL</div>
                  <div className="text-[10px] text-neutral-500 uppercase">@nangsal_apparel</div>
                </div>
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-mono text-xs text-neutral-600 uppercase leading-relaxed">
              SCAN OR PAY TO ACCOUNT NAME: <span className="font-bold text-black">SUNIL GURUNG</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Bank Transfer Box */}
              <div
                onClick={() => setSelectedPaymentImg('https://i.ibb.co/5gR2grvR/bank.jpg')}
                className="p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl cursor-pointer transition-all text-center space-y-2 group"
              >
                <div className="w-full aspect-square bg-white rounded-lg border border-neutral-200 flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src="https://i.ibb.co/5gR2grvR/bank.jpg"
                    alt="Bank Payment Details"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="font-mono text-[11px] font-bold uppercase text-black">
                  BANK TRANSFER
                </div>
                <div className="font-mono text-[9px] text-neutral-500 uppercase">
                  SUNIL GURUNG
                </div>
              </div>

              {/* Esewa QR Box */}
              <div
                onClick={() => setSelectedPaymentImg('https://i.ibb.co/FbDMSvNQ/esewa.jpg')}
                className="p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl cursor-pointer transition-all text-center space-y-2 group"
              >
                <div className="w-full aspect-square bg-white rounded-lg border border-neutral-200 flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src="https://i.ibb.co/FbDMSvNQ/esewa.jpg"
                    alt="Esewa Payment QR"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="font-mono text-[11px] font-bold uppercase text-emerald-700">
                  eSEWA PAYMENT
                </div>
                <div className="font-mono text-[9px] text-neutral-500 uppercase">
                  SUNIL GURUNG
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal preview for payment image if clicked */}
        {selectedPaymentImg && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="relative bg-white p-4 rounded-2xl max-w-sm w-full space-y-3">
              <button
                onClick={() => setSelectedPaymentImg(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-black"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black pt-2">
                PAYMENT DETAILS // SUNIL GURUNG
              </h3>
              <img
                src={selectedPaymentImg}
                alt="Payment QR"
                className="w-full h-auto rounded-lg border border-neutral-200"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setSelectedPaymentImg(null)}
                className="w-full bg-black text-white py-2 text-xs font-mono uppercase font-bold rounded-lg"
              >
                CLOSE PREVIEW
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase">
          <span>OPERATIONAL: 10:00 - 20:00 NPT</span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>NANGSAL VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
