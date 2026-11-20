import React, { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Camera,
  LampCeiling,
  LayoutGrid,
  Moon,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserCheck,
  X,
} from 'lucide-react';
import {
  BodyTypeId,
  FitPreference,
  GarmentTransform,
  MirrorLighting,
  OutfitSlots,
  SkinToneId,
  SlotKey,
  WardrobeItem,
} from '../types/wardrobe';
import { FitCheckEvaluation } from '../utils/fitCheckScore';
import {
  FINE_TUNE_OFFSET_MAX,
  FINE_TUNE_OFFSET_MIN,
  FINE_TUNE_SCALE_MAX,
  FINE_TUNE_SCALE_MIN,
  clampFineTuneTransform,
  getAnchorForSlot,
} from '../utils/mannequinAnchors';
import { BODY_TYPE_OPTIONS } from '../utils/wardrobeStyling';
import { GarmentArtwork } from './GarmentArtwork';
import { MannequinLookPreview } from './MannequinLookPreview';

interface SmartMirrorPanelProps {
  slots: OutfitSlots;
  lighting: MirrorLighting;
  skinTone: SkinToneId;
  fitPreference: FitPreference;
  bodyType: BodyTypeId;
  fitEvaluation: FitCheckEvaluation;
  mirrorRef?: React.RefObject<HTMLDivElement | null>;
  isExporting?: boolean;
  onChangeLighting: (lighting: MirrorLighting) => void;
  onChangeBodyType: (bodyType: BodyTypeId) => void;
  onClearSlot: (slot: SlotKey) => void;
  onClearAll: () => void;
  onShuffleFit: () => void;
  onExportPng: () => void;
  onApplySwap: (item: WardrobeItem) => void;
  onOpenMoodboard?: () => void;
  onUpdateGarmentTransform?: (itemId: string, transform: GarmentTransform) => void;
}

const LIGHTING_OPTIONS: {
  id: MirrorLighting;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'Daylight', label: 'Daylight', icon: Sun },
  { id: 'Warm Indoor', label: 'Warm Indoor', icon: LampCeiling },
  { id: 'Evening', label: 'Evening', icon: Moon },
];

const LIGHTING_OVERLAY_STYLES: Record<MirrorLighting, string> = {
  Daylight:
    'bg-gradient-to-b from-[#edf3f8]/[0.16] via-[#dce6f2]/[0.05] to-[#1d2228]/45',
  'Warm Indoor':
    'bg-gradient-to-b from-[#e0b973]/[0.20] via-[#b88644]/[0.06] to-[#1a1410]/55',
  Evening:
    'bg-gradient-to-b from-[#3f4662]/[0.20] via-[#1b1926]/[0.12] to-[#0f0c0a]/75',
};

const SLOT_LABELS: { key: SlotKey; label: string }[] = [
  { key: 'outerwear', label: 'Layer' },
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'footwear', label: 'Shoes' },
];

export const SmartMirrorPanel: React.FC<SmartMirrorPanelProps> = ({
  slots,
  lighting,
  skinTone,
  fitPreference,
  bodyType,
  fitEvaluation,
  mirrorRef,
  isExporting = false,
  onChangeLighting,
  onChangeBodyType,
  onClearSlot,
  onClearAll,
  onShuffleFit,
  onExportPng,
  onApplySwap,
  onOpenMoodboard,
  onUpdateGarmentTransform,
}) => {
  const [cordAnimating, setCordAnimating] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const [activeAlignSlot, setActiveAlignSlot] = useState<SlotKey>('top');

  const equippedCount = Object.values(slots).filter(Boolean).length;

  const photoSlots = SLOT_LABELS.filter(({ key }) => {
    const entry = slots[key];
    return Boolean(entry && 'imageUrl' in entry && entry.imageUrl);
  });

  useEffect(() => {
    if (photoSlots.length > 0 && !photoSlots.some((p) => p.key === activeAlignSlot)) {
      setActiveAlignSlot(photoSlots[0].key);
    }
    if (photoSlots.length === 0 && alignOpen) {
      setAlignOpen(false);
    }
  }, [photoSlots, activeAlignSlot, alignOpen]);

  const activePhotoItem = slots[activeAlignSlot] as WardrobeItem | null;
  const activeTransform = clampFineTuneTransform(activePhotoItem?.mirrorTransform);
  const activeAnchor = getAnchorForSlot(activeAlignSlot);
  const scalePctDelta = Math.round((activeTransform.scale - 1) * 100);

  const handlePullShuffle = () => {
    setCordAnimating(true);
    onShuffleFit();
    window.setTimeout(() => setCordAnimating(false), 340);
  };

  const badgeColors =
    fitEvaluation.badgeLabel === 'Sharp Fit'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
      : fitEvaluation.badgeLabel === 'Strong Base'
        ? 'bg-[#e0b973]/18 text-[#e0b973] border-[#e0b973]/40'
        : fitEvaluation.badgeLabel === 'Needs Tweaks'
          ? 'bg-amber-500/15 text-amber-300 border-amber-400/35'
          : 'bg-[#181512] text-[#baa995] border-[#f5efe6]/15';

  const meterColor =
    fitEvaluation.badgeLabel === 'Sharp Fit'
      ? 'bg-emerald-400'
      : fitEvaluation.badgeLabel === 'Strong Base'
        ? 'bg-[#e0b973]'
        : 'bg-amber-400';

  return (
    <section
      aria-label="Full-Length Smart Mirror"
      className="relative h-full flex flex-col rounded-2xl bg-[#261f1a]/90 border border-[#e0b973]/25 p-3.5 shadow-[0_18px_45px_rgba(0,0,0,0.48)] overflow-hidden"
    >
      {/* Left-Wing Brass Pull-Cord for Shuffle Fit */}
      <button
        type="button"
        onClick={handlePullShuffle}
        aria-label="Shuffle Fit"
        title="Pull cord to shuffle a coordinated outfit"
        className="group absolute top-0 right-3.5 z-20 flex flex-col items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b973] rounded-b-lg px-1 pb-1"
      >
        <span
          className={`flex flex-col items-center transition-transform ${
            cordAnimating ? 'animate-cord-tug' : 'group-hover:translate-y-1'
          }`}
        >
          <span className="w-0.5 h-4 bg-gradient-to-b from-[#e0b973] to-[#9b7b43]" />
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e0b973] group-hover:bg-[#ebd09a] text-[#181512] text-[10px] font-semibold shadow-[0_6px_16px_rgba(0,0,0,0.65)] whitespace-nowrap">
            <Shuffle className="w-3 h-3" aria-hidden="true" />
            <span>Shuffle Fit</span>
          </span>
        </span>
      </button>

      {/* Mirror Frame Header */}
      <div className="flex items-center justify-between gap-2 pb-2 pr-24 border-b border-[#f5efe6]/10 shrink-0">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#f5efe6] leading-none">
            Smart Mirror
          </h2>
          <p className="text-[11px] text-[#baa995] mt-1">
            Live Fit Check &amp; silhouette
          </p>
        </div>
      </div>

      {/* 1. Pinned Fit Check Score Badge (0–100%) + 3-Metric Breakdown */}
      <div
        data-testid="fit-check-score-badge"
        className="mt-2.5 rounded-xl bg-[#181512]/90 border border-[#e0b973]/25 p-2.5 shrink-0 space-y-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#baa995] font-medium">
              Fit Check Score
            </span>
            <span
              data-testid="fit-check-overall-score"
              className="font-mono text-lg font-bold text-[#f5efe6] tabular-nums leading-none"
            >
              {fitEvaluation.overallScore}%
            </span>
          </div>

          <span
            data-testid="fit-check-badge-label"
            className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap ${badgeColors}`}
          >
            {fitEvaluation.badgeLabel}
          </span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-[#2c241d] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${meterColor}`}
            style={{ width: `${fitEvaluation.overallScore}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-0.5">
          <div className="rounded-lg bg-[#221c17] px-2 py-1 flex items-center justify-between gap-1">
            <span className="text-[#baa995] truncate">Body Fit</span>
            <span className="font-mono font-semibold text-[#f5efe6] tabular-nums">
              {fitEvaluation.breakdown.bodyTypeFit}%
            </span>
          </div>
          <div className="rounded-lg bg-[#221c17] px-2 py-1 flex items-center justify-between gap-1">
            <span className="text-[#baa995] truncate">Color</span>
            <span className="font-mono font-semibold text-[#f5efe6] tabular-nums">
              {fitEvaluation.breakdown.colorHarmony}%
            </span>
          </div>
          <div className="rounded-lg bg-[#221c17] px-2 py-1 flex items-center justify-between gap-1">
            <span className="text-[#baa995] truncate">Co-Ord</span>
            <span className="font-mono font-semibold text-[#f5efe6] tabular-nums">
              {fitEvaluation.breakdown.outfitCoordination}%
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Mirror + Body-Type Verdict + Upgrades Area */}
      <div className="flex-1 overflow-y-auto mt-2.5 space-y-3 pr-0.5 min-h-0">
        {/* Lighting Mode Segmented Bar */}
        <div
          role="group"
          aria-label="Mirror ambient lighting"
          className="grid grid-cols-[1fr_1.3fr_1fr] gap-1 p-1 rounded-xl bg-[#181512]/90 border border-[#f5efe6]/10"
        >
          {LIGHTING_OPTIONS.map(({ id, label, icon: Icon }) => {
            const active = lighting === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeLighting(id)}
                className={`inline-flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#e0b973] text-[#181512] font-semibold'
                    : 'text-[#cabda9] hover:text-[#f5efe6]'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Mirror Glass Surface */}
        <div
          ref={mirrorRef}
          data-testid="smart-mirror-glass"
          data-lighting={lighting}
          className="relative h-[415px] rounded-t-[86px] rounded-b-xl border border-[#e0b973]/35 bg-[#15120f] overflow-hidden flex flex-col justify-between shadow-[inset_0_0_40px_rgba(0,0,0,0.75)]"
        >
          {/* Warm LED Mirror Perimeter Strip */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-1.5 rounded-t-[80px] rounded-b-lg border border-[#f5efe6]/15"
          />

          {/* Ambient Lighting Tint Overlay */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 transition-colors duration-500 ${LIGHTING_OVERLAY_STYLES[lighting]}`}
          />

          {/* Diagonal Mirror Glass Sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent"
          />

          {/* Top Mirror Lighting Readout & Fine-Tune Fit / Snapshot */}
          <div className="relative z-10 flex flex-col items-center pt-2.5 px-6 gap-1.5">
            <span className="text-[10px] tracking-[0.14em] uppercase text-[#e0b973]/90 font-medium whitespace-nowrap">
              {lighting}
            </span>
            <div className="flex items-center justify-center gap-1.5" data-export-ignore="true">
              {photoSlots.length > 0 && onUpdateGarmentTransform && (
                <button
                  type="button"
                  aria-expanded={alignOpen}
                  aria-label="Fine-Tune Fit"
                  onClick={() => setAlignOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    alignOpen
                      ? 'bg-[#e0b973] text-[#181512] border-[#e0b973] font-semibold'
                      : 'bg-[#181512]/80 hover:bg-[#312821] border-[#e0b973]/30 text-[#f5efe6]'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
                  <span>Fine-Tune Fit</span>
                </button>
              )}
              <button
                type="button"
                onClick={onExportPng}
                disabled={equippedCount === 0 || isExporting}
                aria-label="Export current look as PNG"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#181512]/80 hover:bg-[#312821] border border-[#e0b973]/30 text-[10px] font-medium text-[#f5efe6] disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-3 h-3 text-[#e0b973]" aria-hidden="true" />
                <span>{isExporting ? 'Saving…' : 'Snapshot'}</span>
              </button>
            </div>
          </div>

          {/* Compact "Fine-Tune Fit" Popover (Scale ±15%, Vertical Shift ±10px) */}
          {alignOpen && activePhotoItem && onUpdateGarmentTransform && (
            <div
              data-export-ignore="true"
              data-testid="mirror-align-panel"
              className="relative z-30 mx-3 mt-1.5 p-2.5 rounded-xl bg-[#181512]/95 backdrop-blur-md border border-[#e0b973]/40 shadow-xl space-y-2 text-[11px]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {photoSlots.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveAlignSlot(key)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer whitespace-nowrap ${
                        activeAlignSlot === key
                          ? 'bg-[#e0b973] text-[#181512] font-semibold'
                          : 'bg-[#261f1a] text-[#cbbca8] hover:text-[#f5efe6]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] text-[#baa995] hidden sm:inline">
                    {activeAnchor.lockLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateGarmentTransform(activePhotoItem.id, { scale: 1, offsetY: 0 })
                    }
                    aria-label="Reset photo alignment"
                    className="text-[10px] text-[#e0b973] hover:text-[#f5efe6] cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block space-y-0.5">
                  <div className="flex justify-between text-[10px] text-[#cabda9] tabular-nums">
                    <span>Scale (±15%)</span>
                    <span>
                      {scalePctDelta > 0 ? `+${scalePctDelta}%` : `${scalePctDelta}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Scale ±15%"
                    min={FINE_TUNE_SCALE_MIN}
                    max={FINE_TUNE_SCALE_MAX}
                    step={0.01}
                    value={activeTransform.scale}
                    onChange={(e) =>
                      onUpdateGarmentTransform(activePhotoItem.id, {
                        ...activeTransform,
                        scale: Number.parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-[#e0b973] cursor-pointer"
                  />
                </label>

                <label className="block space-y-0.5">
                  <div className="flex justify-between text-[10px] text-[#cabda9] tabular-nums">
                    <span>Vertical Shift</span>
                    <span>
                      {activeTransform.offsetY > 0
                        ? `+${activeTransform.offsetY}`
                        : activeTransform.offsetY}
                      px
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Vertical Shift ±10px"
                    min={FINE_TUNE_OFFSET_MIN}
                    max={FINE_TUNE_OFFSET_MAX}
                    step={1}
                    value={activeTransform.offsetY}
                    onChange={(e) =>
                      onUpdateGarmentTransform(activePhotoItem.id, {
                        ...activeTransform,
                        offsetY: Number.parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#e0b973] cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Full-Length Mannequin Silhouette */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-3 py-1 min-h-0 overflow-hidden">
            <MannequinLookPreview
              slots={slots}
              skinTone={skinTone}
              fitPreference={fitPreference}
              bodyType={bodyType}
              lighting={lighting}
            />
          </div>

          {/* Frosted Mirror Footer Strip showing active layers + Clear Outfit */}
          <div
            data-export-ignore="true"
            className="relative z-10 mx-2.5 mb-2 rounded-xl bg-[#181512]/85 backdrop-blur-md border border-[#f5efe6]/10 p-2 space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px] text-[#cbbca8] px-1">
              <span className="tabular-nums">
                {equippedCount} of 4 layers equipped
              </span>
              <button
                type="button"
                onClick={onClearAll}
                disabled={equippedCount === 0}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#e0b973] hover:text-[#f5efe6] disabled:opacity-35 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Clear Outfit</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {SLOT_LABELS.map(({ key, label }) => {
                const item = slots[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-[#261f1a]/80 border border-[#f5efe6]/[0.07] min-w-0"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                        style={{
                          backgroundColor: item ? item.colorHex : 'transparent',
                        }}
                        aria-hidden="true"
                      />
                      <span className="text-[11px] text-[#f5efe6] truncate">
                        {item ? item.name : `No ${label}`}
                      </span>
                    </div>
                    {item && (
                      <button
                        type="button"
                        onClick={() => onClearSlot(key)}
                        aria-label={`Remove ${item.name} from ${label}`}
                        className="text-[#a79a89] hover:text-[#f5efe6] shrink-0 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Visual Moodboard Studio Launcher */}
        {onOpenMoodboard && (
          <button
            type="button"
            data-testid="open-moodboard-btn"
            onClick={onOpenMoodboard}
            disabled={equippedCount === 0}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[#2f251d] hover:bg-[#e0b973] text-[#f5efe6] hover:text-[#181512] border border-[#e0b973]/40 transition-colors cursor-pointer disabled:opacity-40 group"
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <LayoutGrid
                className="w-4 h-4 text-[#e0b973] group-hover:text-[#181512] shrink-0"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold truncate">
                AI Visual Moodboard
              </span>
            </span>
            <span className="text-[11px] text-[#e0b973] group-hover:text-[#181512] font-medium whitespace-nowrap shrink-0">
              Style in Context
            </span>
          </button>
        )}

        {/* 2. "How It Will Look on Your Body Type" Card */}
        <section
          aria-label="How It Will Look on Your Body Type"
          data-testid="body-type-verdict-card"
          className="rounded-xl bg-[#181512]/90 border border-[#f5efe6]/12 p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <UserCheck className="w-3.5 h-3.5 text-[#e0b973] shrink-0" aria-hidden="true" />
              <h3 className="text-xs font-semibold text-[#f5efe6] truncate">
                How It Will Look on Your Body Type
              </h3>
            </div>
          </div>

          {/* Quick Body-Type Switcher inside Card */}
          <div
            role="group"
            aria-label="Mirror body type selector"
            className="grid grid-cols-5 gap-1 p-0.5 rounded-lg bg-[#221b16] border border-[#f5efe6]/10"
          >
            {BODY_TYPE_OPTIONS.map((bt) => {
              const active = bodyType === bt.id;
              return (
                <button
                  key={bt.id}
                  type="button"
                  aria-pressed={active}
                  title={bt.label}
                  onClick={() => onChangeBodyType(bt.id)}
                  className={`py-1 px-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer truncate ${
                    active
                      ? 'bg-[#e0b973] text-[#181512] font-semibold'
                      : 'text-[#cbbca8] hover:text-[#f5efe6]'
                  }`}
                >
                  {bt.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#e0b973]">
              {fitEvaluation.bodyTypeVerdict.headline}
            </p>
            <p className="text-[11px] text-[#e6dccf] leading-relaxed">
              {fitEvaluation.bodyTypeVerdict.drapeSummary}
            </p>
            <p className="text-[11px] text-[#baa995] leading-relaxed">
              {fitEvaluation.bodyTypeVerdict.proportionTip}
            </p>
          </div>
        </section>

        {/* 3. "What You Can Wear Instead" Upgrades */}
        <section
          aria-label="What You Can Wear Instead"
          data-testid="fit-upgrades-card"
          className="rounded-xl bg-[#181512]/90 border border-[#e0b973]/25 p-3 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#e0b973] shrink-0" aria-hidden="true" />
              <h3 className="text-xs font-semibold text-[#f5efe6]">
                What You Can Wear Instead
              </h3>
            </div>
            <span className="text-[10px] text-[#baa995]">1-click swap</span>
          </div>

          {fitEvaluation.upgrades.length === 0 ? (
            <p className="text-[11px] text-[#baa995]">
              Equip clothes from the rails to generate tailored upgrade swaps.
            </p>
          ) : (
            <div className="space-y-2">
              {fitEvaluation.upgrades.map((upgrade) => (
                <div
                  key={upgrade.item.id}
                  data-testid={`upgrade-card-${upgrade.item.id}`}
                  className="rounded-xl bg-[#221b16]/90 border border-[#f5efe6]/10 p-2.5 space-y-2"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#15120f] border border-[#f5efe6]/10 shrink-0">
                      <GarmentArtwork
                        silhouette={upgrade.item.silhouette}
                        colorHex={upgrade.item.colorHex}
                        name={upgrade.item.name}
                        imageUrl={upgrade.item.imageUrl}
                        transparentBg
                        className="w-full h-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="text-xs font-semibold text-[#f5efe6] truncate">
                          {upgrade.item.name}
                        </p>
                        <span className="text-[10px] font-mono text-[#e0b973] tabular-nums shrink-0">
                          {upgrade.scoreDelta > 0
                            ? `+${upgrade.scoreDelta}%`
                            : `${upgrade.projectedScore}%`}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#baa995]">
                        {upgrade.slotAction} · {upgrade.item.colorName}
                        {upgrade.item.brand ? ` · ${upgrade.item.brand}` : ''}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#d4c8b8] leading-snug">
                    {upgrade.reason}
                  </p>

                  <button
                    type="button"
                    onClick={() => onApplySwap(upgrade.item)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#2f251d] hover:bg-[#e0b973] text-[#e0b973] hover:text-[#181512] border border-[#e0b973]/40 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3 h-3" aria-hidden="true" />
                    <span>Try This Swap</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};
