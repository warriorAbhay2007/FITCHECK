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
  | 'Chunky'
  | 'Slim'
  | 'Straight';

export type ColorFamily = 'neutral' | 'earth' | 'cool' | 'bold';

export type GarmentSilhouette =
  | 'tee'
  | 'polo'
  | 'shirt'
  | 'kurta'
  | 'hoodie'
  | 'knit'
  | 'jacket'
  | 'bomber'
  | 'blazer'
  | 'shell'
  | 'coat'
  | 'cargo'
  | 'joggers'
  | 'denim'
  | 'trousers'
  | 'shorts'
  | 'sneakers'
  | 'boots'
  | 'loafers';

export type OccasionTag =
  | 'College Daily'
  | 'Streetwear'
  | 'Smart Casual'
  | 'Festive';

export type OccasionFilter = 'All' | OccasionTag;

export type UpperRailTab =
  | 'T-Shirts'
  | 'Shirts'
  | 'Hoodies & Sweatshirts'
  | 'Jackets & Outerwear';

export type BottomRailTab =
  | 'Jeans'
  | 'Trousers & Chinos'
  | 'Cargos & Joggers'
  | 'Shorts';

export type ShoeRackTab =
  | 'Sneakers'
  | 'Casual & Loafers'
  | 'Boots & Formal';

export type RailSubcategory = UpperRailTab | BottomRailTab | ShoeRackTab;

export type MirrorLighting = 'Daylight' | 'Warm Indoor' | 'Evening';

export type SkinToneId =
  | 'fair'
  | 'wheatish'
  | 'medium'
  | 'olive'
  | 'tan'
  | 'deep';

export type Undertone = 'Warm' | 'Cool' | 'Neutral';

export type WardrobeSize = 'S' | 'M' | 'L' | 'XL';

export type FitPreference = 'Slim' | 'Regular' | 'Relaxed/Oversized';

export type BodyTypeId = 'lean' | 'athletic' | 'average' | 'broad' | 'heavy';

export interface WardrobeProfile {
  skinTone: SkinToneId;
  undertone: Undertone;
  size: WardrobeSize;
  fitPreference: FitPreference;
  bodyType: BodyTypeId;
  lighting: MirrorLighting;
  layerOverBase: boolean;
}

export type ClosetSourceFilter = 'all' | 'mine' | 'catalog';

export interface GarmentTransform {
  scale: number;
  offsetY: number;
}

export interface WardrobeItem {
  id: string;
  name: string;
  brand?: string;
  priceInr?: number;
  category: GarmentCategory;
  railTab?: RailSubcategory;
  subStyle?: string;
  layerable?: boolean;
  colorName: string;
  colorHex: string;
  colorFamily: ColorFamily;
  vibe: StyleVibe;
  tags: string[];
  occasionTags?: OccasionTag[];
  fit: FitType;
  silhouette: GarmentSilhouette;
  imageUrl?: string;
  isCustom?: boolean;
  isUserUploaded?: boolean;
  cutoutMode?: 'transparent' | 'rounded-card';
  mirrorTransform?: GarmentTransform;
  createdAt?: string;
  fromDropId?: string;
  brandNote?: string;
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
  harmonyScore?: number;
  lighting?: MirrorLighting;
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
  budgetDelta: number;
  checklist: VerdictChecklistItem[];
}

export interface BudgetState {
  monthlyLimitInr: number;
  spentInr: number;
  purchasedDropIds: string[];
}
