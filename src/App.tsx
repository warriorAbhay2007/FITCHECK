import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, DoorClosed, RotateCcw } from 'lucide-react';
import { AddMyClothesModal } from './components/AddMyClothesModal';
import { ClosetRailsZone } from './components/ClosetRailsZone';
import { MobileMirrorBar } from './components/MobileMirrorBar';
import { MoodboardModal } from './components/MoodboardModal';
import { SavedLooksDrawer } from './components/SavedLooksDrawer';
import { ShareLookModal } from './components/ShareLookModal';
import { SmartMirrorPanel } from './components/SmartMirrorPanel';
import { StylingDrawerPanel } from './components/StylingDrawerPanel';
import { StylistChatDrawer } from './components/StylistChatDrawer';
import { WardrobeDoorsOverlay } from './components/WardrobeDoorsOverlay';
import { TRENDING_DROPS } from './data/seedData';
import {
  ClosetSourceFilter,
  GarmentTransform,
  OccasionFilter,
  OutfitSlots,
  SavedOutfit,
  SlotKey,
  WardrobeItem,
  WardrobeProfile,
} from './types/wardrobe';
import { exportOutfitCanvasAsPng } from './utils/exportOutfitPng';
import { evaluateFitCheck } from './utils/fitCheckScore';
import {
  deletePersonalGarment,
  loadPersonalGarments,
  upsertPersonalGarment,
} from './utils/personalWardrobeDb';
import {
  loadBudget,
  loadSavedOutfits,
  loadWardrobe,
  loadWardrobeProfile,
  resetAllDemoData,
  saveSavedOutfits,
  saveWardrobe,
  saveWardrobeProfile,
} from './utils/storage';
import { isTrendingDrop } from './utils/wardrobeLogic';
import {
  SKIN_TONE_OPTIONS,
  applyGarmentSelection,
  computeColorHarmony,
  shuffleWardrobeOutfit,
} from './utils/wardrobeStyling';

function buildInitialSlots(wardrobe: WardrobeItem[]): OutfitSlots {
  const findFirst = (cat: WardrobeItem['category']) =>
    wardrobe.find((item) => item.category === cat) ?? null;

  return {
    outerwear: findFirst('Outerwear'),
    top: findFirst('Tops'),
    bottom: findFirst('Bottoms'),
    footwear: findFirst('Footwear'),
  };
}

function shouldAutoOpenWardrobe(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1';
}

export default function App() {
  const [isDoorsOpen, setIsDoorsOpen] = useState<boolean>(() =>
    shouldAutoOpenWardrobe(),
  );

  const [catalogWardrobe, setCatalogWardrobe] = useState<WardrobeItem[]>(() =>
    loadWardrobe(),
  );
  const [personalGarments, setPersonalGarments] = useState<WardrobeItem[]>([]);
  const wardrobe = useMemo(
    () => [...personalGarments, ...catalogWardrobe],
    [personalGarments, catalogWardrobe],
  );

  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(() =>
    loadSavedOutfits(),
  );
  const [profile, setProfile] = useState<WardrobeProfile>(() =>
    loadWardrobeProfile(),
  );
  const [slots, setSlots] = useState<OutfitSlots>(() =>
    buildInitialSlots(loadWardrobe()),
  );
  const [suspendedOuterwear, setSuspendedOuterwear] =
    useState<WardrobeItem | null>(null);

  const [occasionFilter, setOccasionFilter] = useState<OccasionFilter>('All');
  const [closetSource, setClosetSource] = useState<ClosetSourceFilter>('all');
  const [isAddGarmentOpen, setIsAddGarmentOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<WardrobeItem | null>(
    null,
  );
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isStylistChatOpen, setIsStylistChatOpen] = useState(false);
  const [isMoodboardOpen, setIsMoodboardOpen] = useState(false);
  const [shareModalOutfit, setShareModalOutfit] = useState<SavedOutfit | null>(
    null,
  );
  const [isExporting, setIsExporting] = useState(false);

  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const budget = useMemo(() => loadBudget(), []);

  useEffect(() => {
    let cancelled = false;
    loadPersonalGarments().then((items) => {
      if (!cancelled && items.length > 0) {
        setPersonalGarments(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveWardrobe(catalogWardrobe);
  }, [catalogWardrobe]);

  useEffect(() => {
    saveSavedOutfits(savedOutfits);
  }, [savedOutfits]);

  useEffect(() => {
    saveWardrobeProfile(profile);
  }, [profile]);

  const fitEvaluation = useMemo(
    () => evaluateFitCheck(slots, profile, wardrobe),
    [slots, profile, wardrobe],
  );
  const harmony = fitEvaluation.harmony;

  const handleUpdateProfile = (patch: Partial<WardrobeProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      if (patch.layerOverBase === false && prev.layerOverBase && slots.outerwear) {
        if (!isTrendingDrop(slots.outerwear)) {
          setSuspendedOuterwear(slots.outerwear);
        }
        setSlots((s) => ({ ...s, outerwear: null }));
      } else if (
        patch.layerOverBase === true &&
        !prev.layerOverBase &&
        !slots.outerwear &&
        suspendedOuterwear
      ) {
        setSlots((s) => ({ ...s, outerwear: suspendedOuterwear }));
        setSuspendedOuterwear(null);
      }
      return next;
    });
  };

  const handleToggleLayerOverBase = () => {
    handleUpdateProfile({ layerOverBase: !profile.layerOverBase });
  };

  const handleSelectItem = (item: WardrobeItem) => {
    setSlots((prev) => applyGarmentSelection(prev, item, profile.layerOverBase));
    setSuspendedOuterwear(null);
  };

  const handleApplySwap = (item: WardrobeItem) => {
    setSlots((prev) => applyGarmentSelection(prev, item, true));
    setSuspendedOuterwear(null);
  };

  const handleToggleOuterLayerVisibility = () => {
    if (slots.outerwear) {
      if (!isTrendingDrop(slots.outerwear)) {
        setSuspendedOuterwear(slots.outerwear);
      }
      setSlots((prev) => ({ ...prev, outerwear: null }));
      return;
    }
    if (suspendedOuterwear) {
      setProfile((p) => ({ ...p, layerOverBase: true }));
      setSlots((prev) => ({ ...prev, outerwear: suspendedOuterwear }));
      setSuspendedOuterwear(null);
    }
  };

  const handleClearSlot = (slot: SlotKey) => {
    if (slot === 'outerwear' && slots.outerwear && !isTrendingDrop(slots.outerwear)) {
      setSuspendedOuterwear(slots.outerwear);
    }
    setSlots((prev) => ({ ...prev, [slot]: null }));
  };

  const handleClearAll = () => {
    setSlots({
      outerwear: null,
      top: null,
      bottom: null,
      footwear: null,
    });
    setSuspendedOuterwear(null);
  };

  const handleShuffleOutfit = () => {
    const nextSlots = shuffleWardrobeOutfit(
      wardrobe,
      slots,
      profile.layerOverBase,
      occasionFilter,
    );
    setSlots(nextSlots);
    setSuspendedOuterwear(null);
  };

  const handleSavePersonalGarment = (item: WardrobeItem) => {
    const isEdit = personalGarments.some((g) => g.id === item.id);
    setPersonalGarments((prev) => {
      const idx = prev.findIndex((g) => g.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
    void upsertPersonalGarment(item);

    if (isEdit) {
      setSlots((prev) => ({
        outerwear: prev.outerwear?.id === item.id ? item : prev.outerwear,
        top: prev.top?.id === item.id ? item : prev.top,
        bottom: prev.bottom?.id === item.id ? item : prev.bottom,
        footwear: prev.footwear?.id === item.id ? item : prev.footwear,
      }));
    } else {
      handleSelectItem(item);
    }
    setEditingGarment(null);
  };

  const handleDeletePersonalGarment = (item: WardrobeItem) => {
    setPersonalGarments((prev) => prev.filter((g) => g.id !== item.id));
    void deletePersonalGarment(item.id);
    setSlots((prev) => ({
      outerwear: prev.outerwear?.id === item.id ? null : prev.outerwear,
      top: prev.top?.id === item.id ? null : prev.top,
      bottom: prev.bottom?.id === item.id ? null : prev.bottom,
      footwear: prev.footwear?.id === item.id ? null : prev.footwear,
    }));
    if (suspendedOuterwear?.id === item.id) {
      setSuspendedOuterwear(null);
    }
  };

  const handleUpdateGarmentTransform = (
    itemId: string,
    transform: GarmentTransform,
  ) => {
    let updatedPersonal: WardrobeItem | null = null;
    setPersonalGarments((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        updatedPersonal = { ...item, mirrorTransform: transform };
        return updatedPersonal;
      }),
    );

    if (updatedPersonal) {
      void upsertPersonalGarment(updatedPersonal);
    } else {
      // Also check personalGarments synchronously in case React batches state
      const match = personalGarments.find((g) => g.id === itemId);
      if (match) {
        void upsertPersonalGarment({ ...match, mirrorTransform: transform });
      }
    }

    setSlots((prev) => ({
      outerwear:
        prev.outerwear?.id === itemId
          ? { ...prev.outerwear, mirrorTransform: transform }
          : prev.outerwear,
      top:
        prev.top?.id === itemId
          ? { ...prev.top, mirrorTransform: transform }
          : prev.top,
      bottom:
        prev.bottom?.id === itemId
          ? { ...prev.bottom, mirrorTransform: transform }
          : prev.bottom,
      footwear:
        prev.footwear?.id === itemId
          ? { ...prev.footwear, mirrorTransform: transform }
          : prev.footwear,
    }));
  };

  const handleSaveLook = () => {
    const equippedEntries = (
      Object.values(slots) as (WardrobeItem | typeof TRENDING_DROPS[number] | null)[]
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    if (equippedEntries.length === 0) return;

    const skinLabel =
      SKIN_TONE_OPTIONS.find((s) => s.id === profile.skinTone)?.label ??
      'Wheatish';
    const contextLabel =
      occasionFilter === 'All' ? 'Curated Wardrobe' : occasionFilter;
    const autoTitle = slots.outerwear
      ? `${slots.outerwear.name.split(' ').slice(-2).join(' ')} & ${slots.top ? slots.top.colorName : 'Layer'} Look`
      : slots.top
        ? `${slots.top.colorName} ${slots.top.name.split(' ').slice(-1)[0]} Fit`
        : 'Saved FitCheck Look';

    const newOutfit: SavedOutfit = {
      id: `saved-${Date.now()}`,
      title: autoTitle,
      contextTag: contextLabel,
      notes: `${skinLabel} (${profile.undertone}) · Size ${profile.size} ${profile.fitPreference} · ${harmony.tip}`,
      createdAt: new Date().toISOString(),
      harmonyScore: harmony.score,
      lighting: profile.lighting,
      slots: {
        outerwearId: slots.outerwear?.id ?? null,
        topId: slots.top?.id ?? null,
        bottomId: slots.bottom?.id ?? null,
        footwearId: slots.footwear?.id ?? null,
      },
      snapshotItems: equippedEntries.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        colorHex: item.colorHex,
        colorName: item.colorName,
        silhouette: item.silhouette,
        imageUrl: item.imageUrl,
        isDrop: isTrendingDrop(item),
        priceInr: item.priceInr,
      })),
    };

    setSavedOutfits((prev) => [newOutfit, ...prev]);
    setShareModalOutfit(newOutfit);
  };

  const handleLoadOutfit = (outfit: SavedOutfit) => {
    const resolveItem = (id: string | null) => {
      if (!id) return null;
      return (
        wardrobe.find((w) => w.id === id) ??
        TRENDING_DROPS.find((d) => d.id === id) ??
        null
      );
    };

    setSlots({
      outerwear: resolveItem(outfit.slots.outerwearId),
      top: resolveItem(outfit.slots.topId),
      bottom: resolveItem(outfit.slots.bottomId),
      footwear: resolveItem(outfit.slots.footwearId),
    });
  };

  const handleDeleteSavedOutfit = (id: string) => {
    setSavedOutfits((prev) => prev.filter((o) => o.id !== id));
  };

  const handleExportPng = async (title?: string) => {
    if (!mirrorRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportOutfitCanvasAsPng(mirrorRef.current, {
        lookTitle: title ?? 'FitCheck Look',
        contextTag: occasionFilter,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetDemo = () => {
    const fresh = resetAllDemoData();
    setCatalogWardrobe(fresh.wardrobe);
    setSavedOutfits(fresh.savedOutfits);
    setProfile(fresh.profile);
    setSlots(buildInitialSlots(fresh.wardrobe));
    setOccasionFilter('All');
    setClosetSource('all');
    setSuspendedOuterwear(null);
  };

  return (
    <div
      data-wardrobe-open={isDoorsOpen}
      className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-[#181512] text-[#f5efe6] relative overflow-x-hidden"
    >
      {/* 3D Double-Door Wardrobe Landing Screen */}
      <WardrobeDoorsOverlay
        isOpen={isDoorsOpen}
        onOpen={() => setIsDoorsOpen(true)}
      />

      {/* Open Closet Top Architectural Rail */}
      <header className="border-b border-[#e0b973]/20 bg-[#14110e]/95 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <span className="font-display text-lg sm:text-2xl font-semibold tracking-tight text-[#f5efe6] whitespace-nowrap">
              FitCheck AI
            </span>
            <span className="hidden md:inline text-xs text-[#baa995] truncate">
              Virtual Wardrobe · {wardrobe.length} pieces
              {personalGarments.length > 0
                ? ` (${personalGarments.length} yours)`
                : ''}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSavedDrawerOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#261f1a] hover:bg-[#312821] border border-[#f5efe6]/15 text-[11px] sm:text-xs font-medium text-[#f5efe6] transition-colors cursor-pointer whitespace-nowrap tabular-nums"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#e0b973]" aria-hidden="true" />
              <span>Saved ({savedOutfits.length})</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              aria-label="Reset wardrobe to default pieces"
              title="Reset catalog & settings"
              className="p-1.5 sm:p-2 rounded-lg bg-[#261f1a] hover:bg-[#312821] border border-[#f5efe6]/10 text-[#cbbca8] hover:text-[#f5efe6] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setIsDoorsOpen(false)}
              aria-label="Close Doors"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#261f1a] hover:bg-[#332922] border border-[#e0b973]/30 text-[11px] sm:text-xs font-medium text-[#e0b973] transition-colors cursor-pointer whitespace-nowrap"
            >
              <DoorClosed className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Close Doors</span>
            </button>
          </div>
        </div>
      </header>

      {/* Open Wardrobe Interior Workspace */}
      <main className="flex-1 min-h-0 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-3 pb-24 md:pb-3 grid grid-cols-1 md:grid-cols-[325px_minmax(0,1fr)] lg:grid-cols-[348px_minmax(0,1fr)_350px] lg:grid-rows-[minmax(0,1fr)] gap-4">
        {/* Left Wing — Full-Length Smart Mirror (>= 768px) */}
        <div className="hidden md:block h-full min-h-0">
          <SmartMirrorPanel
            slots={slots}
            lighting={profile.lighting}
            skinTone={profile.skinTone}
            fitPreference={profile.fitPreference}
            bodyType={profile.bodyType}
            fitEvaluation={fitEvaluation}
            mirrorRef={mirrorRef}
            isExporting={isExporting}
            onChangeLighting={(lighting) => handleUpdateProfile({ lighting })}
            onChangeBodyType={(bodyType) => handleUpdateProfile({ bodyType })}
            onClearSlot={handleClearSlot}
            onClearAll={handleClearAll}
            onShuffleFit={handleShuffleOutfit}
            onExportPng={() => void handleExportPng()}
            onApplySwap={handleApplySwap}
            onOpenMoodboard={() => setIsMoodboardOpen(true)}
            onUpdateGarmentTransform={handleUpdateGarmentTransform}
          />
        </div>

        {/* Center Zone — Categorized Hanging Rails & Shoe Rack */}
        <div className="h-full min-h-0">
          <ClosetRailsZone
            items={wardrobe}
            slots={slots}
            occasionFilter={occasionFilter}
            closetSource={closetSource}
            personalCount={personalGarments.length}
            layerOverBase={profile.layerOverBase}
            onChangeOccasion={setOccasionFilter}
            onChangeClosetSource={setClosetSource}
            onToggleLayerOverBase={handleToggleLayerOverBase}
            onSelectItem={handleSelectItem}
            onOpenAddGarment={() => {
              setEditingGarment(null);
              setIsAddGarmentOpen(true);
            }}
            onEditItem={(item) => {
              setEditingGarment(item);
              setIsAddGarmentOpen(true);
            }}
            onDeleteItem={handleDeletePersonalGarment}
          />
        </div>

        {/* Right Wing — Fit, Size & Skin-Tone Panel (>= 768px) */}
        <div className="hidden md:block md:col-span-2 lg:col-span-1 h-full min-h-0">
          <StylingDrawerPanel
            profile={profile}
            slots={slots}
            harmony={harmony}
            savedCount={savedOutfits.length}
            onUpdateProfile={handleUpdateProfile}
            onToggleOuterLayerVisibility={handleToggleOuterLayerVisibility}
            hasSuspendedOuterLayer={suspendedOuterwear !== null}
            onSaveLook={handleSaveLook}
            onOpenSavedLooks={() => setIsSavedDrawerOpen(true)}
            onOpenAiStylist={() => setIsStylistChatOpen(true)}
          />
        </div>
      </main>

      {/* Mobile Sticky Collapsible Mirror Preview Bar (< 768px) */}
      <MobileMirrorBar
        slots={slots}
        profile={profile}
        harmony={harmony}
        fitEvaluation={fitEvaluation}
        savedCount={savedOutfits.length}
        isExporting={isExporting}
        hasSuspendedOuterLayer={suspendedOuterwear !== null}
        onChangeLighting={(lighting) => handleUpdateProfile({ lighting })}
        onClearSlot={handleClearSlot}
        onClearAll={handleClearAll}
        onExportPng={() => void handleExportPng()}
        onShuffleOutfit={handleShuffleOutfit}
        onUpdateProfile={handleUpdateProfile}
        onToggleOuterLayerVisibility={handleToggleOuterLayerVisibility}
        onSaveLook={handleSaveLook}
        onOpenSavedLooks={() => setIsSavedDrawerOpen(true)}
        onOpenAiStylist={() => setIsStylistChatOpen(true)}
        onOpenMoodboard={() => setIsMoodboardOpen(true)}
        onApplySwap={handleApplySwap}
        onUpdateGarmentTransform={handleUpdateGarmentTransform}
      />

      {/* Modals & Drawers */}
      <ShareLookModal
        savedOutfit={shareModalOutfit}
        slots={slots}
        harmony={harmony}
        profile={profile}
        isExporting={isExporting}
        onClose={() => setShareModalOutfit(null)}
        onExportPng={(title) => void handleExportPng(title)}
        onOpenSavedLooks={() => setIsSavedDrawerOpen(true)}
        onOpenMoodboard={() => setIsMoodboardOpen(true)}
      />

      <MoodboardModal
        isOpen={isMoodboardOpen}
        slots={slots}
        profile={profile}
        fitEvaluation={fitEvaluation}
        onClose={() => setIsMoodboardOpen(false)}
      />

      <AddMyClothesModal
        isOpen={isAddGarmentOpen}
        editingItem={editingGarment}
        onClose={() => {
          setIsAddGarmentOpen(false);
          setEditingGarment(null);
        }}
        onSave={handleSavePersonalGarment}
      />

      <SavedLooksDrawer
        isOpen={isSavedDrawerOpen}
        savedOutfits={savedOutfits}
        onClose={() => setIsSavedDrawerOpen(false)}
        onLoadOutfit={handleLoadOutfit}
        onDeleteOutfit={handleDeleteSavedOutfit}
      />

      <StylistChatDrawer
        isOpen={isStylistChatOpen}
        wardrobe={wardrobe}
        slots={slots}
        activeDrop={null}
        monthlyLimitInr={budget.monthlyLimitInr}
        remainingBudgetInr={budget.monthlyLimitInr - budget.spentInr}
        onClose={() => setIsStylistChatOpen(false)}
      />
    </div>
  );
}
