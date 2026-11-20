import React, { useEffect, useState } from 'react';
import { DoorOpen, Sparkles } from 'lucide-react';

interface WardrobeDoorsOverlayProps {
  isOpen: boolean;
  onOpen: () => void;
}

export const WardrobeDoorsOverlay: React.FC<WardrobeDoorsOverlayProps> = ({
  isOpen,
  onOpen,
}) => {
  const [hasSettledOpen, setHasSettledOpen] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => {
        setHasSettledOpen(true);
      }, 1150);
      return () => window.clearTimeout(timer);
    }
    setHasSettledOpen(false);
    return undefined;
  }, [isOpen]);

  if (isOpen && hasSettledOpen) {
    return null;
  }

  return (
    <div
      data-testid="wardrobe-doors-overlay"
      data-door-state={isOpen ? 'opening' : 'closed'}
      aria-hidden={isOpen}
      className={`fixed inset-0 z-50 wardrobe-perspective overflow-hidden transition-opacity duration-500 ${
        isOpen ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      {/* Subtle dark backdrop while closed */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isOpen ? 'opacity-0' : 'opacity-100'
        } bg-black/30`}
      />

      {/* Double Wooden/Matte-Charcoal Wardrobe Doors */}
      <div className="relative w-full h-full flex">
        {/* Left Door */}
        <button
          type="button"
          onClick={onOpen}
          disabled={isOpen}
          aria-label="Open left wardrobe door to enter FitCheck AI closet"
          data-open={isOpen}
          className="wardrobe-door wardrobe-door-left wood-door-surface relative w-1/2 h-full border-r border-[#0b0907] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e0b973] cursor-pointer group overflow-hidden"
        >
          {/* Outer architectural frame molding */}
          <div className="absolute inset-4 sm:inset-8 border border-[#f5efe6]/[0.08] rounded-sm pointer-events-none" />
          <div className="hidden sm:block absolute inset-14 border border-[#e0b973]/[0.11] bg-black/10 pointer-events-none" />

          {/* Subtle warm brass seam highlight */}
          <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#e0b973]/30 to-transparent pointer-events-none" />

          {/* Sleek Vertical Matte-Black & Brushed-Brass Handle (Center-right edge, clearly visible) */}
          <div className="absolute right-3.5 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-[#e0b973]/70" />
            <div className="w-3 sm:w-3.5 h-44 sm:h-60 rounded-full bg-gradient-to-b from-[#ebd09a] via-[#9c793e] to-[#1e1813] shadow-[0_10px_28px_rgba(0,0,0,0.9)] border border-[#f5efe6]/25 group-hover:brightness-115 transition-all flex items-center justify-center">
              <div className="w-1 h-28 sm:h-40 rounded-full bg-[#14110e]/85" />
            </div>
            <div className="w-2 h-2 rounded-full bg-[#e0b973]/70" />
          </div>
        </button>

        {/* Right Door */}
        <button
          type="button"
          onClick={onOpen}
          disabled={isOpen}
          aria-label="Open right wardrobe door to enter FitCheck AI closet"
          data-open={isOpen}
          className="wardrobe-door wardrobe-door-right wood-door-surface relative w-1/2 h-full border-l border-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e0b973] cursor-pointer group overflow-hidden"
        >
          {/* Outer architectural frame molding */}
          <div className="absolute inset-4 sm:inset-8 border border-[#f5efe6]/[0.08] rounded-sm pointer-events-none" />
          <div className="hidden sm:block absolute inset-14 border border-[#e0b973]/[0.11] bg-black/10 pointer-events-none" />

          {/* Subtle warm brass seam highlight */}
          <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#e0b973]/30 to-transparent pointer-events-none" />

          {/* Sleek Vertical Matte-Black & Brushed-Brass Handle (Center-left edge, clearly visible) */}
          <div className="absolute left-3.5 sm:left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-[#e0b973]/70" />
            <div className="w-3 sm:w-3.5 h-44 sm:h-60 rounded-full bg-gradient-to-b from-[#ebd09a] via-[#9c793e] to-[#1e1813] shadow-[0_10px_28px_rgba(0,0,0,0.9)] border border-[#f5efe6]/25 group-hover:brightness-115 transition-all flex items-center justify-center">
              <div className="w-1 h-28 sm:h-40 rounded-full bg-[#14110e]/85" />
            </div>
            <div className="w-2 h-2 rounded-full bg-[#e0b973]/70" />
          </div>
        </button>
      </div>

      {/* Upper Branding Nameplate (Leaves the central handles completely unobstructed!) */}
      <div
        className={`absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pointer-events-none transition-all duration-300 ${
          isOpen ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="pointer-events-auto rounded-2xl bg-[#181512]/90 backdrop-blur-xl border border-[#e0b973]/35 px-6 py-4 text-center shadow-[0_18px_48px_rgba(0,0,0,0.75)]">
          <div className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.22em] uppercase text-[#e0b973]">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>Private Dressing Room</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#f5efe6] mt-1">
            FitCheck AI
          </h1>
          <p className="mt-1 text-xs text-[#d4c8b8] leading-relaxed">
            Interactive 3D wardrobe, live smart mirror lighting &amp; skin-tone color harmony.
          </p>
        </div>
      </div>

      {/* Lower Open Wardrobe Prompt & Skip Intro (Leaves center handles unobstructed!) */}
      <div
        className={`absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-5 flex flex-col items-center gap-2.5 pointer-events-none transition-all duration-300 ${
          isOpen ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <button
          type="button"
          onClick={onOpen}
          className="pointer-events-auto inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-[#e0b973] hover:bg-[#ebd09a] text-[#181512] font-semibold text-sm tracking-wide shadow-[0_12px_32px_rgba(0,0,0,0.65)] transition-all cursor-pointer whitespace-nowrap"
        >
          <DoorOpen className="w-4 h-4" aria-hidden="true" />
          <span>Open Wardrobe</span>
        </button>
        <span className="text-[11px] text-[#cbbca8] bg-[#181512]/75 px-3 py-1 rounded-full border border-[#f5efe6]/10">
          Click the doors or handles to step inside
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="pointer-events-auto px-4 py-1.5 rounded-lg bg-[#261f1a]/90 hover:bg-[#332a23] border border-[#f5efe6]/15 text-xs font-medium text-[#e8dfd2] backdrop-blur-md transition-colors cursor-pointer whitespace-nowrap"
        >
          Skip Intro
        </button>
      </div>
    </div>
  );
};
