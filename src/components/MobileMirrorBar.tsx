import React, { useState } from 'react';
import { ChevronUp, Eye, Shuffle, X } from 'lucide-react';
import {
  BodyTypeId,
  GarmentTransform,
  MirrorLighting,
  OutfitSlots,
  SlotKey,
  WardrobeItem,
  WardrobeProfile,
} from '../types/wardrobe';
import { FitCheckEvaluation } from '../utils/fitCheckScore';
import { ColorHarmonyResult } from '../utils/wardrobeStyling';
import { SmartMirrorPanel } from './SmartMirrorPanel';
import { StylingDrawerPanel } from './StylingDrawerPanel';

interface MobileMirrorBarProps {
  slots: OutfitSlots;
  profile: WardrobeProfile;
  harmony: ColorHarmonyResult;
  fitEvaluation: FitCheckEvaluation;
  savedCount: number;
  isExporting: boolean;
  hasSuspendedOuterLayer: boolean;
  onChangeLighting: (lighting: MirrorLighting) => void;
  onClearSlot: (slot: SlotKey) => void;
  onClearAll: () => void;
  onExportPng: () => void;
  onShuffleOutfit: () => void;
  onUpdateProfile: (patch: Partial<WardrobeProfile>) => void;
  onToggleOuterLayerVisibility: () => void;
  onSaveLook: () => void;
  onOpenSavedLooks: () => void;
  onOpenAiStylist: () => void;
  onOpenMoodboard: () => void;
  onApplySwap: (item: WardrobeItem) => void;
  onUpdateGarmentTransform?: (itemId: string, transform: GarmentTransform) => void;
}

export const MobileMirrorBar: React.FC<MobileMirrorBarProps> = ({
  slots,
  profile,
  harmony,
  fitEvaluation,
  savedCount,
  isExporting,
  hasSuspendedOuterLayer,
  onChangeLighting,
  onClearSlot,
  onClearAll,
  onExportPng,
  onShuffleOutfit,
  onUpdateProfile,
  onToggleOuterLayerVisibility,
  onSaveLook,
  onOpenSavedLooks,
  onOpenAiStylist,
  onOpenMoodboard,
  onApplySwap,
  onUpdateGarmentTransform,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [sheetTab, setSheetTab] = useState<'mirror' | 'styling'>('mirror');

  const equippedList = Object.values(slots).filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );

  return (
    <div className="md:hidden">
      {/* Compact Floating Bottom Mirror Preview Bar (<= 15% mobile height) */}
      <div
        data-testid="mobile-mirror-bar"
        className="fixed bottom-0 inset-x-0 z-30 bg-[#181512]/95 backdrop-blur-lg border-t border-[#e0b973]/30 px-3 py-2 shadow-[0_-10px_30px_rgba(0,0,0,0.65)]"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setSheetTab('mirror');
              setExpanded(true);
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
          >
            <div className="flex -space-x-1.5 shrink-0">
              {equippedList.length > 0 ? (
                equippedList.slice(0, 4).map((item) => (
                  <span
                    key={item.id}
                    className="w-6 h-6 rounded-full border border-[#f5efe6]/40 shadow-sm"
                    style={{ backgroundColor: item.colorHex }}
                    aria-hidden="true"
                  />
                ))
              ) : (
                <span className="w-6 h-6 rounded-full border border-[#e0b973]/40 bg-[#261f1a]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#f5efe6] truncate">
                {fitEvaluation.overallScore}% · {fitEvaluation.badgeLabel}
              </p>
              <p className="text-[11px] text-[#baa995] truncate">
                {equippedList.length} layers · {profile.lighting}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onShuffleOutfit}
              aria-label="Shuffle Fit on mobile"
              className="p-2.5 rounded-xl bg-[#261f1a] border border-[#f5efe6]/15 text-[#e0b973] cursor-pointer"
            >
              <Shuffle className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-[#e0b973] text-[#181512] text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Mirror Preview</span>
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Bottom Sheet for Smart Mirror & Fit Drawer */}
      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Smart Mirror and Styling Drawer"
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col justify-end"
        >
          <div className="h-[88vh] rounded-t-2xl bg-[#181512] border-t border-[#e0b973]/30 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f5efe6]/10 flex items-center justify-between gap-2">
              <div
                role="tablist"
                aria-label="Mobile mirror and styling views"
                className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#261f1a] flex-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={sheetTab === 'mirror'}
                  onClick={() => setSheetTab('mirror')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    sheetTab === 'mirror'
                      ? 'bg-[#e0b973] text-[#181512]'
                      : 'text-[#d4c8b8]'
                  }`}
                >
                  Smart Mirror
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={sheetTab === 'styling'}
                  onClick={() => setSheetTab('styling')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    sheetTab === 'styling'
                      ? 'bg-[#e0b973] text-[#181512]'
                      : 'text-[#d4c8b8]'
                  }`}
                >
                  Fit &amp; Skin Tone
                </button>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Collapse mobile smart mirror"
                className="p-2 rounded-lg bg-[#261f1a] text-[#f5efe6]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {sheetTab === 'mirror' ? (
                <SmartMirrorPanel
                  slots={slots}
                  lighting={profile.lighting}
                  skinTone={profile.skinTone}
                  fitPreference={profile.fitPreference}
                  bodyType={profile.bodyType}
                  fitEvaluation={fitEvaluation}
                  isExporting={isExporting}
                  onChangeLighting={onChangeLighting}
                  onChangeBodyType={(bodyType: BodyTypeId) =>
                    onUpdateProfile({ bodyType })
                  }
                  onClearSlot={onClearSlot}
                  onClearAll={onClearAll}
                  onShuffleFit={onShuffleOutfit}
                  onExportPng={onExportPng}
                  onApplySwap={onApplySwap}
                  onOpenMoodboard={() => {
                    setExpanded(false);
                    onOpenMoodboard();
                  }}
                  onUpdateGarmentTransform={onUpdateGarmentTransform}
                />
              ) : (
                <StylingDrawerPanel
                  profile={profile}
                  slots={slots}
                  harmony={harmony}
                  savedCount={savedCount}
                  onUpdateProfile={onUpdateProfile}
                  onToggleOuterLayerVisibility={onToggleOuterLayerVisibility}
                  hasSuspendedOuterLayer={hasSuspendedOuterLayer}
                  onSaveLook={() => {
                    setExpanded(false);
                    onSaveLook();
                  }}
                  onOpenSavedLooks={() => {
                    setExpanded(false);
                    onOpenSavedLooks();
                  }}
                  onOpenAiStylist={() => {
                    setExpanded(false);
                    onOpenAiStylist();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
