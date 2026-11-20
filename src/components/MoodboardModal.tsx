import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  AlertCircle,
  Camera,
  Check,
  Loader2,
  MapPin,
  Palette,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { OutfitSlots, WardrobeProfile } from '../types/wardrobe';
import { FitCheckEvaluation } from '../utils/fitCheckScore';
import {
  LIFESTYLE_SCENES,
  LifestyleSceneKey,
  MoodboardGarmentInput,
  MoodboardPlan,
  buildMoodboardFilename,
  getLifestyleSceneByKey,
} from '../utils/moodboard';
import { SKIN_TONE_OPTIONS } from '../utils/wardrobeStyling';
import { GarmentArtwork } from './GarmentArtwork';
import { LifestyleBackdropSvg } from './LifestyleBackdropSvg';
import { MannequinLookPreview } from './MannequinLookPreview';

interface MoodboardModalProps {
  isOpen: boolean;
  slots: OutfitSlots;
  profile: WardrobeProfile;
  fitEvaluation: FitCheckEvaluation;
  onClose: () => void;
}

const SLOT_ORDER: { key: keyof OutfitSlots; label: string }[] = [
  { key: 'outerwear', label: 'Layer' },
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'footwear', label: 'Footwear' },
];

export const MoodboardModal: React.FC<MoodboardModalProps> = ({
  isOpen,
  slots,
  profile,
  fitEvaluation,
  onClose,
}) => {
  const [selectedScene, setSelectedScene] =
    useState<LifestyleSceneKey>('campus_cafe');
  const [customNote, setCustomNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedDone, setExportedDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiPlan, setAiPlan] = useState<MoodboardPlan | null>(null);

  const collageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const equippedEntries = useMemo(() => {
    return SLOT_ORDER.map(({ key, label }) => {
      const item = slots[key];
      if (!item) return null;
      return { slot: key, slotLabel: label, item };
    }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [slots]);

  const outfitSignature = equippedEntries.map((e) => e.item.id).join('|');

  useEffect(() => {
    // Clear stale AI plan when the equipped outfit changes significantly
    setAiPlan(null);
    setErrorMsg('');
  }, [outfitSignature]);

  const activeSceneMeta = getLifestyleSceneByKey(selectedScene);
  const skinLabel =
    SKIN_TONE_OPTIONS.find((s) => s.id === profile.skinTone)?.label ?? 'Wheatish';

  const fallbackSwatches = useMemo(() => {
    const itemSwatches = equippedEntries.slice(0, 3).map((e) => ({
      hex: e.item.colorHex,
      name: e.item.colorName,
      role: e.slotLabel,
    }));
    while (itemSwatches.length < 4) {
      itemSwatches.push({
        hex: activeSceneMeta.defaultBackdropPalette.accentGlow,
        name: activeSceneMeta.shortLabel,
        role: 'Setting Glow',
      });
    }
    return itemSwatches;
  }, [equippedEntries, activeSceneMeta]);

  if (!isOpen) return null;

  const activePalette =
    aiPlan && aiPlan.sceneKey === selectedScene
      ? aiPlan.backdropPalette
      : activeSceneMeta.defaultBackdropPalette;

  const activeLighting = activeSceneMeta.defaultLighting;

  const displayedSwatches = aiPlan ? aiPlan.paletteSwatches : fallbackSwatches;

  const handleGenerateMoodboard = async (
    targetScene: LifestyleSceneKey = selectedScene,
  ) => {
    if (equippedEntries.length === 0 || isGenerating) return;
    setIsGenerating(true);
    setErrorMsg('');

    const payloadItems: MoodboardGarmentInput[] = equippedEntries.map(
      ({ slot, item }) => ({
        id: item.id,
        slot,
        name: item.name,
        brand: item.brand,
        category: item.category,
        colorName: item.colorName,
        colorHex: item.colorHex,
        fit: item.fit,
        vibe: item.vibe,
        imageUrl: item.imageUrl,
      }),
    );

    try {
      const response = await fetch('/api/moodboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payloadItems,
          profile: {
            skinTone: profile.skinTone,
            undertone: profile.undertone,
            size: profile.size,
            fitPreference: profile.fitPreference,
            bodyType: profile.bodyType,
          },
          lighting: profile.lighting,
          sceneKey: targetScene,
          customNote,
        }),
      });

      const data = (await response.json()) as {
        moodboard?: MoodboardPlan;
        error?: string;
      };

      if (!response.ok || !data.moodboard) {
        setErrorMsg(
          data.error ?? 'Could not generate your AI moodboard right now.',
        );
        return;
      }

      setAiPlan(data.moodboard);
    } catch {
      setErrorMsg('Network error while generating your AI moodboard.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMoodboard = async () => {
    if (!collageRef.current || isExporting) return;
    setIsExporting(true);
    setExportedDone(false);

    try {
      const dataUrl = await toPng(collageRef.current, {
        pixelRatio: Math.max(window.devicePixelRatio || 2, 2.5),
        cacheBust: true,
        backgroundColor: '#14110e',
        skipFonts: true,
      });

      const link = document.createElement('a');
      link.download = buildMoodboardFilename(
        aiPlan?.title ?? activeSceneMeta.shortLabel,
      );
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportedDone(true);
      window.setTimeout(() => setExportedDone(false), 2200);
    } catch {
      setErrorMsg('Could not export collage PNG. Try again in a moment.');
    } finally {
      setIsExporting(false);
    }
  };

  const headlineText =
    aiPlan?.title ??
    (slots.outerwear
      ? `${slots.outerwear.colorName} & ${slots.bottom?.colorName ?? 'Layer'} Edit`
      : slots.top
        ? `${slots.top.colorName} ${activeSceneMeta.shortLabel} Look`
        : 'Context Lookbook');

  const subtitleText =
    aiPlan?.subtitle ??
    `Previewing ${equippedEntries.length} equipped pieces in ${activeSceneMeta.locationHint.toLowerCase()}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="moodboard-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto"
    >
      <div className="w-full max-w-5xl rounded-2xl bg-[#1b1612] border border-[#e0b973]/35 shadow-[0_28px_70px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#f5efe6]/10 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2
              id="moodboard-modal-title"
              className="font-display text-lg sm:text-xl font-semibold text-[#f5efe6] leading-tight truncate"
            >
              AI Visual Moodboard Studio
            </h2>
            <p className="text-[11px] text-[#baa995] mt-0.5 truncate">
              Curate your outfit collage against real lifestyle backdrops
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Visual Moodboard Studio"
            className="p-2 rounded-lg text-[#baa995] hover:text-[#f5efe6] hover:bg-[#2a221c] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 min-h-0">
          {/* Lifestyle Backdrop Selector + Custom Vibe Bar */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                role="group"
                aria-label="Choose lifestyle background"
                className="flex flex-wrap items-center gap-1.5"
              >
                {LIFESTYLE_SCENES.map((scene) => {
                  const active = selectedScene === scene.key;
                  return (
                    <button
                      key={scene.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSelectedScene(scene.key);
                        if (aiPlan && aiPlan.sceneKey !== scene.key) {
                          setAiPlan(null);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                        active
                          ? 'bg-[#e0b973] text-[#181512] border-[#e0b973] font-semibold'
                          : 'bg-[#261f1a] text-[#d4c8b8] hover:text-[#f5efe6] border-[#f5efe6]/12'
                      }`}
                    >
                      <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>{scene.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] text-[#baa995] tabular-nums whitespace-nowrap">
                {fitEvaluation.overallScore}% Fit Check · {fitEvaluation.badgeLabel}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <label htmlFor="moodboard-custom-note" className="sr-only">
                Optional occasion or setting note
              </label>
              <input
                id="moodboard-custom-note"
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Optional occasion vibe (e.g. Friday coffee in Bandra, gallery opening, monsoon evening)…"
                className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-[#14110e] border border-[#f5efe6]/15 text-xs text-[#f5efe6] placeholder:text-[#8b7d6d] focus:outline-none focus:ring-2 focus:ring-[#e0b973]"
              />
              <button
                type="button"
                data-testid="generate-moodboard-btn"
                disabled={equippedEntries.length === 0 || isGenerating}
                onClick={() => void handleGenerateMoodboard(selectedScene)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#e0b973] hover:bg-[#ebd09a] text-[#181512] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-45 shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Curating Moodboard…</span>
                  </>
                ) : aiPlan ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Regenerate Collage</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Curate AI Moodboard</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div
              role="alert"
              data-testid="moodboard-error-alert"
              className="flex items-start gap-2 rounded-xl bg-rose-950/75 border border-rose-500/40 px-3.5 py-2.5 text-xs text-rose-200"
            >
              <AlertCircle
                className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Empty State */}
          {equippedEntries.length === 0 ? (
            <div className="rounded-2xl bg-[#14110e] border border-[#f5efe6]/10 p-10 text-center space-y-2">
              <p className="font-display text-xl text-[#f5efe6]">
                Equip at least one garment first
              </p>
              <p className="text-xs text-[#baa995] max-w-md mx-auto">
                Select a top, overshirt, bottom, or pair of shoes from your wardrobe rails to compose your lifestyle moodboard.
              </p>
            </div>
          ) : (
            /* Editorial Collage Canvas */
            <div
              ref={collageRef}
              data-testid="moodboard-collage-canvas"
              data-scene={selectedScene}
              data-curated={aiPlan ? 'true' : 'false'}
              className="relative rounded-2xl overflow-hidden border border-[#e0b973]/35 bg-[#14110e] shadow-[0_22px_55px_rgba(0,0,0,0.65)]"
            >
              {/* Full-Bleed Architectural Lifestyle Backdrop */}
              <div className="absolute inset-0 pointer-events-none">
                <LifestyleBackdropSvg
                  sceneKey={selectedScene}
                  palette={activePalette}
                />
                {/* Scrim ensuring crisp contrast for collage layers & typography */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b09]/88 via-[#120f0c]/35 to-[#0d0b09]/55" />
              </div>

              {/* Foreground Collage Composition */}
              <div className="relative z-10 p-4 sm:p-5 space-y-3.5">
                {/* Editorial Masthead */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 border-b border-[#f5efe6]/15">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#e0b973] font-medium">
                      {aiPlan?.sceneLabel ?? activeSceneMeta.label} ·{' '}
                      {aiPlan?.lightingMood ?? `${activeLighting} ambience`}
                    </p>
                    <h3
                      data-testid="moodboard-headline"
                      className="font-display text-xl sm:text-2xl font-semibold text-[#f5efe6] leading-tight text-balance"
                    >
                      {headlineText}
                    </h3>
                    <p className="text-xs text-[#ddd0bf] max-w-2xl">
                      {subtitleText}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <p className="font-mono text-xs font-semibold text-[#e0b973] tabular-nums">
                      {fitEvaluation.overallScore}% · {fitEvaluation.badgeLabel}
                    </p>
                    <p className="text-[11px] text-[#cbbca8]">
                      Size {profile.size} · {skinLabel} ({profile.undertone})
                    </p>
                  </div>
                </div>

                {/* 2-Column Collage Grid: Hero In-Context Silhouette + Pinned Garment Polaroids & Palette */}
                <div className="grid grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)] gap-3.5 items-stretch">
                  {/* Left: Hero Outfit Frame on Mannequin */}
                  <div className="rounded-xl bg-[#15110e]/80 backdrop-blur-md border border-[#e0b973]/30 p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#cbbca8] pb-1.5">
                      <span>Look In Context</span>
                      <span className="text-[#e0b973]">{activeSceneMeta.shortLabel}</span>
                    </div>

                    <div className="relative h-[245px] sm:h-[260px] rounded-lg overflow-hidden border border-[#f5efe6]/10 bg-[#18130f]/55 flex items-center justify-center p-2">
                      <div className="absolute inset-0 opacity-35 pointer-events-none">
                        <LifestyleBackdropSvg
                          sceneKey={selectedScene}
                          palette={activePalette}
                        />
                      </div>
                      <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <MannequinLookPreview
                          slots={slots}
                          skinTone={profile.skinTone}
                          fitPreference={profile.fitPreference}
                          bodyType={profile.bodyType}
                          lighting={activeLighting}
                          animateChanges={false}
                        />
                      </div>
                    </div>

                    <p className="mt-2.5 text-[11px] text-[#e6dccf] leading-snug">
                      {aiPlan?.collageCaptions.lookCaption ??
                        `Balanced ${profile.fitPreference.toLowerCase()} silhouette styled for ${activeSceneMeta.shortLabel.toLowerCase()}.`}
                    </p>
                  </div>

                  {/* Right: Pinned Pieces + Swatches + Editorial Story + Props */}
                  <div className="flex flex-col justify-between gap-3.5 min-w-0">
                    {/* Pinned Garment Flat-Lay Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {equippedEntries.map(({ slot, slotLabel, item }) => (
                        <div
                          key={slot}
                          className="rounded-xl bg-[#191511]/88 backdrop-blur-md border border-[#f5efe6]/15 p-2.5 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#baa995]">
                            <span className="uppercase tracking-wider">{slotLabel}</span>
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/25"
                              style={{ backgroundColor: item.colorHex }}
                              aria-hidden="true"
                            />
                          </div>
                          <div className="h-20 rounded-lg bg-[#110e0c] border border-[#f5efe6]/[0.08] overflow-hidden flex items-center justify-center p-1">
                            <GarmentArtwork
                              silhouette={item.silhouette}
                              colorHex={item.colorHex}
                              name={item.name}
                              imageUrl={item.imageUrl}
                              transparentBg
                              className="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#f5efe6] truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-[#baa995] truncate">
                              {item.colorName}
                              {item.brand ? ` · ${item.brand}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Curated Color Swatch Strip */}
                    <div className="rounded-xl bg-[#191511]/88 backdrop-blur-md border border-[#f5efe6]/12 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#e0b973] uppercase tracking-[0.12em]">
                          <Palette className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Context Palette</span>
                        </span>
                        <span className="text-[10px] text-[#baa995]">
                          {aiPlan ? 'AI Curated Harmony' : 'Live Outfit & Setting Tones'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {displayedSwatches.map((swatch, idx) => (
                          <div
                            key={`${swatch.hex}-${idx}`}
                            className="flex items-center gap-2 rounded-lg bg-[#13100d]/85 border border-[#f5efe6]/10 px-2.5 py-1.5 min-w-0"
                          >
                            <span
                              className="w-6 h-6 rounded-md border border-white/20 shrink-0"
                              style={{ backgroundColor: swatch.hex }}
                              aria-hidden="true"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-[#f5efe6] truncate">
                                {swatch.name}
                              </p>
                              <p className="text-[10px] text-[#cbbca8] truncate">
                                {swatch.role}
                              </p>
                              <p className="text-[9px] font-mono text-[#9f8f7d] uppercase tabular-nums">
                                {swatch.hex}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Editorial Story & Styling Props */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-3">
                      <div className="rounded-xl bg-[#191511]/88 backdrop-blur-md border border-[#f5efe6]/12 p-3 space-y-1.5">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#e0b973] font-semibold">
                          In-Context Editorial Note
                        </p>
                        <p
                          data-testid="moodboard-context-story"
                          className="text-xs text-[#efe7db] leading-relaxed"
                        >
                          {aiPlan?.contextStory ??
                            `Placed in ${activeSceneMeta.locationHint.toLowerCase()}, these tones balance against your ${skinLabel.toLowerCase()} (${profile.undertone.toLowerCase()}) complexion. Click "Curate AI Moodboard" for tailored texture, lighting, and accessory direction.`}
                        </p>
                        <p className="text-[11px] text-[#baa995] pt-0.5">
                          {aiPlan?.collageCaptions.textureNote ??
                            fitEvaluation.bodyTypeVerdict.headline}{' '}
                          ·{' '}
                          {aiPlan?.collageCaptions.proportionNote ??
                            fitEvaluation.bodyTypeVerdict.proportionTip}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#191511]/88 backdrop-blur-md border border-[#f5efe6]/12 p-3 space-y-1.5">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#e0b973] font-semibold">
                          Finish the Moodboard
                        </p>
                        <ul className="space-y-1.5">
                          {(aiPlan?.stylingProps ?? [
                            'Tortoise Acetate Sunglasses',
                            'Brushed Steel Dress Watch',
                            'Heavyweight Canvas Tote',
                          ]).map((prop) => (
                            <li
                              key={prop}
                              className="text-xs text-[#f5efe6] flex items-center justify-between gap-2 border-b border-[#f5efe6]/[0.06] pb-1 last:border-b-0 last:pb-0"
                            >
                              <span>{prop}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Magazine Footer Line */}
                <div className="pt-2 border-t border-[#f5efe6]/12 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#cbbca8]">
                  <span>
                    {aiPlan?.editorialTagline ?? 'FitCheck AI · Visual Context Collage'}
                  </span>
                  <span className="font-mono text-[10px] text-[#baa995] tabular-nums">
                    {equippedEntries.length} pieces · {activeSceneMeta.label}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#f5efe6]/10 bg-[#14110e] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <p className="hidden sm:block text-[11px] text-[#baa995]">
            Switch backdrops anytime or export your moodboard as a PNG lookbook card.
          </p>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => void handleDownloadMoodboard()}
              disabled={equippedEntries.length === 0 || isExporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#261f1a] hover:bg-[#332922] border border-[#e0b973]/35 text-xs font-semibold text-[#f5efe6] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40"
            >
              {exportedDone ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Saved PNG</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-[#e0b973]" aria-hidden="true" />
                  <span>{isExporting ? 'Exporting…' : 'Download Moodboard PNG'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#261f1a] hover:bg-[#312821] border border-[#f5efe6]/15 text-xs font-medium text-[#cbbca8] hover:text-[#f5efe6] transition-colors cursor-pointer whitespace-nowrap"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
