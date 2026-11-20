import React, { useEffect } from 'react';
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
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-looks-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-[#181512] border-l border-[#e0b973]/25 h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-[#f5efe6]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#e0b973]" aria-hidden="true" />
            <h2
              id="saved-looks-title"
              className="font-display text-xl font-semibold text-[#f5efe6]"
            >
              Saved Looks ({savedOutfits.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved looks drawer"
            className="p-1.5 text-[#baa995] hover:text-[#f5efe6] rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedOutfits.length === 0 ? (
            <div className="text-center py-14 px-4">
              <p className="text-sm font-medium text-[#f5efe6]">
                No saved looks yet.
              </p>
              <p className="text-xs text-[#baa995] mt-1">
                Pair garments on the smart mirror and click Save Look to keep your favorites.
              </p>
            </div>
          ) : (
            savedOutfits.map((outfit) => (
              <article
                key={outfit.id}
                data-testid={`saved-look-${outfit.id}`}
                className="bg-[#261f1a] border border-[#f5efe6]/12 text-[#f5efe6] rounded-xl p-3.5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-[#baa995]">
                      {outfit.contextTag} · {outfit.snapshotItems.length} pieces
                      {typeof outfit.harmonyScore === 'number'
                        ? ` · ${outfit.harmonyScore}% Harmony`
                        : ''}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-[#f5efe6] leading-tight mt-0.5">
                      {outfit.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteOutfit(outfit.id)}
                    aria-label={`Delete saved look ${outfit.title}`}
                    className="p-1.5 text-[#baa995] hover:text-rose-400 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* Mini Thumbnail Strip */}
                <div className="grid grid-cols-4 gap-2">
                  {outfit.snapshotItems.map((piece) => (
                    <div key={piece.id} className="space-y-1">
                      <div className="aspect-square rounded-lg overflow-hidden border border-[#f5efe6]/10 bg-[#f4efe7]">
                        <GarmentArtwork
                          silhouette={piece.silhouette}
                          colorHex={piece.colorHex}
                          name={piece.name}
                          imageUrl={piece.imageUrl}
                        />
                      </div>
                      <p className="text-[10px] text-[#e6dccf] truncate">
                        {piece.name}
                      </p>
                      {piece.isDrop && piece.priceInr !== undefined && (
                        <p className="text-[10px] font-mono tabular-nums text-[#e0b973] font-semibold">
                          {formatINR(piece.priceInr)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {outfit.notes && (
                  <p className="text-xs text-[#cbbca8] bg-[#181512]/70 rounded-lg px-2.5 py-1.5 border border-[#f5efe6]/[0.07]">
                    {outfit.notes}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onLoadOutfit(outfit);
                    onClose();
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#181512] bg-[#e0b973] hover:bg-[#ebd09a] rounded-lg transition-colors cursor-pointer"
                >
                  Wear on Mirror
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
