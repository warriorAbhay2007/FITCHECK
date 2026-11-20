import React, { useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Palette,
  ShoppingBag,
  X,
} from 'lucide-react';
import { TrendingDrop, VerdictResult, WardrobeItem } from '../types/wardrobe';
import {
  buildColorPaletteSuggestions,
  formatINR,
} from '../utils/wardrobeLogic';
import { GarmentArtwork } from './GarmentArtwork';

interface VerdictModalProps {
  drop: TrendingDrop | null;
  verdict: VerdictResult | null;
  wardrobe: WardrobeItem[];
  isPurchased: boolean;
  onClose: () => void;
  onTestDrop: (drop: TrendingDrop) => void;
  onMarkPurchased: (drop: TrendingDrop) => void;
}

export const VerdictModal: React.FC<VerdictModalProps> = ({
  drop,
  verdict,
  wardrobe,
  isPurchased,
  onClose,
  onTestDrop,
  onMarkPurchased,
}) => {
  useEffect(() => {
    if (!drop || !verdict) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drop, verdict, onClose]);

  const paletteAnalysis = useMemo(() => {
    if (!drop) return null;
    return buildColorPaletteSuggestions(drop, wardrobe, 4);
  }, [drop, wardrobe]);

  if (!drop || !verdict || !paletteAnalysis) return null;

  const tone = (() => {
    switch (verdict.kind) {
      case 'strong-buy':
        return {
          banner: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />,
          labelColor: 'text-emerald-700',
        };
      case 'wait-budget':
        return {
          banner: 'bg-amber-50 border-amber-200 text-amber-950',
          icon: <Clock className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />,
          labelColor: 'text-amber-700',
        };
      default:
        return {
          banner: 'bg-rose-50 border-rose-200 text-rose-950',
          icon: <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />,
          labelColor: 'text-rose-700',
        };
    }
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verdict-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Smart Advisor · Where to Find It
            </p>
            <h2
              id="verdict-modal-title"
              className="font-display text-lg font-bold text-slate-900"
            >
              {drop.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close verdict modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Product Summary */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-[#F4F3EF]">
              <GarmentArtwork
                silhouette={drop.silhouette}
                colorHex={drop.colorHex}
                name={drop.name}
                imageUrl={drop.imageUrl}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">
                {drop.brand} · {drop.category} · {drop.vibe}
              </p>
              <p className="font-mono tabular-nums text-xl font-bold text-slate-900 mt-1">
                {formatINR(drop.priceInr)}
                <span className="text-sm font-sans font-medium text-slate-500 ml-2">
                  at {drop.storeName}
                </span>
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {drop.fabricNote}
              </p>
            </div>
          </div>

          {/* Verdict Callout */}
          <div className={`rounded-xl border p-4 ${tone.banner}`}>
            <div className="flex items-start gap-3">
              {tone.icon}
              <div>
                <p className={`font-display text-base font-bold ${tone.labelColor}`}>
                  Verdict: {verdict.headline}
                </p>
                <p className="text-xs leading-relaxed mt-1">{verdict.summary}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-black/10 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[11px] opacity-75">Closet Match</p>
                <p className="font-mono tabular-nums text-sm font-bold">
                  {verdict.compatibilityScore}%
                </p>
              </div>
              <div>
                <p className="text-[11px] opacity-75">Outfits Unlocked</p>
                <p className="font-mono tabular-nums text-sm font-bold">
                  {verdict.unlockedOutfits}
                </p>
              </div>
              <div>
                <p className="text-[11px] opacity-75">Budget Impact</p>
                <p className="font-mono tabular-nums text-sm font-bold">
                  {verdict.fitsBudget
                    ? `${formatINR(verdict.budgetDelta)} left`
                    : `-${formatINR(Math.abs(verdict.budgetDelta))}`}
                </p>
              </div>
            </div>
          </div>

          {/* Color Palette Assistant */}
          <section
            aria-label="Color Palette Assistant"
            className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Palette
                  className="w-4 h-4 text-[#B5892E] shrink-0"
                  aria-hidden="true"
                />
                <h3 className="font-display text-sm font-bold text-slate-900 truncate">
                  Color Palette Assistant
                </h3>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 shrink-0">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                  style={{ backgroundColor: paletteAnalysis.dropColorHex }}
                  aria-hidden="true"
                />
                <span>{paletteAnalysis.dropColorName}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {paletteAnalysis.headline}
            </p>

            {paletteAnalysis.suggestions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {paletteAnalysis.suggestions.map((suggestion) => (
                  <div
                    key={suggestion.itemId}
                    data-testid="palette-suggestion-card"
                    className="flex items-start gap-2.5 rounded-lg bg-white border border-slate-200 p-2.5"
                  >
                    <span
                      className="w-7 h-7 rounded-lg border border-slate-300/80 shrink-0 mt-0.5 shadow-inner"
                      style={{ backgroundColor: suggestion.colorHex }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {suggestion.colorName}
                        </p>
                        <span
                          className={`text-[10px] font-semibold shrink-0 ${
                            suggestion.role === 'Complementary'
                              ? 'text-emerald-700'
                              : suggestion.role === 'Neutral Anchor'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                          }`}
                        >
                          {suggestion.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">
                        {suggestion.itemName} · {suggestion.category}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        {suggestion.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Styling Checklist */}
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 mb-2">
              Closet Styling Checklist
            </h3>
            <ul className="space-y-2">
              {verdict.checklist.map((entry, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 text-xs text-slate-700"
                >
                  {entry.met ? (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertTriangle
                      className="w-4 h-4 text-rose-500 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <span className={entry.met ? 'text-slate-700' : 'text-rose-800 font-medium'}>
                    {entry.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <a
            href={drop.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white border border-slate-300 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Visit {drop.storeName} Storefront
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onTestDrop(drop);
                onClose();
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
            >
              Test on Canvas
            </button>
            <button
              type="button"
              disabled={isPurchased}
              onClick={() => {
                onMarkPurchased(drop);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
              {isPurchased ? 'Already Purchased' : 'Mark Purchased'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
