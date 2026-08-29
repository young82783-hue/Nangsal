import React from 'react';
import { ArrowLeft, Instagram, ShieldCheck } from 'lucide-react';
import { WhatsAppIcon, TikTokIcon } from './SocialIcons';

interface ContactPageProps {
  onNavigateBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateBack }) => {
  return (
    <div className="w-full bg-white text-black min-h-[70vh] py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb / Back button */}
        <div className="mb-8 flex items-center justify-between border-b border-neutral-100 pb-4">
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-2 font-ibm-mono text-xs uppercase tracking-wider text-neutral-500 hover:text-black transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          <span className="font-ibm-mono text-[11px] text-neutral-400 uppercase tracking-widest">
            HELP // 04
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-100 text-neutral-800 text-[10px] font-ibm-mono uppercase tracking-widest mb-3">
            <ShieldCheck className="w-3 h-3" />
            <span>Concierge Desk</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-neutral-950">
            CONTACT US
          </h1>
        </div>

        {/* Introduction */}
        <div className="p-4 sm:p-5 bg-neutral-50 border border-neutral-200 mb-10 text-neutral-800 font-sans text-sm sm:text-base leading-relaxed">
          Direct concierge channels for sizing advice, order assistance, and shipment tracking.
        </div>

        {/* Channels Grid / List */}
        <div className="space-y-4 font-mono text-xs sm:text-sm">
          {/* WhatsApp */}
          <a
            href="https://wa.me/9779847459808"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200/80 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <WhatsAppIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-black uppercase">WhatsApp Direct Concierge</div>
                <div className="text-xs text-emerald-800 font-semibold uppercase mt-0.5">+977 984-7459808</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider hidden sm:inline-block">
              Open Chat →
            </span>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/by_nangsal?igsh=aWpldjB4anIwd3gz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200/70 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-black text-white">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-black uppercase">Instagram Direct Message</div>
                <div className="text-xs text-neutral-500 uppercase mt-0.5">@by_nangsal</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider hidden sm:inline-block">
              View Profile →
            </span>
          </a>

          {/* TikTok */}
          <a
            href="https://www.tiktok.com/@nangsal_apparel?_r=1&_t=ZS-994Uz0eclJl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200/70 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-black text-white">
                <TikTokIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-black uppercase">TikTok Official</div>
                <div className="text-xs text-neutral-500 uppercase mt-0.5">@nangsal_apparel</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider hidden sm:inline-block">
              View Channel →
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};
