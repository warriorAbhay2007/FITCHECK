import React, { useState } from 'react';
import { Check, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  BottomRailTab,
  ClosetSourceFilter,
  OccasionFilter,
  OutfitSlots,
  ShoeRackTab,
  UpperRailTab,
  WardrobeItem,
} from '../types/wardrobe';
import { formatINR } from '../utils/wardrobeLogic';
import {
  BOTTOM_RAIL_TABS,
  OCCASION_FILTERS,
  SHOE_RACK_TABS,
  UPPER_RAIL_TABS,
  filterItemsByRailTab,
  isLayerableUpperGarment,
} from '../utils/wardrobeStyling';
import { GarmentArtwork } from './GarmentArtwork';

interface ClosetRailsZoneProps {
  items: WardrobeItem[];
  slots: OutfitSlots;
  occasionFilter: OccasionFilter;
  closetSource: ClosetSourceFilter;
  personalCount: number;
  layerOverBase: boolean;
  onChangeOccasion: (filter: OccasionFilter) => void;
  onChangeClosetSource: (source: ClosetSourceFilter) => void;
  onToggleLayerOverBase: () => void;
  onSelectItem: (item: WardrobeItem) => void;
  onOpenAddGarment: () => void;
  onEditItem: (item: WardrobeItem) => void;
  onDeleteItem: (item: WardrobeItem) => void;
}

const CLOSET_SOURCE_OPTIONS: { id: ClosetSourceFilter; label: string }[] = [
  { id: 'all', label: 'Mix & Match (All)' },
  { id: 'mine', label: 'My Wardrobe' },
  { id: 'catalog', label: 'Brand Catalog' },
];

export const ClosetRailsZone: React.FC<ClosetRailsZoneProps> = ({
  items,
  slots,
  occasionFilter,
  closetSource,
  personalCount,
  layerOverBase,
  onChangeOccasion,
  onChangeClosetSource,
  onToggleLayerOverBase,
  onSelectItem,
  onOpenAddGarment,
  onEditItem,
  onDeleteItem,
}) => {
  const [upperTab, setUpperTab] = useState<UpperRailTab>('T-Shirts');
  const [bottomTab, setBottomTab] = useState<BottomRailTab>('Jeans');
  const [shoeTab, setShoeTab] = useState<ShoeRackTab>('Sneakers');

  const upperItems = filterItemsByRailTab(
    items,
    upperTab,
    occasionFilter,
    closetSource,
  );
  const bottomItems = filterItemsByRailTab(
    items,
    bottomTab,
    occasionFilter,
    closetSource,
  );
  const shoeItems = filterItemsByRailTab(
    items,
    shoeTab,
    occasionFilter,
    closetSource,
  );

  const isEquipped = (item: WardrobeItem) =>
    slots.top?.id === item.id ||
    slots.outerwear?.id === item.id ||
    slots.bottom?.id === item.id ||
    slots.footwear?.id === item.id;

  const renderEmptyRailState = (railLabel: string) => (
    <div className="py-4 flex flex-col items-center gap-2 text-center text-xs text-[#baa995]">
      <span>
        {closetSource === 'mine' && personalCount === 0
          ? 'Your personal closet is empty — upload your own clothes to try them on.'
          : closetSource === 'mine'
            ? `No uploaded ${railLabel.toLowerCase()} yet${occasionFilter !== 'All' ? ` for ${occasionFilter}` : ''}.`
            : `No ${railLabel.toLowerCase()} tagged for ${occasionFilter}.`}
      </span>
      <div className="flex items-center gap-3">
        {closetSource === 'mine' && (
          <button
            type="button"
            onClick={onOpenAddGarment}
            className="text-[11px] font-medium text-[#e0b973] underline underline-offset-2 cursor-pointer"
          >
            + Upload to My Wardrobe
          </button>
        )}
        {occasionFilter !== 'All' && (
          <button
            type="button"
            onClick={() => onChangeOccasion('All')}
            className="text-[11px] text-[#e0b973] underline underline-offset-2 cursor-pointer"
          >
            Show All Occasions
          </button>
        )}
        {closetSource !== 'all' && (
          <button
            type="button"
            onClick={() => onChangeClosetSource('all')}
            className="text-[11px] text-[#d4c8b8] underline underline-offset-2 cursor-pointer"
          >
            Switch to Mix &amp; Match
          </button>
        )}
      </div>
    </div>
  );

  return (
    <section
      aria-label="Wardrobe Hanging Rails and Shelves"
      className="relative h-full flex flex-col rounded-2xl closet-cabinet-bg border border-[#e0b973]/20 shadow-[inset_0_1px_0_rgba(245,239,230,0.08),0_18px_45px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {/* Top Warm LED Light Strip */}
      <div className="h-1 w-full led-strip-glow shrink-0" aria-hidden="true" />

      {/* Top Shelf: Upload CTA + Closet Source Toggle + Occasion Filter Bar */}
      <div className="px-4 pt-3 pb-2.5 border-b border-[#f5efe6]/10 bg-[#261f1a]/65 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold text-[#f5efe6] leading-none">
              Wardrobe Rails
            </h2>
            <p className="text-[11px] text-[#baa995] mt-1 truncate">
              Mix your real clothes with curated Indian retail pieces
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddGarment}
            aria-label="Add to My Wardrobe"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e0b973] hover:bg-[#ebd09a] text-[11px] font-semibold text-[#181512] shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
            <span>Add to My Wardrobe</span>
          </button>
        </div>

        {/* Compact Closet Source + Occasion Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Closet Source Toggle */}
          <div
            role="group"
            aria-label="Closet source filter"
            className="inline-flex items-center p-0.5 rounded-lg bg-[#181512]/90 border border-[#f5efe6]/12"
          >
            {CLOSET_SOURCE_OPTIONS.map((opt) => {
              const active = closetSource === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChangeClosetSource(opt.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#2e251e] text-[#e0b973] font-semibold border border-[#e0b973]/40'
                      : 'text-[#cbbca8] hover:text-[#f5efe6]'
                  }`}
                >
                  {opt.label}
                  {opt.id === 'mine' && personalCount > 0 ? ` (${personalCount})` : ''}
                </button>
              );
            })}
          </div>

          {/* Occasion Filter Buttons */}
          <div
            role="group"
            aria-label="Filter wardrobe by occasion and vibe"
            className="flex flex-wrap items-center gap-1"
          >
            {OCCASION_FILTERS.map((filter) => {
              const active = occasionFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChangeOccasion(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#e0b973] text-[#181512] font-semibold shadow-sm'
                      : 'bg-[#181512]/70 text-[#d4c8b8] hover:text-[#f5efe6] hover:bg-[#2f2620] border border-[#f5efe6]/10'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Categorized Horizontal Closet Interior */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {/* 1. UPPERWEAR HANGING RAIL */}
        <div data-testid="upperwear-rail-section">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e0b973]">
                Upperwear Rail
              </h3>
              <span className="text-[11px] text-[#baa995] tabular-nums">
                {upperItems.length} shown
              </span>
            </div>

            {/* Layer Over Base Toggle */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#181512]/80 border border-[#f5efe6]/10">
              <Layers className="w-3.5 h-3.5 text-[#e0b973]" aria-hidden="true" />
              <span className="text-[11px] font-medium text-[#e6dccf] whitespace-nowrap">
                Layer Over Base
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={layerOverBase}
                aria-label="Layer Over Base"
                onClick={onToggleLayerOverBase}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
                  layerOverBase
                    ? 'bg-[#e0b973] border-[#e0b973]'
                    : 'bg-[#2a221c] border-[#f5efe6]/20'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-[#181512] transition-transform ${
                    layerOverBase ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Upperwear Category Divider Tabs */}
          <div
            role="tablist"
            aria-label="Upperwear rail categories"
            className="flex items-center gap-1.5 overflow-x-auto pb-2"
          >
            {UPPER_RAIL_TABS.map((tab) => {
              const active = upperTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setUpperTab(tab)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#2e251e] text-[#e0b973] border border-[#e0b973]/60 font-semibold'
                      : 'bg-[#181512]/65 text-[#cbbca8] hover:text-[#f5efe6] border border-[#f5efe6]/10'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Metallic Closet Rod + Horizontal Hanger Row */}
          <div className="relative pt-1">
            <div className="h-2 w-full rounded-full closet-rod" aria-hidden="true" />

            {upperItems.length === 0 ? (
              renderEmptyRailState(upperTab)
            ) : (
              <div
                data-testid="rail-row-upper"
                className="mt-1 flex items-stretch gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
              >
                {upperItems.map((item) => {
                  const active = isEquipped(item);
                  const isLayerPiece = isLayerableUpperGarment(item);
                  return (
                    <div
                      key={item.id}
                      className={`group relative w-[156px] sm:w-[168px] shrink-0 snap-start rounded-xl border transition-all ${
                        active
                          ? 'bg-[#2e251e] border-[#e0b973] shadow-[0_8px_22px_rgba(224,185,115,0.16)]'
                          : 'bg-[#211b16]/85 border-[#f5efe6]/10 hover:border-[#e0b973]/45 hover:bg-[#29221c]'
                      }`}
                    >
                      {item.isUserUploaded && (
                        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-[#e0b973] text-[#181512] text-[9px] font-bold tracking-wider">
                            MINE
                          </span>
                        </div>
                      )}

                      {item.isUserUploaded && (
                        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${item.name}`}
                            onClick={() => onEditItem(item)}
                            className="p-1 rounded bg-[#181512]/90 hover:bg-[#312821] border border-[#f5efe6]/15 text-[#e6dccf] cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${item.name}`}
                            onClick={() => onDeleteItem(item)}
                            className="p-1 rounded bg-[#181512]/90 hover:bg-red-950/90 border border-[#f5efe6]/15 text-[#e6dccf] hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSelectItem(item)}
                        className="w-full text-left pt-1 pb-2.5 px-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b973] rounded-xl"
                      >
                        <div className="hanger-sway flex flex-col items-center">
                          <svg
                            viewBox="0 0 80 22"
                            className="w-16 h-5"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M40 2 C43 2 44 6 40 8 V11"
                              stroke="#e0b973"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M40 11 L10 20 H70 Z"
                              stroke="#b89862"
                              strokeWidth="2"
                              strokeLinejoin="round"
                              fill="rgba(38,31,26,0.7)"
                            />
                          </svg>

                          <div className="w-full h-[62px] rounded-lg overflow-hidden bg-gradient-to-b from-[#17120e]/85 to-[#221b15]/60 border border-[#f5efe6]/[0.06] relative">
                            <GarmentArtwork
                              silhouette={item.silhouette}
                              colorHex={item.colorHex}
                              name={item.name}
                              imageUrl={item.imageUrl}
                              transparentBg
                              className="w-full h-full"
                            />
                            {active && (
                              <span
                                className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-[#e0b973] text-[#181512] flex items-center justify-center shadow"
                                aria-hidden="true"
                              >
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 min-w-0">
                          <p className="text-xs font-semibold text-[#f5efe6] truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-[#baa995] truncate mt-0.5 tabular-nums">
                            {item.isUserUploaded
                              ? `${item.colorName}${isLayerPiece ? ' · Layer' : ` · ${item.fit}`}`
                              : `${item.brand ?? item.colorName}${item.priceInr ? ` · ${formatINR(item.priceInr)}` : ''}${isLayerPiece ? ' · Layer' : item.subStyle ? ` · ${item.subStyle}` : ''}`}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Warm Shelf Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#e0b973]/30 to-transparent" />

        {/* 2. BOTTOMWEAR HANGING RAIL */}
        <div data-testid="bottomwear-rail-section">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e0b973]">
              Bottomwear Rail
            </h3>
            <span className="text-[11px] text-[#baa995] tabular-nums">
              {bottomItems.length} shown
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Bottomwear rail categories"
            className="flex items-center gap-1.5 overflow-x-auto pb-2"
          >
            {BOTTOM_RAIL_TABS.map((tab) => {
              const active = bottomTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setBottomTab(tab)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#2e251e] text-[#e0b973] border border-[#e0b973]/60 font-semibold'
                      : 'bg-[#181512]/65 text-[#cbbca8] hover:text-[#f5efe6] border border-[#f5efe6]/10'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="relative pt-1">
            <div className="h-2 w-full rounded-full closet-rod" aria-hidden="true" />

            {bottomItems.length === 0 ? (
              renderEmptyRailState(bottomTab)
            ) : (
              <div
                data-testid="rail-row-lower"
                className="mt-1 flex items-stretch gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
              >
                {bottomItems.map((item) => {
                  const active = isEquipped(item);
                  return (
                    <div
                      key={item.id}
                      className={`group relative w-[156px] sm:w-[168px] shrink-0 snap-start rounded-xl border transition-all ${
                        active
                          ? 'bg-[#2e251e] border-[#e0b973] shadow-[0_8px_22px_rgba(224,185,115,0.16)]'
                          : 'bg-[#211b16]/85 border-[#f5efe6]/10 hover:border-[#e0b973]/45 hover:bg-[#29221c]'
                      }`}
                    >
                      {item.isUserUploaded && (
                        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-[#e0b973] text-[#181512] text-[9px] font-bold tracking-wider">
                            MINE
                          </span>
                        </div>
                      )}

                      {item.isUserUploaded && (
                        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${item.name}`}
                            onClick={() => onEditItem(item)}
                            className="p-1 rounded bg-[#181512]/90 hover:bg-[#312821] border border-[#f5efe6]/15 text-[#e6dccf] cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${item.name}`}
                            onClick={() => onDeleteItem(item)}
                            className="p-1 rounded bg-[#181512]/90 hover:bg-red-950/90 border border-[#f5efe6]/15 text-[#e6dccf] hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSelectItem(item)}
                        className="w-full text-left pt-1 pb-2.5 px-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b973] rounded-xl"
                      >
                        <div className="hanger-sway flex flex-col items-center">
                          <svg
                            viewBox="0 0 80 18"
                            className="w-16 h-4"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M40 2 C43 2 44 5 40 7 V11"
                              stroke="#e0b973"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <line
                              x1="16"
                              y1="11"
                              x2="64"
                              y2="11"
                              stroke="#b89862"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            <rect x="19" y="11" width="5" height="6" rx="1" fill="#e0b973" />
                            <rect x="56" y="11" width="5" height="6" rx="1" fill="#e0b973" />
                          </svg>

                          <div className="w-full h-[62px] rounded-lg overflow-hidden bg-gradient-to-b from-[#17120e]/85 to-[#221b15]/60 border border-[#f5efe6]/[0.06] relative">
                            <GarmentArtwork
                              silhouette={item.silhouette}
                              colorHex={item.colorHex}
                              name={item.name}
                              imageUrl={item.imageUrl}
                              transparentBg
                              className="w-full h-full"
                            />
                            {active && (
                              <span
                                className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-[#e0b973] text-[#181512] flex items-center justify-center shadow"
                                aria-hidden="true"
                              >
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 min-w-0">
                          <p className="text-xs font-semibold text-[#f5efe6] truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-[#baa995] truncate mt-0.5 tabular-nums">
                            {item.isUserUploaded
                              ? `${item.colorName} · ${item.fit}`
                              : `${item.brand ?? item.colorName}${item.priceInr ? ` · ${formatINR(item.priceInr)}` : ''}${item.subStyle ? ` · ${item.subStyle}` : ` · ${item.fit}`}`}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. BOTTOM SHOE RACK */}
        <div
          data-testid="shoe-rack-section"
          className="rounded-xl bg-[#261f1a]/80 border border-[#e0b973]/20 p-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e0b973]">
              Bottom Shoe Rack
            </h3>
            <span className="text-[11px] text-[#baa995] tabular-nums">
              {shoeItems.length} pairs
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Shoe rack categories"
            className="flex items-center gap-1.5 overflow-x-auto pb-2.5"
          >
            {SHOE_RACK_TABS.map((tab) => {
              const active = shoeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setShoeTab(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#e0b973] text-[#181512] font-semibold'
                      : 'bg-[#181512]/70 text-[#cbbca8] hover:text-[#f5efe6] border border-[#f5efe6]/10'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {shoeItems.length === 0 ? (
            renderEmptyRailState(shoeTab)
          ) : (
            <div
              data-testid="rail-row-shoes"
              className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 snap-x snap-mandatory"
            >
              {shoeItems.map((item) => {
                const active = isEquipped(item);
                return (
                  <div
                    key={item.id}
                    className={`relative w-[206px] sm:w-[224px] shrink-0 snap-start rounded-xl border transition-all ${
                      active
                        ? 'bg-[#31261e] border-[#e0b973] shadow-[0_6px_16px_rgba(224,185,115,0.16)]'
                        : 'bg-[#181512]/80 border-[#f5efe6]/10 hover:border-[#e0b973]/40 hover:bg-[#231c17]'
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSelectItem(item)}
                      className="w-full flex items-center gap-2.5 p-2 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b973] rounded-xl"
                    >
                      <div className="w-14 h-12 rounded-lg overflow-hidden bg-[#17120e] shrink-0 border border-[#f5efe6]/10 -rotate-3 transition-transform relative">
                        <GarmentArtwork
                          silhouette={item.silhouette}
                          colorHex={item.colorHex}
                          name={item.name}
                          imageUrl={item.imageUrl}
                          transparentBg
                          className="w-full h-full"
                        />
                        {item.isUserUploaded && (
                          <span className="absolute top-0.5 left-0.5 px-1 rounded bg-[#e0b973] text-[#181512] text-[8px] font-bold">
                            MINE
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold text-[#f5efe6] truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#baa995] truncate tabular-nums">
                          {item.isUserUploaded
                            ? `${item.colorName} · ${item.fit}`
                            : `${item.brand ?? item.colorName}${item.priceInr ? ` · ${formatINR(item.priceInr)}` : ''}`}
                        </p>
                      </div>
                      {active && !item.isUserUploaded && (
                        <Check
                          className="w-4 h-4 text-[#e0b973] shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    {item.isUserUploaded && (
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => onEditItem(item)}
                          className="p-1 rounded bg-[#181512]/90 hover:bg-[#312821] border border-[#f5efe6]/15 text-[#e6dccf] cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => onDeleteItem(item)}
                          className="p-1 rounded bg-[#181512]/90 hover:bg-red-950/90 border border-[#f5efe6]/15 text-[#e6dccf] hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Subtle LED Under-Shelf Accent */}
          <div
            aria-hidden="true"
            className="mt-2.5 h-0.5 w-full rounded-full bg-gradient-to-r from-transparent via-[#e0b973]/45 to-transparent"
          />
        </div>
      </div>
    </section>
  );
};
