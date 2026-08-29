import React, { useMemo } from 'react';
import { SiteBannerContent, getCacheBustedUrl, extractContentVersion } from '../lib/siteContent';

interface HeroSectionProps {
  banner?: SiteBannerContent | null;
}

const DEFAULT_HERO_VIDEO = 'https://cdn.phototourl.com/member/2026-08-21-ad775558-8cf9-4171-859b-513364f33166.mp4';

export const HeroSection: React.FC<HeroSectionProps> = ({ banner }) => {
  const rawVideoUrl = banner?.heroVideoUrl?.trim() || DEFAULT_HERO_VIDEO;

  // Compute cache-busting version token based on the latest Firestore update timestamp
  const version = useMemo(() => extractContentVersion(banner), [banner]);
  const videoUrl = useMemo(
    () => (rawVideoUrl ? getCacheBustedUrl(rawVideoUrl, version) : DEFAULT_HERO_VIDEO),
    [rawVideoUrl, version]
  );

  return (
    <section id="hero-section" className="relative w-full overflow-hidden bg-black text-white">
      {/* Full Hero Banner Video */}
      <div className="relative w-full min-h-[50vh] sm:min-h-[75vh] md:min-h-[88vh] bg-black flex items-center justify-center">
        <video
          key={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center block min-h-[50vh] sm:min-h-[75vh] md:min-h-[88vh]"
          src={videoUrl}
        />
      </div>
    </section>
  );
};

