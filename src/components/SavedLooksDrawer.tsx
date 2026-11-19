import React from 'react';
import { ArrowUpRight, Bookmark, Trash2, X } from 'lucide-react';
import { SavedOutfit } from '../types/wardrobe';
import { formatINR } from '../utils/wardrobeLogic';
import { GarmentArtwork } from './GarmentArtwork';

interface SavedLooksDrawerProps {
  isOpen: boolean;
  savedOutfits: SavedOutfit[];
  onClose: () => void;
  onLoadOutfit: (outfit: SavedOutfit) => void;
  onDeleteOutfit: (id: string) => void;
}

export const SavedLooksDrawer: React.FC<SavedLooksDrawerProps> = ({
  isOpen,
  savedOutfits,
  onClose,
  onLoadOutfit,
  onDeleteOutfit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-looks-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/70"
    >
      <div className="w-full max-w-md bg-[#151922] border-l border-white/10 h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#D4A853]" aria-hidden="true" />
            <h2
              id="saved-looks-title"
              className="font-display text-base font-bold text-white"
            >
              Saved Looks ({savedOutfits.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved looks drawer"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedOutfits.length === 0 ? (
            <div className="text-center py-14 px-4">
              <p className="text-sm font-medium text-slate-300">
                No saved looks yet.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Equip pieces on the Outfit Canvas and save your favorite combinations.
              </p>
            </div>
          ) : (
            savedOutfits.map((outfit) => (
              <article
                key={outfit.id}
                data-testid={`saved-look-${outfit.id}`}
                className="bg-white text-slate-900 rounded-xl p-3.5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500">
                      {outfit.contextTag} · {outfit.snapshotItems.length} pieces
                    </p>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      {outfit.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteOutfit(outfit.id)}
                    aria-label={`Delete saved look ${outfit.title}`}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* Mini Thumbnail Strip */}
                <div className="grid grid-cols-4 gap-2">
                  {outfit.snapshotItems.map((piece) => (
                    <div key={piece.id} className="space-y-1">
                      <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-[#F4F3EF]">
                        <GarmentArtwork
                          silhouette={piece.silhouette}
                          colorHex={piece.colorHex}
                          name={piece.name}
                          imageUrl={piece.imageUrl}
                        />
                      </div>
                      <p className="text-[10px] text-slate-600 truncate">
                        {piece.name}
                      </p>
                      {piece.isDrop && piece.priceInr !== undefined && (
                        <p className="text-[10px] font-mono tabular-nums text-[#9A7222] font-semibold">
                          {formatINR(piece.priceInr)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {outfit.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                    {outfit.notes}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onLoadOutfit(outfit);
                    onClose();
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Load onto Canvas
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
