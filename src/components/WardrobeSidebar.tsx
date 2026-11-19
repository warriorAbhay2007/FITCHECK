import React, { useMemo, useState } from 'react';
import { Check, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react';
import {
  FitType,
  GarmentCategory,
  GarmentSilhouette,
  StyleVibe,
  TrendingDrop,
  WardrobeItem,
} from '../types/wardrobe';
import { inferColorFamily } from '../utils/wardrobeLogic';
import { GarmentArtwork } from './GarmentArtwork';

interface WardrobeSidebarProps {
  items: WardrobeItem[];
  equippedIds: Set<string>;
  compatibleIds: Set<string>;
  activeFocusItem: WardrobeItem | TrendingDrop | null;
  onSelectItem: (item: WardrobeItem) => void;
  onAddItem: (item: WardrobeItem) => void;
  onDeleteItem: (id: string) => void;
}

const CATEGORIES: ('All' | GarmentCategory)[] = [
  'All',
  'Tops',
  'Bottoms',
  'Outerwear',
  'Footwear',
];

const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Jet Black', hex: '#18181B' },
  { name: 'Crisp White', hex: '#F8FAFC' },
  { name: 'Heather Grey', hex: '#64748B' },
  { name: 'Olive', hex: '#4E5D3E' },
  { name: 'Warm Sand', hex: '#C2AD8E' },
  { name: 'Raw Indigo', hex: '#1E3A5F' },
  { name: 'Espresso', hex: '#432C22' },
  { name: 'Rust Terracotta', hex: '#9A3412' },
];

const VIBE_OPTIONS: StyleVibe[] = [
  'Streetwear',
  'Minimalist',
  'Smart Casual',
  'Techwear',
  'Casual',
];

const FIT_OPTIONS: FitType[] = [
  'Oversized',
  'Relaxed',
  'Regular',
  'Boxy',
  'Tailored',
  'Chunky',
];

const DEFAULT_SILHOUETTE: Record<GarmentCategory, GarmentSilhouette> = {
  Tops: 'tee',
  Bottoms: 'trousers',
  Outerwear: 'jacket',
  Footwear: 'sneakers',
};

export const WardrobeSidebar: React.FC<WardrobeSidebarProps> = ({
  items,
  equippedIds,
  compatibleIds,
  activeFocusItem,
  onSelectItem,
  onAddItem,
  onDeleteItem,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'All' | GarmentCategory>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Item Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GarmentCategory>('Tops');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [vibe, setVibe] = useState<StyleVibe>('Minimalist');
  const [fit, setFit] = useState<FitType>('Relaxed');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState('');

  const filteredItems = useMemo(() => {
    return categoryFilter === 'All'
      ? items
      : items.filter((item) => item.category === categoryFilter);
  }, [items, categoryFilter]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Enter an item name before adding it to your closet.');
      return;
    }

    const newItem: WardrobeItem = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      category,
      colorName: selectedColor.name,
      colorHex: selectedColor.hex,
      colorFamily: inferColorFamily(selectedColor.name),
      vibe,
      tags: [vibe.toLowerCase(), fit.toLowerCase(), 'custom'],
      fit,
      silhouette: DEFAULT_SILHOUETTE[category],
      imageUrl: photoDataUrl,
      isCustom: true,
    };

    onAddItem(newItem);
    setName('');
    setPhotoDataUrl(undefined);
    setFormError('');
    setIsAddModalOpen(false);
  };

  return (
    <aside
      aria-label="My Capsule Wardrobe"
      className="flex flex-col bg-[#151922] border border-white/10 rounded-xl overflow-hidden h-full"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-white tracking-tight">
              My Capsule Wardrobe
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              {items.length} pieces
              {activeFocusItem && compatibleIds.size > 0
                ? ` · ${compatibleIds.size} compatible`
                : ' · Click to equip'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0E1117] bg-[#D4A853] hover:bg-[#DFB96E] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add My Item
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter wardrobe by category"
          className="mt-3 flex items-center justify-between gap-0.5 p-1 bg-[#0E1117] rounded-lg"
        >
          {CATEGORIES.map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap text-center ${
                  active
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wardrobe List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-sm text-slate-300 font-medium">
              No pieces in {categoryFilter} yet.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-3 px-4 py-2 text-xs font-semibold bg-white text-slate-950 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Add Your First {categoryFilter} Piece
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isEquipped = equippedIds.has(item.id);
            const isCompatible = compatibleIds.has(item.id);

            return (
              <div
                key={item.id}
                data-testid={`wardrobe-item-${item.id}`}
                data-compatible={isCompatible ? 'true' : 'false'}
                className={`group relative bg-white text-slate-900 rounded-xl p-2.5 transition-all duration-150 ${
                  isEquipped
                    ? 'ring-2 ring-[#D4A853] shadow-md'
                    : isCompatible
                    ? 'ring-2 ring-emerald-500 shadow-sm'
                    : 'hover:translate-y-[-1px]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectItem(item)}
                    aria-label={`Equip ${item.name}`}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A853] rounded-lg"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-[#F4F3EF]">
                      <GarmentArtwork
                        silhouette={item.silhouette}
                        colorHex={item.colorHex}
                        name={item.name}
                        imageUrl={item.imageUrl}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {item.name}
                        </p>
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {item.category} · {item.vibe} · {item.fit}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] font-medium">
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                          aria-hidden="true"
                        />
                        <span className="text-slate-600 truncate">
                          {item.colorName}
                        </span>
                        {isEquipped && (
                          <span className="inline-flex items-center gap-1 text-[#9A7222] font-semibold ml-auto shrink-0">
                            <Check className="w-3 h-3" aria-hidden="true" />
                            On Canvas
                          </span>
                        )}
                        {!isEquipped && isCompatible && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold ml-auto shrink-0">
                            <Sparkles className="w-3 h-3" aria-hidden="true" />
                            Matches
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {item.isCustom && (
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add My Item Modal */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3
                id="add-item-modal-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                Add Wardrobe Piece
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFormError('');
                }}
                aria-label="Close add item modal"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-5 space-y-4">
              {formError && (
                <p
                  role="alert"
                  className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"
                >
                  {formError}
                </p>
              )}

              <div>
                <label
                  htmlFor="item-name-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Piece Name
                </label>
                <input
                  id="item-name-input"
                  type="text"
                  placeholder="e.g., Cream Heavyweight Hoodie"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A853]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="item-category-select"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="item-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GarmentCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A853]"
                  >
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Footwear">Footwear</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="item-vibe-select"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Style Vibe
                  </label>
                  <select
                    id="item-vibe-select"
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value as StyleVibe)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A853]"
                  >
                    {VIBE_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="item-fit-select"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Fit Silhouette
                </label>
                <select
                  id="item-fit-select"
                  value={fit}
                  onChange={(e) => setFit(e.target.value as FitType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A853]"
                >
                  {FIT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Color Swatch ({selectedColor.name})
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = preset.name === selectedColor.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        aria-label={`Select color ${preset.name}`}
                        onClick={() => setSelectedColor(preset)}
                        className={`w-7 h-7 rounded-full border transition-transform ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                            : 'border-slate-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="item-photo-upload"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Optional Photo Upload
                </label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="item-photo-upload"
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    {photoDataUrl ? 'Replace Photo' : 'Upload Photo'}
                  </label>
                  <input
                    id="item-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="sr-only"
                  />
                  {photoDataUrl && (
                    <img
                      src={photoDataUrl}
                      alt="Uploaded preview"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                    />
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Add to Wardrobe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
