import React, { useMemo } from 'react';
import { SiteBannerContent, getCacheBustedUrl, extractContentVersion } from '../lib/siteContent';

interface LuxuryStreetwearBannerProps {
  banner?: SiteBannerContent | null;
}

const DEFAULT_LUXURY_VIDEO = 'https://cdn.phototourl.com/member/2026-08-21-ad775558-8cf9-4171-859b-513364f33166.mp4';

export const LuxuryStreetwearBanner: React.FC<LuxuryStreetwearBannerProps> = ({ banner }) => {
  const rawVideoUrl = banner?.luxuryVideoUrl?.trim() || DEFAULT_LUXURY_VIDEO;
  const heading = banner?.luxuryHeading !== undefined ? banner.luxuryHeading : 'WE ARE LUXURY\nSTREETWEAR';
  const tagline = banner?.luxuryTagline !== undefined ? banner.luxuryTagline : 'Every product from NANGSAL APPAREL is made with care.';
  const paragraph1 = banner?.luxuryParagraph1 !== undefined ? banner.luxuryParagraph1 : 'We are not traditional luxury and we are not traditional streetwear.';
  const paragraph2 = banner?.luxuryParagraph2 !== undefined ? banner.luxuryParagraph2 : 'We are a fusion of both and we bring together a contrast of styles, materials and colours that celebrate your uniqueness.';
  const badge = banner?.luxuryBadge !== undefined ? banner.luxuryBadge : 'MADE IN NEPAL';

  const version = useMemo(() => extractContentVersion(banner), [banner]);
  const videoUrl = useMemo(
    () => (rawVideoUrl ? getCacheBustedUrl(rawVideoUrl, version) : DEFAULT_LUXURY_VIDEO),
    [rawVideoUrl, version]
  );

  return (
    <section id="luxury-streetwear" className="relative w-full bg-black text-white min-h-[50vh] sm:min-h-[65vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden my-8 sm:my-14">
      {/* Background Video exclusively */}
      <video
        key={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        src={videoUrl}
      />

      {/* Dark semi-transparent overlay filter */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-none" />

      {/* Center-aligned Content Hierarchy */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center space-y-4 sm:space-y-6">
        {/* Main Heading */}
        {heading && (
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#D85A38] uppercase tracking-[2px] leading-tight drop-shadow-md whitespace-pre-line">
            {heading}
          </h2>
        )}

        {/* Tagline */}
        {tagline && (
          <p className="font-mono text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-widest">
            {tagline}
          </p>
        )}

        {/* Sub-manifesto */}
        <div className="font-sans text-sm sm:text-base text-white/90 max-w-xl mx-auto space-y-2 leading-relaxed font-normal">
          {paragraph1 && <p>{paragraph1}</p>}
          {paragraph2 && <p>{paragraph2}</p>}
        </div>

        {/* Bottom Accent Badge */}
        {badge && (
          <div className="pt-4">
            <span className="inline-block font-mono text-xs sm:text-sm font-extrabold text-[#D85A38] tracking-[0.25em] uppercase border-b-2 border-[#D85A38] pb-1">
              {badge}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
