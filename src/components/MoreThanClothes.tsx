import React, { useMemo } from 'react';
import { SiteBannerContent, getCacheBustedUrl, extractContentVersion } from '../lib/siteContent';

interface MoreThanClothesProps {
  banner?: SiteBannerContent | null;
}

export const MoreThanClothes: React.FC<MoreThanClothesProps> = ({ banner }) => {
  const heading = banner?.manifestoHeading !== undefined ? banner.manifestoHeading : 'MORE THAN\nCLOTHES';
  const brandTag = banner?.manifestoTagline !== undefined ? banner.manifestoTagline : 'NANGSAL APPAREL';

  const version = useMemo(() => extractContentVersion(banner), [banner]);
  const photoTopLeft = useMemo(
    () => (banner?.photoTopLeft ? getCacheBustedUrl(banner.photoTopLeft, version) : ''),
    [banner?.photoTopLeft, version]
  );
  const photoBottomLeft = useMemo(
    () => (banner?.photoBottomLeft ? getCacheBustedUrl(banner.photoBottomLeft, version) : ''),
    [banner?.photoBottomLeft, version]
  );
  const photoTopRight = useMemo(
    () => (banner?.photoTopRight ? getCacheBustedUrl(banner.photoTopRight, version) : ''),
    [banner?.photoTopRight, version]
  );
  const photoBottomRight = useMemo(
    () => (banner?.photoBottomRight ? getCacheBustedUrl(banner.photoBottomRight, version) : ''),
    [banner?.photoBottomRight, version]
  );

  return (
    <section id="manifesto" className="py-6 sm:py-10 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* White container card with subtle light-gray border and smooth rounded corners */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 border border-neutral-200/80 shadow-sm">
        {/* 3-Column side-by-side layout: Left 2 photos, Center Text block, Right 2 photos */}
        <div className="grid grid-cols-12 gap-2 sm:gap-4 lg:gap-8 items-center">
          
          {/* Left Column: Top-Left and Bottom-Left Portrait Photos */}
          <div className="col-span-3 sm:col-span-3 lg:col-span-3 flex flex-col gap-2 sm:gap-4">
            {/* Top-Left */}
            <div className="overflow-hidden rounded-xl sm:rounded-2xl aspect-[3/4] sm:aspect-[4/5] bg-neutral-100 border border-neutral-200/60 shadow-xs flex items-center justify-center">
              {photoTopLeft ? (
                <img
                  key={photoTopLeft}
                  src={photoTopLeft}
                  alt="Nangsal Lookbook Portrait Top Left"
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-neutral-100" />
              )}
            </div>

            {/* Bottom-Left */}
            <div className="overflow-hidden rounded-xl sm:rounded-2xl aspect-[3/4] sm:aspect-[4/5] bg-neutral-100 border border-neutral-200/60 shadow-xs flex items-center justify-center">
              {photoBottomLeft ? (
                <img
                  key={photoBottomLeft}
                  src={photoBottomLeft}
                  alt="Nangsal Lookbook Portrait Bottom Left"
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-neutral-100" />
              )}
            </div>
          </div>

          {/* Center Column: Heading + Centered Body Text + Sign-off */}
          <div className="col-span-6 sm:col-span-6 lg:col-span-6 flex flex-col items-center justify-center text-center px-1 sm:px-4 lg:px-6 py-2 sm:py-4 space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Main Orange Heading */}
            {heading && (
              <h2 className="font-display text-base sm:text-2xl md:text-3xl lg:text-4xl font-black text-[#D85A38] uppercase tracking-[1px] sm:tracking-[2px] leading-tight whitespace-pre-line">
                {heading}
              </h2>
            )}

            {/* Paragraph 1 */}
            <div className="font-sans text-[10px] sm:text-xs md:text-sm lg:text-base text-neutral-800 leading-snug sm:leading-relaxed font-normal space-y-0.5">
              <p>It's a mindset.</p>
              <p>A way of living.</p>
            </div>

            {/* Paragraph 2 */}
            <div className="font-sans text-[10px] sm:text-xs md:text-sm lg:text-base text-neutral-800 leading-snug sm:leading-relaxed font-normal space-y-0.5 max-w-[280px] sm:max-w-sm mx-auto">
              <p>We design for those</p>
              <p>who move different,</p>
              <p>think different,</p>
              <p>and dress to express</p>
              <p>what words can't.</p>
            </div>

            {/* Paragraph 3 */}
            <div className="font-sans text-[10px] sm:text-xs md:text-sm lg:text-base text-neutral-800 leading-snug sm:leading-relaxed font-normal space-y-0.5">
              <p>This is not just</p>
              <p>what you wear.</p>
            </div>

            {/* Bold Line */}
            <p className="font-sans font-bold text-[11px] sm:text-sm md:text-base text-black tracking-tight">
              This is who you are.
            </p>

            {/* Brand Sign-off */}
            {brandTag && (
              <div className="pt-1">
                <span className="font-mono text-[9px] sm:text-xs md:text-sm font-bold text-[#D85A38] tracking-[0.2em] sm:tracking-[0.25em] uppercase">
                  {brandTag}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Top-Right and Bottom-Right Portrait Photos */}
          <div className="col-span-3 sm:col-span-3 lg:col-span-3 flex flex-col gap-2 sm:gap-4">
            {/* Top-Right */}
            <div className="overflow-hidden rounded-xl sm:rounded-2xl aspect-[3/4] sm:aspect-[4/5] bg-neutral-100 border border-neutral-200/60 shadow-xs flex items-center justify-center">
              {photoTopRight ? (
                <img
                  key={photoTopRight}
                  src={photoTopRight}
                  alt="Nangsal Lookbook Portrait Top Right"
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-neutral-100" />
              )}
            </div>

            {/* Bottom-Right */}
            <div className="overflow-hidden rounded-xl sm:rounded-2xl aspect-[3/4] sm:aspect-[4/5] bg-neutral-100 border border-neutral-200/60 shadow-xs flex items-center justify-center">
              {photoBottomRight ? (
                <img
                  key={photoBottomRight}
                  src={photoBottomRight}
                  alt="Nangsal Lookbook Portrait Bottom Right"
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-neutral-100" />
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
