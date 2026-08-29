import React, { useState } from 'react';
import { ShieldCheck, Check } from 'lucide-react';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setEmail('');
    }
  };

  return (
    <section id="newsletter" className="py-14 px-4 max-w-lg mx-auto text-center border-t border-neutral-200 my-8">
      {/* Title */}
      <h2 className="font-display text-3xl sm:text-4xl font-black text-black uppercase tracking-tight mb-3">
        GET 5% OFF
      </h2>

      {/* Description */}
      <p className="font-mono text-[10px] sm:text-[11px] text-neutral-600 uppercase tracking-widest leading-relaxed mb-6 px-2">
        JOIN THE ARCHIVES. GET AN EXCLUSIVE DISCOUNT CODE FOR YOUR FIRST PURCHASE AND SECURE ACCESS TO FUTURE DROPS BEFORE THEY EXHAUST.
      </p>

      {/* Subscription Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="w-full px-4 py-3 text-xs font-mono bg-white border border-neutral-300 rounded-lg text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors text-center"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase tracking-widest py-3.5 rounded-full transition-all duration-200 active:scale-[0.99]"
        >
          {submitted ? 'CODE DISPATCHED TO EMAIL!' : 'Subscribe'}
        </button>
      </form>

      {/* Protected by Firewall Footer Note */}
      <div className="mt-4 flex items-center justify-center gap-1 text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
        <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
        <span>PROTECTED BY NANGSAL WAF FIREWALL</span>
      </div>
    </section>
  );
};
