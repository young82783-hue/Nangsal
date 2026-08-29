import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const StudioArchivesFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: 'SIZING',
      question: 'HOW DO NANGSAL APPAREL GARMENTS FIT?',
      answer: 'Our garments feature an intentional boxy, heavy unisex drop-shoulder fit. We recommend ordering your true size for an oversized streetwear silhouette, or sizing down for a closer fit.',
    },
    {
      category: 'SHIPPING',
      question: 'HOW LONG DOES SHIPPING TAKE?',
      answer: 'Domestic dispatches within Kathmandu and across Nepal take 2–4 business days via Pathao Logistics. International express transit is delivered in 5–7 business days.',
    },
    {
      category: 'RESTOCKS',
      question: 'WILL SOLD OUT ITEMS EVER BE RESTOCKED?',
      answer: 'All drops are strictly limited archive runs. Once a collection sells out, it enters permanent vault retirement and will never be reproduced.',
    },
    {
      category: 'MATERIALS',
      question: 'WHAT KIND OF MATERIALS DO YOU USE?',
      answer: 'We craft our garments with heavy 240GSM combed cotton, 450GSM French terry fleece, and raw 14oz indigo denim milled and finished locally in Nepal.',
    },
  ];

  return (
    <section id="archives" className="py-12 sm:py-16 px-4 max-w-2xl mx-auto border-t border-neutral-200">
      {/* Subheader */}
      <h3 className="font-display text-xs font-bold text-black uppercase tracking-widest mb-4">
        <span className="font-ibm-mono">01 //</span> FAQ ACCORDION SCHEMES
      </h3>

      {/* Accordion Schemes List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="bg-neutral-100 hover:bg-neutral-200/80 transition-colors rounded-xl p-4 cursor-pointer border border-neutral-200/50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[9px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded uppercase">
                    {faq.category}
                  </span>
                  <span className="font-sans text-xs sm:text-sm font-bold text-black uppercase tracking-tight">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-black shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-neutral-200/60 text-xs font-mono text-neutral-700 leading-relaxed uppercase">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
