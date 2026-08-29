import React from 'react';
import { Instagram } from 'lucide-react';
import { WhatsAppIcon, TikTokIcon } from './SocialIcons';

interface FooterProps {
  onOpenHelp?: () => void;
  onNavigateHome?: () => void;
  onNavigateTerms?: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateExchange?: () => void;
  onNavigateContact?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHelp,
  onNavigateHome,
  onNavigateTerms,
  onNavigatePrivacy,
  onNavigateExchange,
  onNavigateContact,
}) => {
  const handleContactClick = onNavigateContact || onOpenHelp;
  return (
    <footer id="footer" className="w-full bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-12 sm:pt-20 sm:pb-16">
        {/* Main Footer Row: Left (Logo) and Right (Links + Social Icons) */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 md:gap-12">
          {/* LEFT: Logo */}
          <div className="flex items-center justify-center md:justify-start flex-shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateHome) {
                  onNavigateHome();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="inline-block hover:opacity-85 transition-opacity"
              aria-label="Home"
            >
              <img
                src="https://i.ibb.co/Vp9pfzFp/IMG-20260728-WA0007.jpg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/src/assets/images/panchu_logo.jpg";
                }}
                alt="Brand Logo"
                className="h-16 sm:h-20 md:h-24 lg:h-28 max-w-[280px] sm:max-w-sm md:max-w-md w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </a>
          </div>

          {/* RIGHT: Footer Links & Social Media Icons */}
          <div className="flex flex-col items-center md:items-end gap-6 sm:gap-7">
            {/* Footer Navigation Links */}
            <nav className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 sm:gap-x-8 gap-y-3 font-mono text-[11px] sm:text-xs uppercase tracking-wider text-neutral-600">
              <button
                onClick={onNavigateTerms}
                className="hover:text-black transition-colors cursor-pointer"
              >
                Terms &amp; Conditions
              </button>

              <button
                onClick={onNavigatePrivacy}
                className="hover:text-black transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>

              <button
                onClick={onNavigateExchange}
                className="hover:text-black transition-colors cursor-pointer"
              >
                Exchange Policy
              </button>

              <button
                onClick={handleContactClick}
                className="hover:text-black transition-colors cursor-pointer"
              >
                Contact
              </button>
            </nav>

            {/* Social Media Icons Only */}
            <div className="flex items-center justify-center md:justify-end gap-4 text-neutral-700">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/by_nangsal?igsi=aWpldjB4anIwd3gz"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2.5 rounded-full hover:bg-neutral-100 hover:text-black text-neutral-600 transition-colors"
              >
                <Instagram className="w-4 h-4 stroke-[1.8]" />
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@nangsal_apparel?_r=1&_t=ZS-994Uz0eclJl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="p-2.5 rounded-full hover:bg-neutral-100 hover:text-black text-neutral-600 transition-colors"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/9779847459808"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="p-2.5 rounded-full hover:bg-neutral-100 hover:text-black text-neutral-600 transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Subtle Divider & Copyright Line */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-neutral-100 flex items-center justify-center">
          <p className="font-mono text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-widest text-center">
            © 2026 NANGSAL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};
