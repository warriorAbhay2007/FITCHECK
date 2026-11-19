import { useEffect, useMemo, useState } from 'react';
import { Layers, Shirt, Sparkles } from 'lucide-react';
import { BudgetTracker } from './components/BudgetTracker';
import { OutfitCanvas } from './components/OutfitCanvas';
import { SavedLooksDrawer } from './components/SavedLooksDrawer';
import { StylistChatDrawer } from './components/StylistChatDrawer';
import { TrendingDropsFeed } from './components/TrendingDropsFeed';
import { VerdictModal } from './components/VerdictModal';
import { WardrobeSidebar } from './components/WardrobeSidebar';
import { TRENDING_DROPS } from './data/seedData';
import {
  BudgetState,
  OutfitSlots,
  SavedOutfit,
  SlotKey,
  TrendingDrop,
  WardrobeItem,
} from './types/wardrobe';
import {
  loadBudget,
  loadSavedOutfits,
  loadWardrobe,
  resetAllDemoData,
  saveBudget,
  saveSavedOutfits,
  saveWardrobe,
} from './utils/storage';
import {
  CATEGORY_TO_SLOT,
  areItemsCompatible,
  calculateUnlockedOutfits,
  computeShoppingVerdict,
  getCompatibleWardrobeIds,
  isTrendingDrop,
} from './utils/wardrobeLogic';

type MobileTab = 'wardrobe' | 'canvas' | 'drops';

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

export default function App() {
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(() => loadWardrobe());
  const [budget, setBudget] = useState<BudgetState>(() => loadBudget());
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(() =>
    loadSavedOutfits(),
  );

  const [slots, setSlots] = useState<OutfitSlots>(() =>
    buildInitialSlots(loadWardrobe()),
  );
  const [activeFocusSlot, setActiveFocusSlot] = useState<SlotKey>('top');
  const [mobileTab, setMobileTab] = useState<MobileTab>('canvas');

  const [verdictModalDrop, setVerdictModalDrop] = useState<TrendingDrop | null>(
    null,
  );
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isStylistChatOpen, setIsStylistChatOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    saveWardrobe(wardrobe);
  }, [wardrobe]);

  useEffect(() => {
    saveBudget(budget);
  }, [budget]);

  useEffect(() => {
    saveSavedOutfits(savedOutfits);
  }, [savedOutfits]);

  const remainingBudgetInr = budget.monthlyLimitInr - budget.spentInr;

  // Determine the currently active item for compatibility highlighting & unlocked count
  const activeDropOnCanvas = useMemo(() => {
    const candidate = (Object.values(slots) as (WardrobeItem | TrendingDrop | null)[])
      .find((item) => isTrendingDrop(item));
    return candidate && isTrendingDrop(candidate) ? candidate : null;
  }, [slots]);

  const activeFocusItem = useMemo(() => {
    if (activeDropOnCanvas) return activeDropOnCanvas;
    if (slots[activeFocusSlot]) return slots[activeFocusSlot];
    return (
      slots.top ??
      slots.bottom ??
      slots.outerwear ??
      slots.footwear ??
      null
    );
  }, [activeDropOnCanvas, slots, activeFocusSlot]);

  const equippedIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(slots).forEach((item) => {
      if (item) ids.add(item.id);
    });
    return ids;
  }, [slots]);

  const compatibleIds = useMemo(
    () => getCompatibleWardrobeIds(activeFocusItem, wardrobe),
    [activeFocusItem, wardrobe],
  );

  const unlockedOutfitsCount = useMemo(() => {
    if (!activeFocusItem) return 0;
    return calculateUnlockedOutfits(activeFocusItem, wardrobe);
  }, [activeFocusItem, wardrobe]);

  const activeDropVerdict = useMemo(() => {
    if (!activeDropOnCanvas) return null;
    return computeShoppingVerdict(
      activeDropOnCanvas,
      wardrobe,
      remainingBudgetInr,
    );
  }, [activeDropOnCanvas, wardrobe, remainingBudgetInr]);

  const modalVerdict = useMemo(() => {
    if (!verdictModalDrop) return null;
    return computeShoppingVerdict(verdictModalDrop, wardrobe, remainingBudgetInr);
  }, [verdictModalDrop, wardrobe, remainingBudgetInr]);

  // Handlers
  const handleSelectWardrobeItem = (item: WardrobeItem) => {
    const slot = CATEGORY_TO_SLOT[item.category];
    setSlots((prev) => ({ ...prev, [slot]: item }));
    setActiveFocusSlot(slot);
    setMobileTab('canvas');
  };

  const handleTestDrop = (drop: TrendingDrop) => {
    const slot = CATEGORY_TO_SLOT[drop.category];
    setSlots((prev) => ({ ...prev, [slot]: drop }));
    setActiveFocusSlot(slot);
    setMobileTab('canvas');
  };

  const handleAddWardrobeItem = (newItem: WardrobeItem) => {
    setWardrobe((prev) => [newItem, ...prev]);
    const slot = CATEGORY_TO_SLOT[newItem.category];
    setSlots((prev) => ({ ...prev, [slot]: newItem }));
    setActiveFocusSlot(slot);
  };

  const handleDeleteWardrobeItem = (id: string) => {
    setWardrobe((prev) => prev.filter((item) => item.id !== id));
    setSlots((prev) => {
      const next = { ...prev };
      (Object.keys(next) as SlotKey[]).forEach((k) => {
        if (next[k]?.id === id) next[k] = null;
      });
      return next;
    });
  };

  const handleClearSlot = (slot: SlotKey) => {
    setSlots((prev) => ({ ...prev, [slot]: null }));
  };

  const handleClearAllSlots = () => {
    setSlots({
      outerwear: null,
      top: null,
      bottom: null,
      footwear: null,
    });
  };

  const handleShuffleCompatibleFit = () => {
    const tops = wardrobe.filter((i) => i.category === 'Tops');
    const bottoms = wardrobe.filter((i) => i.category === 'Bottoms');
    const footwear = wardrobe.filter((i) => i.category === 'Footwear');
    const outerwear = wardrobe.filter((i) => i.category === 'Outerwear');

    if (tops.length === 0 || bottoms.length === 0 || footwear.length === 0) {
      return;
    }

    const pickRandom = <T,>(arr: T[]): T =>
      arr[Math.floor(Math.random() * arr.length)];

    const chosenTop =
      tops.length > 1 && slots.top
        ? pickRandom(tops.filter((t) => t.id !== slots.top?.id))
        : pickRandom(tops);

    const compatBottoms = bottoms.filter((b) => areItemsCompatible(chosenTop, b));
    const chosenBottom = pickRandom(
      compatBottoms.length > 0 ? compatBottoms : bottoms,
    );

    const compatShoes = footwear.filter(
      (f) =>
        areItemsCompatible(chosenTop, f) && areItemsCompatible(chosenBottom, f),
    );
    const chosenShoes = pickRandom(
      compatShoes.length > 0 ? compatShoes : footwear,
    );

    const compatLayers = outerwear.filter(
      (o) =>
        areItemsCompatible(chosenTop, o) && areItemsCompatible(chosenBottom, o),
    );
    const chosenLayer =
      compatLayers.length > 0 ? pickRandom(compatLayers) : null;

    setSlots({
      outerwear: chosenLayer,
      top: chosenTop,
      bottom: chosenBottom,
      footwear: chosenShoes,
    });
    setActiveFocusSlot('top');
  };

  const handleMarkPurchased = (drop: TrendingDrop) => {
    if (budget.purchasedDropIds.includes(drop.id)) return;

    setBudget((prev) => ({
      ...prev,
      spentInr: prev.spentInr + drop.priceInr,
      purchasedDropIds: [...prev.purchasedDropIds, drop.id],
    }));

    const ownedItem: WardrobeItem = {
      id: `owned-${drop.id}`,
      name: drop.name,
      category: drop.category,
      colorName: drop.colorName,
      colorHex: drop.colorHex,
      colorFamily: drop.colorFamily,
      vibe: drop.vibe,
      tags: [...drop.tags],
      fit: drop.fit,
      silhouette: drop.silhouette,
      imageUrl: drop.imageUrl,
      fromDropId: drop.id,
    };

    setWardrobe((prev) => {
      if (prev.some((w) => w.fromDropId === drop.id)) return prev;
      return [ownedItem, ...prev];
    });

    const slot = CATEGORY_TO_SLOT[drop.category];
    setSlots((prev) => {
      if (prev[slot]?.id === drop.id) {
        return { ...prev, [slot]: ownedItem };
      }
      return prev;
    });
  };

  const handleSaveLook = (
    title: string,
    contextTag: string,
    notes: string,
  ) => {
    const equippedEntries = (Object.values(slots) as (WardrobeItem | TrendingDrop | null)[])
      .filter((item): item is WardrobeItem | TrendingDrop => item !== null);

    if (equippedEntries.length === 0) return;

    const newOutfit: SavedOutfit = {
      id: `saved-${Date.now()}`,
      title,
      contextTag,
      notes,
      createdAt: new Date().toISOString(),
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
        priceInr: isTrendingDrop(item) ? item.priceInr : undefined,
      })),
    };

    setSavedOutfits((prev) => [newOutfit, ...prev]);
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
    setMobileTab('canvas');
  };

  const handleDeleteSavedOutfit = (id: string) => {
    setSavedOutfits((prev) => prev.filter((o) => o.id !== id));
  };

  const handleUpdateMonthlyLimit = (newLimit: number) => {
    setBudget((prev) => ({
      ...prev,
      monthlyLimitInr: newLimit,
    }));
  };

  const handleResetDemoData = () => {
    const fresh = resetAllDemoData();
    setWardrobe(fresh.wardrobe);
    setBudget(fresh.budget);
    setSavedOutfits(fresh.savedOutfits);
    setSlots(buildInitialSlots(fresh.wardrobe));
    setActiveFocusSlot('top');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0E1117] text-slate-100">
      <BudgetTracker
        budget={budget}
        savedCount={savedOutfits.length}
        onUpdateMonthlyLimit={handleUpdateMonthlyLimit}
        onOpenSavedLooks={() => setIsSavedDrawerOpen(true)}
        onOpenStylistChat={() => setIsStylistChatOpen(true)}
        onResetDemoData={handleResetDemoData}
      />

      {/* Mobile View Switcher (< lg) */}
      <div className="lg:hidden px-4 pt-3">
        <div
          role="tablist"
          aria-label="FitCheck mobile workspace views"
          className="grid grid-cols-3 gap-1 p-1 bg-[#151922] border border-white/10 rounded-xl"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'wardrobe'}
            onClick={() => setMobileTab('wardrobe')}
            className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              mobileTab === 'wardrobe'
                ? 'bg-white text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" aria-hidden="true" />
            Wardrobe
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'canvas'}
            onClick={() => setMobileTab('canvas')}
            className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              mobileTab === 'canvas'
                ? 'bg-white text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            Canvas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'drops'}
            onClick={() => setMobileTab('drops')}
            className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              mobileTab === 'drops'
                ? 'bg-white text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Drops
          </button>
        </div>
      </div>

      {/* 3-Column Studio Workspace */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_372px] xl:grid-cols-[345px_minmax(0,1fr)_395px] gap-4 lg:h-[calc(100vh-116px)] lg:min-h-[640px]">
        <div
          className={`min-h-0 ${
            mobileTab === 'wardrobe' ? 'block' : 'hidden lg:block'
          }`}
        >
          <WardrobeSidebar
            items={wardrobe}
            equippedIds={equippedIds}
            compatibleIds={compatibleIds}
            activeFocusItem={activeFocusItem}
            onSelectItem={handleSelectWardrobeItem}
            onAddItem={handleAddWardrobeItem}
            onDeleteItem={handleDeleteWardrobeItem}
          />
        </div>

        <div
          className={`min-h-0 ${
            mobileTab === 'canvas' ? 'block' : 'hidden lg:block'
          }`}
        >
          <OutfitCanvas
            slots={slots}
            activeFocusItem={activeFocusItem}
            unlockedOutfitsCount={unlockedOutfitsCount}
            activeDrop={activeDropOnCanvas}
            activeDropVerdict={activeDropVerdict}
            purchasedDropIds={budget.purchasedDropIds}
            onClearSlot={handleClearSlot}
            onFocusSlot={(slot) => setActiveFocusSlot(slot)}
            onShuffleCompatibleFit={handleShuffleCompatibleFit}
            onClearAllSlots={handleClearAllSlots}
            onSaveLook={handleSaveLook}
            onOpenVerdictModal={(drop) => setVerdictModalDrop(drop)}
            onMarkPurchased={handleMarkPurchased}
          />
        </div>

        <div
          className={`min-h-0 ${
            mobileTab === 'drops' ? 'block' : 'hidden lg:block'
          }`}
        >
          <TrendingDropsFeed
            drops={TRENDING_DROPS}
            wardrobe={wardrobe}
            remainingBudgetInr={remainingBudgetInr}
            purchasedDropIds={budget.purchasedDropIds}
            activeTestDropId={activeDropOnCanvas?.id ?? null}
            onTestDrop={handleTestDrop}
            onMarkPurchased={handleMarkPurchased}
            onOpenVerdict={(drop) => setVerdictModalDrop(drop)}
          />
        </div>
      </div>

      {/* Modals & Drawers */}
      <VerdictModal
        drop={verdictModalDrop}
        verdict={modalVerdict}
        isPurchased={
          verdictModalDrop
            ? budget.purchasedDropIds.includes(verdictModalDrop.id)
            : false
        }
        onClose={() => setVerdictModalDrop(null)}
        onTestDrop={handleTestDrop}
        onMarkPurchased={handleMarkPurchased}
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
        activeDrop={activeDropOnCanvas}
        monthlyLimitInr={budget.monthlyLimitInr}
        remainingBudgetInr={remainingBudgetInr}
        onClose={() => setIsStylistChatOpen(false)}
      />
    </div>
  );
}
