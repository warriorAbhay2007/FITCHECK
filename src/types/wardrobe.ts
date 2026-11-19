export type GarmentCategory = 'Tops' | 'Bottoms' | 'Outerwear' | 'Footwear';

export type SlotKey = 'outerwear' | 'top' | 'bottom' | 'footwear';

export type StyleVibe =
  | 'Streetwear'
  | 'Minimalist'
  | 'Smart Casual'
  | 'Techwear'
  | 'Casual';

export type FitType =
  | 'Oversized'
  | 'Relaxed'
  | 'Regular'
  | 'Boxy'
  | 'Tailored'
  | 'Chunky';

export type ColorFamily = 'neutral' | 'earth' | 'cool' | 'bold';

export type GarmentSilhouette =
  | 'tee'
  | 'shirt'
  | 'hoodie'
  | 'knit'
  | 'jacket'
  | 'bomber'
  | 'shell'
  | 'coat'
  | 'cargo'
  | 'denim'
  | 'trousers'
  | 'shorts'
  | 'sneakers'
  | 'boots'
  | 'loafers';

export interface WardrobeItem {
  id: string;
  name: string;
  category: GarmentCategory;
  colorName: string;
  colorHex: string;
  colorFamily: ColorFamily;
  vibe: StyleVibe;
  tags: string[];
  fit: FitType;
  silhouette: GarmentSilhouette;
  imageUrl?: string;
  isCustom?: boolean;
  fromDropId?: string;
}

export interface TrendingDrop {
  id: string;
  name: string;
  brand: string;
  category: GarmentCategory;
  priceInr: number;
  storeName: 'Myntra' | 'H&M' | 'Ajio' | 'Zara' | 'Uniqlo' | 'Nike';
  storeUrl: string;
  colorName: string;
  colorHex: string;
  colorFamily: ColorFamily;
  vibe: Exclude<StyleVibe, 'Casual'>;
  tags: string[];
  fit: FitType;
  silhouette: GarmentSilhouette;
  imageUrl?: string;
  fabricNote: string;
}

export type OutfitSlots = Record<SlotKey, WardrobeItem | TrendingDrop | null>;

export interface SavedOutfit {
  id: string;
  title: string;
  contextTag: string;
  notes: string;
  createdAt: string;
  slots: {
    outerwearId: string | null;
    topId: string | null;
    bottomId: string | null;
    footwearId: string | null;
  };
  snapshotItems: {
    id: string;
    name: string;
    category: GarmentCategory;
    colorHex: string;
    colorName: string;
    silhouette: GarmentSilhouette;
    imageUrl?: string;
    isDrop?: boolean;
    priceInr?: number;
  }[];
}

export type VerdictKind =
  | 'strong-buy'
  | 'wait-budget'
  | 'trap-buy'
  | 'consider'
  | 'skip-both';

export interface VerdictChecklistItem {
  text: string;
  met: boolean;
}

export interface VerdictResult {
  kind: VerdictKind;
  headline: string;
  summary: string;
  compatibilityScore: number;
  unlockedOutfits: number;
  fitsBudget: boolean;
  budgetDelta: number; // positive = remaining after purchase, negative = over budget amount
  checklist: VerdictChecklistItem[];
}

export interface BudgetState {
  monthlyLimitInr: number;
  spentInr: number;
  purchasedDropIds: string[];
}
