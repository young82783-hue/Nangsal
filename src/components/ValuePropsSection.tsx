import React from 'react';
import { Truck } from 'lucide-react';

export const ValuePropsSection: React.FC = () => {
  return (
    <section id="value-props" className="py-12 px-4 max-w-2xl mx-auto">
      <div className="flex flex-col items-start gap-2.5">
        {/* Square Icon Badge */}
        <div className="bg-neutral-100 p-2.5 rounded-lg border border-neutral-200/60 flex items-center justify-center text-black">
          <Truck className="w-5 h-5 stroke-[1.8]" />
        </div>

        {/* Title */}
        <h4 className="font-display text-xs sm:text-sm font-black text-black uppercase tracking-wider">
          PATHAO LOGISTICS
        </h4>

        {/* Description */}
        <p className="font-ibm-mono text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-wide leading-relaxed">
          EXPEDITED NATIONWIDE &amp; REGIONAL TRANSIT PROTOCOLS VIA PATHAO COURIER WITH REAL-TIME TRACKING.
        </p>
      </div>
    </section>
  );
};
