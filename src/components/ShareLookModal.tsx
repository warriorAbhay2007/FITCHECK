import React, { useEffect, useState } from 'react';
import {
  Camera,
  Check,
  Copy,
  FolderHeart,
  LayoutGrid,
  X,
} from 'lucide-react';
import {
  OutfitSlots,
  SavedOutfit,
  WardrobeProfile,
} from '../types/wardrobe';
import {
  ColorHarmonyResult,
  SKIN_TONE_OPTIONS,
  buildShareCardText,
} from '../utils/wardrobeStyling';
import { MannequinLookPreview } from './MannequinLookPreview';

interface ShareLookModalProps {
  savedOutfit: SavedOutfit | null;
  slots: OutfitSlots;
  harmony: ColorHarmonyResult;
  profile: WardrobeProfile;
  isExporting: boolean;
  onClose: () => void;
  onExportPng: (title?: string) => void;
  onOpenSavedLooks: () => void;
  onOpenMoodboard?: () => void;
}

export const ShareLookModal: React.FC<ShareLookModalProps> = ({
  savedOutfit,
  slots,
  harmony,
  profile,
  isExporting,
  onClose,
  onExportPng,
  onOpenSavedLooks,
  onOpenMoodboard,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!savedOutfit) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [savedOutfit, onClose]);

  if (!savedOutfit) return null;

  const skinLabel =
    SKIN_TONE_OPTIONS.find((s) => s.id === profile.skinTone)?.label ??
    'Wheatish';

  const handleCopySummary = async () => {
    const text = buildShareCardText(
      savedOutfit.title,
      slots,
      harmony,
      profile,
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback silently skipped if restricted
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-look-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#1f1915] border border-[#e0b973]/35 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#f5efe6]/10 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#e0b973] font-medium">
              Saved to Wardrobe
            </p>
            <h2
              id="share-look-title"
              className="font-display text-2xl font-semibold text-[#f5efe6]"
            >
              {savedOutfit.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share look summary card"
            className="p-2 rounded-lg text-[#baa995] hover:text-[#f5efe6] hover:bg-[#2a221c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Share Card Preview */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-4 p-4 rounded-xl bg-[#181512] border border-[#e0b973]/25">
            <div className="h-44 sm:h-full rounded-xl bg-[#13100d] border border-[#f5efe6]/10 flex items-center justify-center p-2">
              <MannequinLookPreview
                slots={slots}
                skinTone={profile.skinTone}
                fitPreference={profile.fitPreference}
                lighting={profile.lighting}
                animateChanges={false}
              />
            </div>

            <div className="space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#f5efe6]/10">
                <span className="text-xs text-[#cbbca8]">
                  {skinLabel} · {profile.undertone} · Size {profile.size}
                </span>
                <span className="font-mono text-sm font-semibold text-[#e0b973] tabular-nums">
                  {harmony.score}% Harmony
                </span>
              </div>

              <ul className="space-y-2">
                {savedOutfit.snapshotItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                        style={{ backgroundColor: item.colorHex }}
                        aria-hidden="true"
                      />
                      <span className="text-[#f5efe6] font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#baa995] shrink-0">
                      {item.category}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="text-[11px] text-[#cbbca8] pt-2 border-t border-[#f5efe6]/10 leading-relaxed">
                {harmony.tip}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onExportPng(savedOutfit.title)}
              disabled={isExporting}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#e0b973] hover:bg-[#ebd09a] text-[#181512] font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Camera className="w-4 h-4" aria-hidden="true" />
              <span>{isExporting ? 'Generating PNG…' : 'Download PNG Card'}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopySummary()}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#261f1a] hover:bg-[#312821] border border-[#f5efe6]/15 text-xs font-medium text-[#f5efe6] transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#e0b973]" aria-hidden="true" />
                  <span>Copy Card</span>
                </>
              )}
            </button>

            {onOpenMoodboard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMoodboard();
                }}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#261f1a] hover:bg-[#312821] border border-[#e0b973]/30 text-xs font-medium text-[#e0b973] transition-colors cursor-pointer whitespace-nowrap"
              >
                <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Moodboard</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSavedLooks();
              }}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#261f1a] hover:bg-[#312821] border border-[#f5efe6]/15 text-xs font-medium text-[#f5efe6] transition-colors cursor-pointer whitespace-nowrap"
            >
              <FolderHeart className="w-3.5 h-3.5 text-[#e0b973]" aria-hidden="true" />
              <span>All Saved</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
