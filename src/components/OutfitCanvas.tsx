import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  BookmarkPlus,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Layers,
  Loader2,
  Shuffle,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  OutfitSlots,
  SlotKey,
  TrendingDrop,
  VerdictResult,
  WardrobeItem,
} from '../types/wardrobe';
import { exportOutfitCanvasAsPng } from '../utils/exportOutfitPng';
import {
  SLOT_TO_CATEGORY,
  formatINR,
  isTrendingDrop,
} from '../utils/wardrobeLogic';
import { GarmentArtwork } from './GarmentArtwork';

interface OutfitCanvasProps {
  slots: OutfitSlots;
  activeFocusItem: WardrobeItem | TrendingDrop | null;
  unlockedOutfitsCount: number;
  activeDrop: TrendingDrop | null;
  activeDropVerdict: VerdictResult | null;
  purchasedDropIds: string[];
  onClearSlot: (slot: SlotKey) => void;
  onFocusSlot: (slot: SlotKey) => void;
  onShuffleCompatibleFit: () => void;
  onClearAllSlots: () => void;
  onSaveLook: (title: string, contextTag: string, notes: string) => void;
  onOpenVerdictModal: (drop: TrendingDrop) => void;
  onMarkPurchased: (drop: TrendingDrop) => void;
}

const SLOT_ORDER: { key: SlotKey; label: string; hint: string }[] = [
  { key: 'outerwear', label: 'Outerwear', hint: 'Jacket, overshirt, or shell' },
  { key: 'top', label: 'Top', hint: 'Tee, shirt, hoodie, or knit' },
  { key: 'bottom', label: 'Bottom', hint: 'Trousers, cargo, or denim' },
  { key: 'footwear', label: 'Footwear', hint: 'Sneakers, boots, or loafers' },
];

const CONTEXT_TAGS = [
  'College Daily',
  'Weekend Casual',
  'Evening Out',
  'Work Smart',
];

export const OutfitCanvas: React.FC<OutfitCanvasProps> = ({
  slots,
  activeFocusItem,
  unlockedOutfitsCount,
  activeDrop,
  activeDropVerdict,
  purchasedDropIds,
  onClearSlot,
  onFocusSlot,
  onShuffleCompatibleFit,
  onClearAllSlots,
  onSaveLook,
  onOpenVerdictModal,
  onMarkPurchased,
}) => {
  const [contextTag, setContextTag] = useState(CONTEXT_TAGS[0]);
  const [lookTitle, setLookTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [justExported, setJustExported] = useState(false);
  const [exportError, setExportError] = useState('');

  const exportBoardRef = useRef<HTMLDivElement | null>(null);

  const equippedCount = Object.values(slots).filter(Boolean).length;
  const activeDropAlreadyBought = activeDrop
    ? purchasedDropIds.includes(activeDrop.id)
    : false;

  const handleExportPng = async () => {
    if (equippedCount === 0 || isExporting || !exportBoardRef.current) return;

    setExportError('');
    setIsExporting(true);
    try {
      await exportOutfitCanvasAsPng(exportBoardRef.current, {
        lookTitle,
        contextTag,
      });
      setJustExported(true);
      window.setTimeout(() => setJustExported(false), 2400);
    } catch {
      setExportError(
        'Could not export outfit PNG. Try again or check custom image permissions.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (equippedCount === 0) return;

    const fallbackTitle =
      lookTitle.trim() ||
      `${contextTag} Fit (${equippedCount} pc)`;

    onSaveLook(fallbackTitle, contextTag, notes.trim());
    setLookTitle('');
    setNotes('');
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2200);
  };

  const verdictStyle = (kind: VerdictResult['kind']) => {
    switch (kind) {
      case 'strong-buy':
        return {
          container: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-100',
          title: 'text-emerald-300',
          action: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
        };
      case 'wait-budget':
        return {
          container: 'bg-amber-950/60 border-[#D4A853]/50 text-amber-100',
          title: 'text-[#E7C070]',
          action: 'bg-[#D4A853] hover:bg-[#DFB96E] text-slate-950',
        };
      case 'trap-buy':
      case 'skip-both':
        return {
          container: 'bg-rose-950/60 border-rose-500/45 text-rose-100',
          title: 'text-rose-300',
          action: 'bg-white hover:bg-slate-200 text-slate-950',
        };
      default:
        return {
          container: 'bg-slate-800/80 border-white/15 text-slate-100',
          title: 'text-[#D4A853]',
          action: 'bg-white hover:bg-slate-200 text-slate-950',
        };
    }
  };

  return (
    <main
      aria-label="Mix-and-Match Outfit Canvas"
      className="flex flex-col bg-[#151922] border border-white/10 rounded-xl overflow-hidden h-full"
    >
      {/* Canvas Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-bold text-white tracking-tight">
            Outfit Styling Canvas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span className="tabular-nums">{equippedCount} of 4 slots filled</span>
            {activeFocusItem && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  data-testid="unlocked-outfits-counter"
                  className="text-emerald-400 font-medium tabular-nums inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  Unlocks {unlockedOutfitsCount} outfit
                  {unlockedOutfitsCount === 1 ? '' : 's'} with your closet
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onShuffleCompatibleFit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#D4A853]" aria-hidden="true" />
            Auto-Style Fit
          </button>
          <button
            type="button"
            onClick={() => void handleExportPng()}
            disabled={equippedCount === 0 || isExporting}
            aria-label="Export outfit canvas as PNG"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0E1117] bg-[#D4A853] hover:bg-[#DFB96E] rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : justExported ? (
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {isExporting
              ? 'Exporting…'
              : justExported
              ? 'Exported PNG'
              : 'Export PNG'}
          </button>
          {equippedCount > 0 && (
            <button
              type="button"
              onClick={onClearAllSlots}
              aria-label="Clear all canvas slots"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {exportError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-rose-950/80 border border-rose-500/40 px-3 py-2 text-xs text-rose-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Active Trending Drop Verdict Banner */}
        {activeDrop && activeDropVerdict && (
          <section
            data-testid="active-verdict-banner"
            aria-label="Should I Buy verdict"
            className={`rounded-xl border p-4 transition-colors ${
              verdictStyle(activeDropVerdict.kind).container
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs opacity-85">
                  <span>Test-Driving Drop</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium">{activeDrop.storeName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums font-semibold">
                    {formatINR(activeDrop.priceInr)}
                  </span>
                </div>
                <h2
                  className={`font-display text-base font-bold mt-1 ${
                    verdictStyle(activeDropVerdict.kind).title
                  }`}
                >
                  {activeDropVerdict.headline} — {activeDrop.name}
                </h2>
                <p className="text-xs leading-relaxed opacity-90 mt-1">
                  {activeDropVerdict.summary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenVerdictModal(activeDrop)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    verdictStyle(activeDropVerdict.kind).action
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  Where to Find It
                </button>
                {!activeDropAlreadyBought && (
                  <button
                    type="button"
                    onClick={() => onMarkPurchased(activeDrop)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0E1117]/70 hover:bg-[#0E1117] text-white border border-white/20 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    Buy
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Exportable Lookbook Board */}
        <div
          ref={exportBoardRef}
          data-testid="outfit-export-board"
          className="rounded-xl bg-[#151922] p-3 border border-white/[0.06] space-y-3"
        >
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-display text-xs font-bold text-white shrink-0">
                Fit<span className="text-[#D4A853]">Check</span>
              </span>
              <span className="text-slate-600 text-xs" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-medium text-slate-300 truncate">
                {lookTitle.trim() || contextTag}
              </span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
              {equippedCount}/4 pieces
            </span>
          </div>

          {/* 4-Slot Visual Styling Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {SLOT_ORDER.map(({ key, label, hint }) => {
              const item = slots[key];
              const isDrop = isTrendingDrop(item);
              const isFocused = activeFocusItem?.id === item?.id && item !== null;

              return (
                <div
                  key={key}
                  data-testid={`canvas-slot-${key}`}
                  className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                    item
                      ? isDrop
                        ? 'bg-white text-slate-900 border-[#D4A853] ring-2 ring-[#D4A853]/50'
                        : isFocused
                        ? 'bg-white text-slate-900 border-emerald-500 ring-2 ring-emerald-500/40'
                        : 'bg-white text-slate-900 border-slate-200'
                      : 'bg-[#0E1117]/60 text-slate-300 border-dashed border-white/15'
                  }`}
                >
                  {/* Slot Label Header */}
                  <div
                    className={`px-3.5 py-2 flex items-center justify-between border-b ${
                      item
                        ? 'border-slate-100 bg-slate-50/70'
                        : 'border-white/[0.06] bg-white/[0.02]'
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold tracking-tight ${
                        item ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {label}
                    </span>

                    {item ? (
                      <div className="flex items-center gap-2">
                        {isDrop && (
                          <span className="text-[11px] font-semibold text-[#9A7222]">
                            Test Drive
                          </span>
                        )}
                        <button
                          type="button"
                          data-export-ignore="true"
                          onClick={() => onClearSlot(key)}
                          aria-label={`Clear ${label} slot`}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">Empty</span>
                    )}
                  </div>

                {/* Slot Content */}
                {item ? (
                  <div key={item.id} className="animate-slot-swap">
                    <button
                      type="button"
                      onClick={() => onFocusSlot(key)}
                      aria-label={`Inspect compatibility for ${item.name}`}
                      className="w-full p-3.5 flex items-center gap-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D4A853]"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-[#F4F3EF]">
                        <GarmentArtwork
                          silhouette={item.silhouette}
                          colorHex={item.colorHex}
                          name={item.name}
                          imageUrl={item.imageUrl}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {item.vibe} · {item.fit} Fit
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                          <span
                            className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: item.colorHex }}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.colorName}</span>
                          {isDrop && (
                            <span className="ml-auto font-mono tabular-nums font-semibold text-slate-900">
                              {formatINR(item.priceInr)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div
                    key={`empty-${key}`}
                    className="h-[108px] px-4 flex flex-col items-center justify-center text-center"
                  >
                    <Layers
                      className="w-5 h-5 text-slate-600 mb-1.5"
                      aria-hidden="true"
                    />
                    <p className="text-xs text-slate-400">
                      Select {SLOT_TO_CATEGORY[key]} from Closet or Drops
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>
                  </div>
                )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outfit Notes & Save Look Panel */}
        <form
          onSubmit={handleSave}
          className="bg-[#0E1117]/75 border border-white/10 rounded-xl p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-white">
              Save This Look
            </h3>
            <div
              role="group"
              aria-label="Outfit context tags"
              className="flex flex-wrap items-center gap-1.5"
            >
              {CONTEXT_TAGS.map((tag) => {
                const selected = contextTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setContextTag(tag)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      selected
                        ? 'bg-[#D4A853] text-slate-950 font-semibold'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="look-title-input" className="sr-only">
                Look name
              </label>
              <input
                id="look-title-input"
                type="text"
                placeholder="Look title (e.g., Rainy Campus Layer)"
                value={lookTitle}
                onChange={(e) => setLookTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#151922] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4A853]"
              />
            </div>
            <div>
              <label htmlFor="look-notes-input" className="sr-only">
                Styling notes
              </label>
              <input
                id="look-notes-input"
                type="text"
                placeholder="Notes (e.g., Cuff trousers once)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#151922] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4A853]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-400">
              {equippedCount === 0
                ? 'Place at least 1 piece on the canvas to save.'
                : `Tag: ${contextTag}`}
            </span>
            <button
              type="submit"
              disabled={equippedCount === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-slate-950 hover:bg-slate-200"
            >
              <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
              {justSaved ? 'Saved to Drawer' : 'Save Look'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
