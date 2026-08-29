import React from 'react';
import { ArrowLeft, Lock } from 'lucide-react';

interface PrivacyPageProps {
  onNavigateHome?: () => void;
  onNavigateBack?: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigateHome, onNavigateBack }) => {
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
            LEGAL // 02
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-100 text-neutral-800 text-[10px] font-ibm-mono uppercase tracking-widest mb-3">
            <Lock className="w-3 h-3" />
            <span>Data Protection</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-neutral-950">
            PRIVACY POLICY
          </h1>
        </div>

        {/* Introduction */}
        <div className="p-4 sm:p-5 bg-neutral-50 border border-neutral-200 mb-10 text-neutral-800 font-sans text-sm sm:text-base leading-relaxed">
          NANGSAL respects your privacy.
        </div>

        {/* Privacy Policy Statements */}
        <div className="space-y-6 sm:space-y-8 text-neutral-800 font-sans text-sm sm:text-[15px] leading-relaxed">
          <p className="text-neutral-700">
            When you place an order, we may collect information such as your name, contact information, delivery address, and order details.
          </p>

          <p className="text-neutral-700">
            This information is used to process orders, arrange delivery, communicate with customers, provide customer support, improve our services, and maintain website security.
          </p>

          <p className="text-neutral-700">
            NANGSAL does not intentionally collect unnecessary personal information.
          </p>

          <p className="text-neutral-700">
            We take reasonable steps to protect customer information, although no online system can guarantee complete security.
          </p>

          <div className="pt-4 border-t border-neutral-100 font-medium text-neutral-900">
            By using the NANGSAL website, you acknowledge this Privacy Policy.
          </div>
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
