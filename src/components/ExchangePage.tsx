import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface ExchangePageProps {
  onNavigateHome?: () => void;
  onNavigateBack?: () => void;
}

export const ExchangePage: React.FC<ExchangePageProps> = ({ onNavigateHome, onNavigateBack }) => {
  const handleBack = onNavigateBack || onNavigateHome || (() => window.history.back());
  return (
    <div className="w-full bg-white text-black min-h-[70vh] py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb / Back button */}
        <div className="mb-8 flex items-center justify-between border-b border-neutral-100 pb-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 font-ibm-mono text-xs uppercase tracking-wider text-neutral-500 hover:text-black transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          <span className="font-ibm-mono text-[11px] text-neutral-400 uppercase tracking-widest">
            POLICY // 03
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-100 text-neutral-800 text-[10px] font-ibm-mono uppercase tracking-widest mb-3">
            <RefreshCw className="w-3 h-3" />
            <span>Exchange Protocol</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-neutral-950">
            EXCHANGE POLICY
          </h1>
        </div>

        {/* Introduction */}
        <div className="p-4 sm:p-5 bg-neutral-50 border border-neutral-200 mb-10 text-neutral-900 font-sans text-sm sm:text-base font-medium leading-relaxed">
          NANGSAL offers exchanges only. We do not accept returns.
        </div>

        {/* Exchange Policy Sections */}
        <div className="space-y-8 sm:space-y-10 text-neutral-800">
          {/* Section: ELIGIBILITY */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              ELIGIBILITY
            </h2>
            <div className="space-y-3 font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              <p>
                If you receive an incorrect, damaged, or defective item, contact NANGSAL as soon as possible after delivery with your order details and clear photos of the issue.
              </p>
              <p>
                Items must be unused, unwashed, and in their original condition to be considered for an exchange.
              </p>
            </div>
          </section>

          {/* Section: APPROVAL */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              APPROVAL
            </h2>
            <p className="font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              All exchange requests must be approved by NANGSAL before the item is sent back. Do not send an item back without receiving instructions first.
            </p>
          </section>

          {/* Section: NON-ELIGIBLE ITEMS */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              NON-ELIGIBLE ITEMS
            </h2>
            <p className="font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              Items that have been worn, washed, damaged after delivery, altered, or otherwise used may not qualify for an exchange.
            </p>
          </section>

          {/* Section: SALE OR LIMITED ITEMS */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              SALE OR LIMITED ITEMS
            </h2>
            <p className="font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              Certain sale or limited-release products may have different exchange conditions.
            </p>
          </section>

          {/* Contact note */}
          <section className="border-t border-neutral-100 pt-6">
            <p className="font-sans text-sm sm:text-[15px] text-neutral-900 font-medium leading-relaxed">
              For any exchange request, contact NANGSAL with your order details and explain the issue.
            </p>
          </section>
        </div>

        {/* Footer return link */}
        <div className="mt-14 pt-8 border-t border-neutral-200 flex justify-center">
          <button
            onClick={onNavigateHome}
            className="px-6 py-3 bg-black text-white font-ibm-mono text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
          >
            Return to Store
          </button>
        </div>
      </div>
    </div>
  );
};
