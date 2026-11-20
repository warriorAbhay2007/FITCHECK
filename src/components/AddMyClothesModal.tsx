import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  ImagePlus,
  Layers,
  Scissors,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  ColorFamily,
  FitPreference,
  FitType,
  GarmentCategory,
  GarmentSilhouette,
  OccasionTag,
  RailSubcategory,
  StyleVibe,
  WardrobeItem,
} from '../types/wardrobe';
import {
  DEFAULT_HARD_THRESHOLD,
  ProcessedGarmentImage,
  classifyRgbColorName,
  processUploadedGarmentImage,
} from '../utils/garmentImageProcessor';
import { GarmentArtwork } from './GarmentArtwork';

interface AddMyClothesModalProps {
  isOpen: boolean;
  editingItem?: WardrobeItem | null;
  onClose: () => void;
  onSave: (item: WardrobeItem) => void;
}

interface RailOption {
  tab: RailSubcategory;
  group: 'Upperwear' | 'Bottomwear' | 'Footwear';
  category: GarmentCategory;
  defaultSilhouette: GarmentSilhouette;
  defaultLayerable: boolean;
  defaultVibe: StyleVibe;
}

const RAIL_OPTIONS: RailOption[] = [
  { tab: 'T-Shirts', group: 'Upperwear', category: 'Tops', defaultSilhouette: 'tee', defaultLayerable: false, defaultVibe: 'Streetwear' },
  { tab: 'Shirts', group: 'Upperwear', category: 'Tops', defaultSilhouette: 'shirt', defaultLayerable: false, defaultVibe: 'Smart Casual' },
  { tab: 'Hoodies & Sweatshirts', group: 'Upperwear', category: 'Tops', defaultSilhouette: 'hoodie', defaultLayerable: true, defaultVibe: 'Streetwear' },
  { tab: 'Jackets & Outerwear', group: 'Upperwear', category: 'Outerwear', defaultSilhouette: 'jacket', defaultLayerable: true, defaultVibe: 'Streetwear' },
  { tab: 'Jeans', group: 'Bottomwear', category: 'Bottoms', defaultSilhouette: 'denim', defaultLayerable: false, defaultVibe: 'Casual' },
  { tab: 'Trousers & Chinos', group: 'Bottomwear', category: 'Bottoms', defaultSilhouette: 'trousers', defaultLayerable: false, defaultVibe: 'Smart Casual' },
  { tab: 'Cargos & Joggers', group: 'Bottomwear', category: 'Bottoms', defaultSilhouette: 'cargo', defaultLayerable: false, defaultVibe: 'Streetwear' },
  { tab: 'Shorts', group: 'Bottomwear', category: 'Bottoms', defaultSilhouette: 'shorts', defaultLayerable: false, defaultVibe: 'Casual' },
  { tab: 'Sneakers', group: 'Footwear', category: 'Footwear', defaultSilhouette: 'sneakers', defaultLayerable: false, defaultVibe: 'Streetwear' },
  { tab: 'Casual & Loafers', group: 'Footwear', category: 'Footwear', defaultSilhouette: 'loafers', defaultLayerable: false, defaultVibe: 'Smart Casual' },
  { tab: 'Boots & Formal', group: 'Footwear', category: 'Footwear', defaultSilhouette: 'boots', defaultLayerable: false, defaultVibe: 'Smart Casual' },
];

const FIT_OPTIONS: { label: FitPreference; mappedFit: FitType }[] = [
  { label: 'Slim', mappedFit: 'Slim' },
  { label: 'Regular', mappedFit: 'Regular' },
  { label: 'Relaxed/Oversized', mappedFit: 'Oversized' },
];

const OCCASION_OPTIONS: OccasionTag[] = [
  'College Daily',
  'Streetwear',
  'Smart Casual',
  'Festive',
];

function fitTypeToPreference(fit?: FitType): FitPreference {
  if (fit === 'Slim' || fit === 'Tailored') return 'Slim';
  if (fit === 'Oversized' || fit === 'Relaxed' || fit === 'Boxy' || fit === 'Chunky') {
    return 'Relaxed/Oversized';
  }
  return 'Regular';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export const AddMyClothesModal: React.FC<AddMyClothesModalProps> = ({
  isOpen,
  editingItem = null,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState('');
  const [railTab, setRailTab] = useState<RailSubcategory>('Hoodies & Sweatshirts');
  const [fitPref, setFitPref] = useState<FitPreference>('Relaxed/Oversized');
  const [occasion, setOccasion] = useState<OccasionTag>('Streetwear');
  const [allowLayering, setAllowLayering] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processed, setProcessed] = useState<ProcessedGarmentImage | null>(null);
  const [cutoutMode, setCutoutMode] = useState<'transparent' | 'rounded-card'>('transparent');
  const [sensitivity, setSensitivity] = useState(DEFAULT_HARD_THRESHOLD);
  const [colorHex, setColorHex] = useState('#2B2B2E');
  const [colorName, setColorName] = useState('Charcoal Grey');
  const [colorFamily, setColorFamily] = useState<ColorFamily>('neutral');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSelectedFile(null);
    setProcessed(null);
    setSensitivity(DEFAULT_HARD_THRESHOLD);

    if (editingItem) {
      setName(editingItem.name);
      setRailTab(editingItem.railTab ?? 'T-Shirts');
      setFitPref(fitTypeToPreference(editingItem.fit));
      setOccasion(editingItem.occasionTags?.[0] ?? 'College Daily');
      setAllowLayering(Boolean(editingItem.layerable));
      setCutoutMode(editingItem.cutoutMode ?? 'transparent');
      setColorHex(editingItem.colorHex);
      setColorName(editingItem.colorName);
      setColorFamily(editingItem.colorFamily);
    } else {
      setName('');
      setRailTab('T-Shirts');
      setFitPref('Regular');
      setOccasion('College Daily');
      setAllowLayering(false);
      setCutoutMode('transparent');
      setColorHex('#2B2B2E');
      setColorName('Charcoal Grey');
      setColorFamily('neutral');
    }
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const activeRailOpt =
    RAIL_OPTIONS.find((r) => r.tab === railTab) ?? RAIL_OPTIONS[0];

  const runImageProcessing = async (file: File, nextSensitivity: number) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const result = await processUploadedGarmentImage(file, {
        maxWidth: 600,
        sensitivity: nextSensitivity,
      });
      setProcessed(result);
      setCutoutMode(result.recommendedCutoutMode);
      setColorHex(result.colorHex);
      setColorName(result.colorName);
      setColorFamily(result.colorFamily);

      // Suggest a clean name if still blank
      if (!name.trim()) {
        const cleanedFile = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .trim();
        if (cleanedFile && cleanedFile.length >= 3 && !/^img|^pxl|^dsc/i.test(cleanedFile)) {
          setName(cleanedFile.slice(0, 38));
        }
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not process image file.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChosen = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPEG, or WebP).');
      return;
    }
    setSelectedFile(file);
    void runImageProcessing(file, sensitivity);
  };

  const handleRailChange = (nextTab: RailSubcategory) => {
    setRailTab(nextTab);
    const opt = RAIL_OPTIONS.find((r) => r.tab === nextTab);
    if (opt) {
      setAllowLayering(opt.defaultLayerable);
    }
  };

  const handleColorOverride = (nextHex: string) => {
    setColorHex(nextHex.toUpperCase());
    const rgb = hexToRgb(nextHex);
    if (rgb) {
      const classified = classifyRgbColorName(rgb.r, rgb.g, rgb.b);
      setColorName(classified.colorName);
      setColorFamily(classified.colorFamily);
    }
  };

  const activePreviewUrl = processed
    ? cutoutMode === 'transparent'
      ? processed.transparentDataUrl
      : processed.roundedCardDataUrl
    : editingItem?.imageUrl;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const mappedFit =
      FIT_OPTIONS.find((f) => f.label === fitPref)?.mappedFit ?? 'Regular';

    const canLayer =
      activeRailOpt.group === 'Upperwear' &&
      (activeRailOpt.category === 'Outerwear' || allowLayering);

    const savedItem: WardrobeItem = {
      id: editingItem?.id ?? `mine-${Date.now()}`,
      name: cleanName,
      brand: 'My Closet',
      category: activeRailOpt.category,
      railTab,
      subStyle: fitPref === 'Relaxed/Oversized' ? 'Relaxed' : fitPref,
      layerable: canLayer,
      colorName,
      colorHex,
      colorFamily,
      vibe: activeRailOpt.defaultVibe,
      fit: mappedFit,
      silhouette: editingItem?.silhouette ?? activeRailOpt.defaultSilhouette,
      tags: [
        activeRailOpt.defaultVibe.toLowerCase(),
        occasion.toLowerCase(),
        'mine',
      ],
      occasionTags: [occasion],
      imageUrl: activePreviewUrl,
      cutoutMode,
      mirrorTransform: editingItem?.mirrorTransform ?? { scale: 1, offsetY: 0 },
      isCustom: true,
      isUserUploaded: true,
      createdAt: editingItem?.createdAt ?? new Date().toISOString(),
    };

    onSave(savedItem);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-my-clothes-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4"
    >
      <div className="w-full max-w-xl max-h-[92vh] rounded-2xl bg-[#1f1915] border border-[#e0b973]/30 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#f5efe6]/10 flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#e0b973] font-medium">
              Personal Wardrobe
            </p>
            <h2
              id="add-my-clothes-title"
              className="font-display text-2xl font-semibold text-[#f5efe6] leading-tight"
            >
              {editingItem ? 'Edit My Garment' : 'Add to My Wardrobe'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add clothes modal"
            className="p-1.5 rounded-lg text-[#baa995] hover:text-[#f5efe6] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Step 1: Photo Upload / Dropzone & Live Auto-Cutout Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-4 items-stretch">
            {/* Preview Box */}
            <div className="rounded-xl bg-[#14110e] border border-[#e0b973]/25 p-2.5 flex flex-col items-center justify-between min-h-[196px] relative">
              <div className="w-full flex items-center justify-between text-[10px] text-[#baa995]">
                <span>Hanger Preview</span>
                {processed && (
                  <span className="font-mono tabular-nums">
                    {processed.width}×{processed.height}
                  </span>
                )}
              </div>

              <div className="w-full h-36 flex items-center justify-center my-1 overflow-hidden rounded-lg bg-[radial-gradient(circle_at_center,rgba(224,185,115,0.08),transparent_70%)]">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2 text-[#e0b973]">
                    <Sparkles className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span className="text-[11px]">Removing background…</span>
                  </div>
                ) : activePreviewUrl ? (
                  <img
                    src={activePreviewUrl}
                    alt={name || 'Uploaded garment preview'}
                    className={`max-w-full max-h-full object-contain ${
                      cutoutMode === 'rounded-card' ? 'rounded-xl border border-[#e0b973]/30' : ''
                    }`}
                  />
                ) : (
                  <GarmentArtwork
                    silhouette={activeRailOpt.defaultSilhouette}
                    colorHex={colorHex}
                    name={name || 'Garment silhouette'}
                    transparentBg
                    className="w-28 h-28 opacity-70"
                  />
                )}
              </div>

              {/* Auto-Extracted Dominant Color Bar */}
              <div className="w-full flex items-center justify-between gap-2 pt-1.5 border-t border-[#f5efe6]/10">
                <div className="flex items-center gap-1.5 min-w-0">
                  <input
                    type="color"
                    aria-label="Adjust detected garment color"
                    value={colorHex}
                    onChange={(e) => handleColorOverride(e.target.value)}
                    className="w-5 h-5 rounded border border-white/25 bg-transparent cursor-pointer shrink-0 p-0"
                  />
                  <span className="text-[11px] text-[#f5efe6] truncate font-medium">
                    {colorName}
                  </span>
                </div>
                <span className="text-[10px] text-[#e0b973] uppercase tracking-wider shrink-0">
                  {colorFamily}
                </span>
              </div>
            </div>

            {/* Step 1 Controls: Dropzone + Camera + Cutout Tuning */}
            <div className="flex flex-col justify-between gap-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileChosen(e.dataTransfer.files?.[0]);
                }}
                className={`rounded-xl border border-dashed p-3.5 text-center transition-colors ${
                  isDragging
                    ? 'border-[#e0b973] bg-[#2f251c]'
                    : 'border-[#f5efe6]/20 bg-[#181512]/70 hover:border-[#e0b973]/50'
                }`}
              >
                <ImagePlus className="w-5 h-5 text-[#e0b973] mx-auto mb-1.5" aria-hidden="true" />
                <p className="text-xs font-medium text-[#f5efe6]">
                  Drop a clothing photo or choose below
                </p>
                <p className="text-[11px] text-[#baa995] mt-0.5">
                  Removes background, tight-crops padding &amp; auto-fits mannequin
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e0b973] hover:bg-[#ebd09a] text-[#181512] font-semibold text-[11px] cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{activePreviewUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#261f1a] hover:bg-[#312821] border border-[#f5efe6]/15 text-[#f5efe6] font-medium text-[11px] cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#e0b973]" aria-hidden="true" />
                    <span>Camera</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Upload clothing photo file"
                  className="hidden"
                  onChange={(e) => handleFileChosen(e.target.files?.[0])}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label="Capture clothing photo with camera"
                  className="hidden"
                  onChange={(e) => handleFileChosen(e.target.files?.[0])}
                />
              </div>

              {/* Cutout Mode & Edge Sensitivity */}
              <div className="rounded-xl bg-[#181512]/80 border border-[#f5efe6]/10 p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#e6dccf]">
                    <Scissors className="w-3.5 h-3.5 text-[#e0b973]" aria-hidden="true" />
                    <span>Cutout Style</span>
                  </span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#261f1a]">
                    <button
                      type="button"
                      onClick={() => setCutoutMode('transparent')}
                      className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer ${
                        cutoutMode === 'transparent'
                          ? 'bg-[#e0b973] text-[#181512] font-semibold'
                          : 'text-[#cabda9]'
                      }`}
                    >
                      Auto Cutout
                    </button>
                    <button
                      type="button"
                      onClick={() => setCutoutMode('rounded-card')}
                      className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer ${
                        cutoutMode === 'rounded-card'
                          ? 'bg-[#e0b973] text-[#181512] font-semibold'
                          : 'text-[#cabda9]'
                      }`}
                    >
                      Clean Card
                    </button>
                  </div>
                </div>

                {selectedFile && cutoutMode === 'transparent' && (
                  <label className="block space-y-1">
                    <div className="flex justify-between text-[10px] text-[#baa995] tabular-nums">
                      <span>Background Sensitivity</span>
                      <span>{sensitivity}</span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={78}
                      step={2}
                      value={sensitivity}
                      onChange={(e) => {
                        const val = Number.parseInt(e.target.value, 10);
                        setSensitivity(val);
                        void runImageProcessing(selectedFile, val);
                      }}
                      className="w-full accent-[#e0b973] cursor-pointer"
                    />
                  </label>
                )}
              </div>

              {errorMsg && (
                <p className="text-[11px] text-rose-400 font-medium">{errorMsg}</p>
              )}
            </div>
          </div>

          {/* Step 2: Quick Garment Tagging Form */}
          <div className="space-y-3 pt-1 border-t border-[#f5efe6]/10">
            <label className="block space-y-1">
              <span className="text-[#d4c8b8] font-medium">Item Name</span>
              <input
                type="text"
                required
                placeholder="e.g., My Black Zip Hoodie, Maroon Linen Shirt"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#181512] border border-[#f5efe6]/15 text-[#f5efe6] placeholder:text-[#7c6f60] focus:outline-none focus:ring-2 focus:ring-[#e0b973]"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block space-y-1">
                <span className="text-[#d4c8b8] font-medium">Closet Section &amp; Rail</span>
                <select
                  value={railTab}
                  onChange={(e) =>
                    handleRailChange(e.target.value as RailSubcategory)
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#181512] border border-[#f5efe6]/15 text-[#f5efe6] focus:outline-none focus:ring-2 focus:ring-[#e0b973]"
                >
                  <optgroup label="Upperwear">
                    {RAIL_OPTIONS.filter((r) => r.group === 'Upperwear').map((r) => (
                      <option key={r.tab} value={r.tab}>
                        {r.tab}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Bottomwear">
                    {RAIL_OPTIONS.filter((r) => r.group === 'Bottomwear').map((r) => (
                      <option key={r.tab} value={r.tab}>
                        {r.tab}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Footwear">
                    {RAIL_OPTIONS.filter((r) => r.group === 'Footwear').map((r) => (
                      <option key={r.tab} value={r.tab}>
                        {r.tab}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[#d4c8b8] font-medium">Fit Type</span>
                <select
                  value={fitPref}
                  onChange={(e) => setFitPref(e.target.value as FitPreference)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181512] border border-[#f5efe6]/15 text-[#f5efe6] focus:outline-none focus:ring-2 focus:ring-[#e0b973]"
                >
                  {FIT_OPTIONS.map((f) => (
                    <option key={f.label} value={f.label}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[#d4c8b8] font-medium">Occasion Tag</span>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value as OccasionTag)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181512] border border-[#f5efe6]/15 text-[#f5efe6] focus:outline-none focus:ring-2 focus:ring-[#e0b973]"
                >
                  {OCCASION_OPTIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {activeRailOpt.group === 'Upperwear' && activeRailOpt.category !== 'Outerwear' && (
              <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#181512]/70 border border-[#f5efe6]/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowLayering}
                  onChange={(e) => setAllowLayering(e.target.checked)}
                  className="accent-[#e0b973] rounded cursor-pointer"
                />
                <Layers className="w-3.5 h-3.5 text-[#e0b973]" aria-hidden="true" />
                <span className="text-[11px] text-[#e6dccf]">
                  Allow layering over a base tee (ideal for zip hoodies &amp; overshirts)
                </span>
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f5efe6]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#261f1a] text-[#e6dccf] font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !name.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#e0b973] hover:bg-[#ebd09a] text-[#181512] font-semibold disabled:opacity-45 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{editingItem ? 'Save Changes' : 'Hang in My Wardrobe'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
