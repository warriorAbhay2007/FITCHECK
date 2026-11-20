import React, { useState } from 'react';
import {
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  FolderHeart,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BodyTypeId,
  FitPreference,
  OutfitSlots,
  SkinToneId,
  Undertone,
  WardrobeProfile,
  WardrobeSize,
} from '../types/wardrobe';
import {
  BODY_TYPE_OPTIONS,
  ColorHarmonyResult,
  SKIN_TONE_OPTIONS,
  getBrandSizingNotes,
} from '../utils/wardrobeStyling';

interface StylingDrawerPanelProps {
  profile: WardrobeProfile;
  slots: OutfitSlots;
  harmony: ColorHarmonyResult;
  savedCount: number;
  onUpdateProfile: (patch: Partial<WardrobeProfile>) => void;
  onToggleOuterLayerVisibility: () => void;
  hasSuspendedOuterLayer: boolean;
  onSaveLook: () => void;
  onOpenSavedLooks: () => void;
  onOpenAiStylist: () => void;
}

const UNDERTONES: Undertone[] = ['Warm', 'Cool', 'Neutral'];
const SIZES: WardrobeSize[] = ['S', 'M', 'L', 'XL'];
const FIT_PREFERENCES: FitPreference[] = [
  'Slim',
  'Regular',
  'Relaxed/Oversized',
];

export const StylingDrawerPanel: React.FC<StylingDrawerPanelProps> = ({
  profile,
  slots,
  harmony,
  savedCount,
  onUpdateProfile,
  onToggleOuterLayerVisibility,
  hasSuspendedOuterLayer,
  onSaveLook,
  onOpenSavedLooks,
  onOpenAiStylist,
}) => {
  const [showAllBrands, setShowAllBrands] = useState(true);
  const brandNotes = getBrandSizingNotes(
    profile.size,
    profile.fitPreference,
    slots,
  );
  const visibleBrands = showAllBrands ? brandNotes : brandNotes.slice(0, 3);
  const equippedCount = Object.values(slots).filter(Boolean).length;

  const harmonyBarColor =
    harmony.score >= 82
      ? 'bg-[#e0b973]'
      : harmony.score >= 65
        ? 'bg-emerald-400'
        : 'bg-amber-400';

  return (
    <aside
      aria-label="Fit, Size and Skin-Tone Panel"
      className="h-full flex flex-col rounded-2xl bg-[#221b16]/85 backdrop-blur-md border border-[#f5efe6]/12 shadow-[0_18px_45px_rgba(0,0,0,0.48)] overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-[#f5efe6]/10 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#f5efe6] leading-none">
            Fit &amp; Skin Tone
          </h2>
          <p className="text-[11px] text-[#baa995] mt-1">
            Color harmony &amp; Indian retail fit
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAiStylist}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181512]/80 hover:bg-[#312821] border border-[#e0b973]/30 text-[11px] font-medium text-[#e0b973] transition-colors cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>AI Stylist</span>
        </button>
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
        {/* 1. Skin Tone & Undertone Selector + Color Harmony Meter */}
        <section aria-label="Skin Tone and Color Harmony">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e0b973] whitespace-nowrap">
              Skin Harmony
            </h3>
            <span
              data-testid="color-harmony-score"
              className="font-mono text-xs font-semibold text-[#f5efe6] tabular-nums whitespace-nowrap"
            >
              {harmony.score}% · {harmony.ratingLabel}
            </span>
          </div>

          <div
            role="group"
            aria-label="Select skin tone"
            className="grid grid-cols-3 gap-1.5"
          >
            {SKIN_TONE_OPTIONS.map((tone) => {
              const selected = profile.skinTone === tone.id;
              return (
                <button
                  key={tone.id}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Skin tone ${tone.label}`}
                  onClick={() =>
                    onUpdateProfile({ skinTone: tone.id as SkinToneId })
                  }
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#31261e] border-[#e0b973]'
                      : 'bg-[#181512]/60 border-transparent hover:border-[#f5efe6]/20'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/25 shadow-inner shrink-0"
                    style={{ backgroundColor: tone.swatchHex }}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-medium text-[#e6dccf] whitespace-nowrap">
                    {tone.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Undertone Selector */}
          <div
            role="group"
            aria-label="Select skin undertone"
            className="mt-2.5 grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#181512]/90 border border-[#f5efe6]/10"
          >
            {UNDERTONES.map((ut) => {
              const active = profile.undertone === ut;
              return (
                <button
                  key={ut}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onUpdateProfile({ undertone: ut })}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#e0b973] text-[#181512] font-semibold'
                      : 'text-[#cabda9] hover:text-[#f5efe6]'
                  }`}
                >
                  {ut}
                </button>
              );
            })}
          </div>

          {/* Color Harmony Progress & Tip */}
          <div className="mt-3 p-3 rounded-xl bg-[#181512]/75 border border-[#f5efe6]/10 space-y-2">
            <div className="h-1.5 w-full rounded-full bg-[#2d251e] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${harmonyBarColor}`}
                style={{ width: `${harmony.score}%` }}
              />
            </div>
            <p className="text-xs text-[#f5efe6] leading-relaxed">
              {harmony.tip}
            </p>
            {harmony.colorBlockingNote && (
              <p className="text-[11px] text-[#e0b973] leading-relaxed">
                {harmony.colorBlockingNote}
              </p>
            )}
            <p className="text-[11px] text-[#baa995] leading-relaxed">
              {harmony.lightingNote}
            </p>
          </div>
        </section>

        {(slots.outerwear || hasSuspendedOuterLayer) && (
          <>
            <div className="h-px bg-[#f5efe6]/10" />
            <section aria-label="Outer Layer Quick Control">
              <button
                type="button"
                onClick={onToggleOuterLayerVisibility}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#181512]/80 hover:bg-[#2f2620] border border-[#f5efe6]/12 text-[11px] font-medium text-[#e6dccf] transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-[#e0b973]" aria-hidden="true" />
                <span>
                  {slots.outerwear
                    ? `Hide Outer Layer (${slots.outerwear.name})`
                    : 'Restore Outer Layer Over Top'}
                </span>
              </button>
            </section>
          </>
        )}

        <div className="h-px bg-[#f5efe6]/10" />

        {/* 2. Size & Fit Profile + Indian Retail Brand Notes */}
        <section aria-label="Size, Fit Profile and Brand Sizing Notes">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e0b973]">
              Size &amp; Fit Profile
            </h3>
            <span className="text-[11px] text-[#baa995] truncate">
              Size {profile.size} · {profile.fitPreference}
            </span>
          </div>

          <div
            role="group"
            aria-label="Select clothing size"
            className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#181512]/90 border border-[#f5efe6]/10"
          >
            {SIZES.map((sz) => {
              const active = profile.size === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onUpdateProfile({ size: sz })}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#e0b973] text-[#181512]'
                      : 'text-[#cabda9] hover:text-[#f5efe6]'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label="Select fit preference"
            className="mt-2 grid grid-cols-[0.75fr_0.9fr_1.45fr] gap-1 p-1 rounded-xl bg-[#181512]/90 border border-[#f5efe6]/10"
          >
            {FIT_PREFERENCES.map((fit) => {
              const active = profile.fitPreference === fit;
              return (
                <button
                  key={fit}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onUpdateProfile({ fitPreference: fit })}
                  className={`py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#e0b973] text-[#181512] font-semibold'
                      : 'text-[#cabda9] hover:text-[#f5efe6]'
                  }`}
                >
                  {fit}
                </button>
              );
            })}
          </div>

          {/* Body-Type Selector */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-[#d4c8b8]">
                Body Type
              </span>
              <span className="text-[11px] text-[#e0b973]">
                {BODY_TYPE_OPTIONS.find((b) => b.id === profile.bodyType)?.label ?? 'Average'}
              </span>
            </div>
            <div
              role="group"
              aria-label="Select body type"
              className="flex flex-wrap gap-1.5"
            >
              {BODY_TYPE_OPTIONS.map((bt) => {
                const active = profile.bodyType === bt.id;
                return (
                  <button
                    key={bt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onUpdateProfile({ bodyType: bt.id as BodyTypeId })}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                      active
                        ? 'bg-[#e0b973] text-[#181512] border-[#e0b973] font-semibold'
                        : 'bg-[#181512]/75 text-[#cabda9] hover:text-[#f5efe6] border-[#f5efe6]/10'
                    }`}
                  >
                    {bt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Indian Retail Brand Sizing Notes */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#d4c8b8]">
                Indian Retail Sizing Tips
              </span>
              <button
                type="button"
                onClick={() => setShowAllBrands((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] text-[#e0b973] hover:text-[#f5efe6] cursor-pointer"
              >
                <span>{showAllBrands ? 'Compact' : 'Show all 6'}</span>
                {showAllBrands ? (
                  <ChevronUp className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3 h-3" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="divide-y divide-[#f5efe6]/[0.07] rounded-xl bg-[#181512]/75 border border-[#f5efe6]/10">
              {visibleBrands.map((note) => (
                <div key={note.brand} className="px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#f5efe6]">
                      {note.brand}
                    </span>
                    <span className="font-mono text-[11px] text-[#e0b973] tabular-nums">
                      Pick {note.recommendedSize}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#baa995] mt-0.5 leading-snug">
                    {note.fitAdvice}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Footer Actions: Save Outfit + Saved Looks */}
      <div className="p-3.5 border-t border-[#f5efe6]/10 bg-[#181512]/80 flex items-center gap-2">
        <button
          type="button"
          onClick={onSaveLook}
          disabled={equippedCount === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#e0b973] hover:bg-[#ebd09a] text-[#181512] font-semibold text-xs transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
        >
          <BookmarkPlus className="w-4 h-4" aria-hidden="true" />
          <span>Save Outfit</span>
        </button>

        <button
          type="button"
          onClick={onOpenSavedLooks}
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#261f1a] hover:bg-[#332a23] border border-[#f5efe6]/15 text-xs font-medium text-[#f5efe6] transition-colors cursor-pointer whitespace-nowrap tabular-nums"
        >
          <FolderHeart className="w-4 h-4 text-[#e0b973]" aria-hidden="true" />
          <span>Saved ({savedCount})</span>
        </button>
      </div>
    </aside>
  );
};
