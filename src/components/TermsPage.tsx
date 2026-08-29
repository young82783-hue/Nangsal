import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface TermsPageProps {
  onNavigateHome?: () => void;
  onNavigateBack?: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigateHome, onNavigateBack }) => {
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
            LEGAL // 01
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-100 text-neutral-800 text-[10px] font-ibm-mono uppercase tracking-widest mb-3">
            <ShieldCheck className="w-3 h-3" />
            <span>Official Policy</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-neutral-950">
            TERMS &amp; CONDITIONS
          </h1>
        </div>

        {/* Introduction */}
        <div className="p-4 sm:p-5 bg-neutral-50 border border-neutral-200 mb-10 text-neutral-800 font-sans text-sm sm:text-base leading-relaxed">
          By using the NANGSAL website or placing an order, you agree to these terms.
        </div>

        {/* Terms Sections */}
        <div className="space-y-8 sm:space-y-10 text-neutral-800">
          {/* Section: PRODUCTS */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              PRODUCTS
            </h2>
            <p className="font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              All products are subject to availability. Product colors may appear slightly different depending on the customer&apos;s screen.
            </p>
          </section>

          {/* Section: ORDERS */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              ORDERS
            </h2>
            <p className="font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              Customers are responsible for providing accurate information when placing an order. NANGSAL reserves the right to cancel an order if there is a stock issue, incorrect information, or suspected fraudulent activity.
            </p>
          </section>

          {/* Section: PRICING */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              PRICING
            </h2>
            <p className="font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              Product prices displayed on the website may change without prior notice.
            </p>
          </section>

          {/* Section: PAYMENT */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              PAYMENT
            </h2>
            <p className="font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              Customers are responsible for completing the required payment and providing accurate payment information.
            </p>
          </section>

          {/* Section: DELIVERY */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              DELIVERY
            </h2>
            <p className="font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              Delivery times may vary depending on location, courier services, weather, holidays, and other circumstances outside NANGSAL&apos;s control.
            </p>
          </section>

          {/* Section: PRODUCT AVAILABILITY */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              PRODUCT AVAILABILITY
            </h2>
            <p className="font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              Products may sell out and restocking is not guaranteed unless announced by NANGSAL.
            </p>
          </section>

          {/* Section: CHANGES */}
          <section className="border-t border-neutral-100 pt-6">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black mb-2">
              CHANGES
            </h2>
            <p className="font-sans text-sm sm:text-[15px] text-neutral-700 leading-relaxed">
              NANGSAL may update these terms when necessary. Updated terms will be displayed on this page.
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
