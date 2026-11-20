import {
  ColorFamily,
  GarmentCategory,
  SlotKey,
  StyleVibe,
  TrendingDrop,
  VerdictResult,
  WardrobeItem,
} from '../types/wardrobe';

export const CATEGORY_TO_SLOT: Record<GarmentCategory, SlotKey> = {
  Outerwear: 'outerwear',
  Tops: 'top',
  Bottoms: 'bottom',
  Footwear: 'footwear',
};

export const SLOT_TO_CATEGORY: Record<SlotKey, GarmentCategory> = {
  outerwear: 'Outerwear',
  top: 'Tops',
  bottom: 'Bottoms',
  footwear: 'Footwear',
};

export function isTrendingDrop(
  item: WardrobeItem | TrendingDrop | null | undefined,
): item is TrendingDrop {
  return Boolean(item && 'priceInr' in item && 'storeName' in item);
}

export function formatINR(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('en-IN').format(abs);
  return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function inferColorFamily(hexOrName: string): ColorFamily {
  const normalized = hexOrName.trim().toLowerCase();
  if (
    ['black', 'white', 'charcoal', 'grey', 'gray', 'cream', 'off-white', 'ivory', 'slate'].some(
      (k) => normalized.includes(k),
    )
  ) {
    return 'neutral';
  }
  if (
    ['olive', 'khaki', 'sand', 'beige', 'tan', 'camel', 'brown', 'espresso', 'rust', 'stone'].some(
      (k) => normalized.includes(k),
    )
  ) {
    return 'earth';
  }
  if (
    ['navy', 'indigo', 'denim', 'cobalt', 'teal', 'sage', 'forest'].some((k) =>
      normalized.includes(k),
    )
  ) {
    return 'cool';
  }
  if (['neon', 'acid', 'lime', 'magenta', 'crimson', 'orange', 'purple'].some((k) => normalized.includes(k))) {
    return 'bold';
  }
  return 'neutral';
}

const COLOR_MATRIX: Record<ColorFamily, Record<ColorFamily, number>> = {
  neutral: { neutral: 100, earth: 95, cool: 90, bold: 35 },
  earth: { neutral: 95, earth: 88, cool: 68, bold: 15 },
  cool: { neutral: 90, earth: 68, cool: 78, bold: 18 },
  bold: { neutral: 35, earth: 15, cool: 18, bold: 24 },
};

const VIBE_MATRIX: Record<StyleVibe, Record<StyleVibe, number>> = {
  Streetwear: {
    Streetwear: 100,
    Casual: 90,
    Techwear: 78,
    Minimalist: 68,
    'Smart Casual': 32,
  },
  Minimalist: {
    Minimalist: 100,
    'Smart Casual': 92,
    Casual: 85,
    Streetwear: 68,
    Techwear: 52,
  },
  'Smart Casual': {
    'Smart Casual': 100,
    Minimalist: 92,
    Casual: 78,
    Streetwear: 32,
    Techwear: 18,
  },
  Techwear: {
    Techwear: 100,
    Streetwear: 76,
    Minimalist: 52,
    Casual: 45,
    'Smart Casual': 18,
  },
  Casual: {
    Casual: 100,
    Streetwear: 90,
    Minimalist: 85,
    'Smart Casual': 78,
    Techwear: 45,
  },
};

export function getPairCompatibilityScore(
  a: Pick<WardrobeItem, 'colorFamily' | 'vibe' | 'tags'>,
  b: Pick<WardrobeItem, 'colorFamily' | 'vibe' | 'tags'>,
): number {
  const colorScore = COLOR_MATRIX[a.colorFamily][b.colorFamily];
  const vibeScore = VIBE_MATRIX[a.vibe][b.vibe];

  const aTags = new Set(a.tags.map((t) => t.toLowerCase()));
  const sharedTags = b.tags.filter((t) => aTags.has(t.toLowerCase())).length;
  const tagBonus = Math.min(10, sharedTags * 5);

  const hasBold = a.colorFamily === 'bold' || b.colorFamily === 'bold';
  const raw = hasBold
    ? Math.round(colorScore * 0.65 + vibeScore * 0.35 + tagBonus)
    : Math.round(colorScore * 0.48 + vibeScore * 0.52 + tagBonus);
  return Math.max(0, Math.min(100, raw));
}

export function areItemsCompatible(
  a: Pick<WardrobeItem, 'colorFamily' | 'vibe' | 'tags' | 'category'>,
  b: Pick<WardrobeItem, 'colorFamily' | 'vibe' | 'tags' | 'category'>,
): boolean {
  if (a.category === b.category) return false;
  return getPairCompatibilityScore(a, b) >= 62;
}

export function getCompatibleWardrobeIds(
  activeItem: WardrobeItem | TrendingDrop | null,
  wardrobe: WardrobeItem[],
): Set<string> {
  const ids = new Set<string>();
  if (!activeItem) return ids;
  for (const item of wardrobe) {
    if (item.id === activeItem.id) continue;
    if (areItemsCompatible(activeItem, item)) {
      ids.add(item.id);
    }
  }
  return ids;
}

/**
 * Calculates 0-100% compatibility of a candidate item (or trending drop)
 * against the user's current closet across the complementary categories.
 */
export function calculateWardrobeCompatibility(
  candidate: Pick<WardrobeItem, 'category' | 'colorFamily' | 'vibe' | 'tags'>,
  wardrobe: WardrobeItem[],
): number {
  const complementary = wardrobe.filter((w) => w.category !== candidate.category);
  if (complementary.length === 0) return 0;

  const byCategory: Record<string, WardrobeItem[]> = {};
  for (const item of complementary) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }

  // Average the top-matching items in each complementary category so versatile
  // capsule items aren't penalized by one odd piece, while niche items stay low.
  const categoryScores: number[] = [];
  for (const group of Object.values(byCategory)) {
    const scores = group
      .map((item) => getPairCompatibilityScore(candidate, item))
      .sort((a, b) => b - a);
    const topSlice = scores.slice(0, Math.min(2, scores.length));
    const avg = topSlice.reduce((sum, v) => sum + v, 0) / topSlice.length;
    categoryScores.push(avg);
  }

  const totalAvg =
    categoryScores.reduce((sum, v) => sum + v, 0) / categoryScores.length;
  return Math.round(totalAvg);
}

/**
 * Counts how many valid multi-piece outfit combinations the target item unlocks
 * using compatible items from the user's existing closet.
 * A valid outfit requires a Top + Bottom + Footwear (plus optional Outerwear when
 * evaluating Outerwear or layering).
 */
export function calculateUnlockedOutfits(
  target: Pick<WardrobeItem, 'id' | 'category' | 'colorFamily' | 'vibe' | 'tags'>,
  wardrobe: WardrobeItem[],
): number {
  const others = wardrobe.filter((w) => w.id !== target.id);
  const compatTops = others.filter(
    (w) => w.category === 'Tops' && areItemsCompatible(target, w),
  );
  const compatBottoms = others.filter(
    (w) => w.category === 'Bottoms' && areItemsCompatible(target, w),
  );
  const compatFootwear = others.filter(
    (w) => w.category === 'Footwear' && areItemsCompatible(target, w),
  );
  const compatOuterwear = others.filter(
    (w) => w.category === 'Outerwear' && areItemsCompatible(target, w),
  );

  let validCount = 0;

  if (target.category === 'Tops') {
    for (const b of compatBottoms) {
      for (const f of compatFootwear) {
        if (areItemsCompatible(b, f)) {
          validCount += 1;
        }
      }
    }
  } else if (target.category === 'Bottoms') {
    for (const t of compatTops) {
      for (const f of compatFootwear) {
        if (areItemsCompatible(t, f)) {
          validCount += 1;
        }
      }
    }
  } else if (target.category === 'Footwear') {
    for (const t of compatTops) {
      for (const b of compatBottoms) {
        if (areItemsCompatible(t, b)) {
          validCount += 1;
        }
      }
    }
  } else if (target.category === 'Outerwear') {
    for (const t of compatTops) {
      for (const b of compatBottoms) {
        if (!areItemsCompatible(t, b)) continue;
        for (const f of compatFootwear) {
          if (areItemsCompatible(t, f) && areItemsCompatible(b, f)) {
            validCount += 1;
          }
        }
      }
    }
  }

  // Also include layered variations if target is Top/Bottom/Footwear and compatible outerwear exists
  if (target.category !== 'Outerwear' && validCount > 0 && compatOuterwear.length > 0) {
    validCount += Math.min(compatOuterwear.length, validCount);
  }

  return validCount;
}

export function computeShoppingVerdict(
  drop: TrendingDrop,
  wardrobe: WardrobeItem[],
  remainingBudgetInr: number,
): VerdictResult {
  const compatibilityScore = calculateWardrobeCompatibility(drop, wardrobe);
  const unlockedOutfits = calculateUnlockedOutfits(drop, wardrobe);
  const budgetDelta = remainingBudgetInr - drop.priceInr;
  const fitsBudget = budgetDelta >= 0;

  const isHighMatch = compatibilityScore >= 65 && unlockedOutfits >= 2;
  const isLowMatch = compatibilityScore < 45 || unlockedOutfits === 0;

  const compatTops = wardrobe.filter(
    (w) => w.category === 'Tops' && areItemsCompatible(drop, w),
  );
  const compatBottoms = wardrobe.filter(
    (w) => w.category === 'Bottoms' && areItemsCompatible(drop, w),
  );
  const compatFootwear = wardrobe.filter(
    (w) => w.category === 'Footwear' && areItemsCompatible(drop, w),
  );

  const checklist: VerdictResult['checklist'] = [];
  if (drop.category !== 'Tops') {
    checklist.push(
      compatTops.length > 0
        ? {
            text: `Pairs with ${compatTops.slice(0, 2).map((i) => i.name).join(' & ')}`,
            met: true,
          }
        : {
            text: 'Needs a matching top in your wardrobe',
            met: false,
          },
    );
  }
  if (drop.category !== 'Bottoms') {
    checklist.push(
      compatBottoms.length > 0
        ? {
            text: `Works with ${compatBottoms.slice(0, 2).map((i) => i.name).join(' & ')}`,
            met: true,
          }
        : {
            text: 'No compatible bottoms found in closet',
            met: false,
          },
    );
  }
  if (drop.category !== 'Footwear') {
    checklist.push(
      compatFootwear.length > 0
        ? {
            text: `Finishes cleanly with ${compatFootwear.slice(0, 2).map((i) => i.name).join(' & ')}`,
            met: true,
          }
        : {
            text: 'Requires matching footwear to style',
            met: false,
          },
    );
  }
  checklist.push(
    fitsBudget
      ? {
          text: `Within monthly budget — leaves ${formatINR(budgetDelta)} remaining`,
          met: true,
        }
      : {
          text: `Exceeds remaining monthly budget by ${formatINR(Math.abs(budgetDelta))}`,
          met: false,
        },
  );

  if (isHighMatch && fitsBudget) {
    return {
      kind: 'strong-buy',
      headline: 'Strong Buy',
      summary: `Unlocks ${unlockedOutfits} complete outfit${unlockedOutfits === 1 ? '' : 's'} with pieces you already own and keeps ${formatINR(budgetDelta)} in your monthly budget.`,
      compatibilityScore,
      unlockedOutfits,
      fitsBudget,
      budgetDelta,
      checklist,
    };
  }

  if (isLowMatch && fitsBudget) {
    return {
      kind: 'trap-buy',
      headline: 'Trap Buy (Skip)',
      summary: `Even though ${formatINR(drop.priceInr)} fits your budget, it scores only ${compatibilityScore}% with your closet and unlocks ${unlockedOutfits} outfit${unlockedOutfits === 1 ? '' : 's'}—you would need to buy extra matching pieces.`,
      compatibilityScore,
      unlockedOutfits,
      fitsBudget,
      budgetDelta,
      checklist,
    };
  }

  if (isHighMatch && !fitsBudget) {
    return {
      kind: 'wait-budget',
      headline: 'Wait for Next Month',
      summary: `Strong ${compatibilityScore}% closet match unlocking ${unlockedOutfits} outfit${unlockedOutfits === 1 ? '' : 's'}, but it pushes you ${formatINR(Math.abs(budgetDelta))} over your remaining monthly limit.`,
      compatibilityScore,
      unlockedOutfits,
      fitsBudget,
      budgetDelta,
      checklist,
    };
  }

  if (isLowMatch && !fitsBudget) {
    return {
      kind: 'skip-both',
      headline: 'Hard Skip',
      summary: `Low ${compatibilityScore}% wardrobe synergy and ${formatINR(Math.abs(budgetDelta))} over budget. Save your allowance for higher-versatility staples.`,
      compatibilityScore,
      unlockedOutfits,
      fitsBudget,
      budgetDelta,
      checklist,
    };
  }

  if (!fitsBudget) {
    return {
      kind: 'wait-budget',
      headline: 'Wait for Next Month',
      summary: `Moderate ${compatibilityScore}% match (${unlockedOutfits} outfits), and currently ${formatINR(Math.abs(budgetDelta))} above your remaining monthly budget.`,
      compatibilityScore,
      unlockedOutfits,
      fitsBudget,
      budgetDelta,
      checklist,
    };
  }

  return {
    kind: 'consider',
    headline: 'Selective Fit',
    summary: `Fits your budget with ${formatINR(budgetDelta)} left, but pairs selectively (${compatibilityScore}% match, ${unlockedOutfits} outfits). Worth grabbing only if you want that specific silhouette.`,
    compatibilityScore,
    unlockedOutfits,
    fitsBudget,
    budgetDelta,
    checklist,
  };
}

export interface DropPriceChartPoint {
  id: string;
  shortLabel: string;
  fullName: string;
  brand: string;
  storeName: string;
  priceInr: number;
  fitsBudget: boolean;
}

export interface VisibleDropsPriceSummary {
  points: DropPriceChartPoint[];
  avgPriceInr: number;
  maxPriceInr: number;
}

export function buildVisibleDropsPriceData(
  drops: TrendingDrop[],
  remainingBudgetInr: number,
): VisibleDropsPriceSummary {
  if (drops.length === 0) {
    return { points: [], avgPriceInr: 0, maxPriceInr: 0 };
  }

  const points: DropPriceChartPoint[] = drops.map((drop) => {
    const words = drop.name.trim().split(/\s+/);
    const rawShort = words[words.length - 1] ?? drop.name;
    const shortLabel =
      rawShort.length > 8 ? `${rawShort.slice(0, 7)}…` : rawShort;

    return {
      id: drop.id,
      shortLabel,
      fullName: drop.name,
      brand: drop.brand,
      storeName: drop.storeName,
      priceInr: drop.priceInr,
      fitsBudget: drop.priceInr <= remainingBudgetInr,
    };
  });

  const total = drops.reduce((sum, d) => sum + d.priceInr, 0);
  const avgPriceInr = Math.round(total / drops.length);
  const maxPriceInr = Math.max(...drops.map((d) => d.priceInr));

  return { points, avgPriceInr, maxPriceInr };
}

export type PalettePairingRole =
  | 'Complementary'
  | 'Neutral Anchor'
  | 'Tonal Match';

export interface ColorPaletteSuggestion {
  itemId: string;
  itemName: string;
  category: GarmentCategory;
  colorName: string;
  colorHex: string;
  colorFamily: ColorFamily;
  role: PalettePairingRole;
  reason: string;
  harmonyScore: number;
}

export interface ColorPaletteAnalysis {
  dropColorName: string;
  dropColorHex: string;
  dropColorFamily: ColorFamily;
  headline: string;
  suggestions: ColorPaletteSuggestion[];
}

function getHexLuminance(hex: string): number {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return 0.5;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function classifyColorPairing(
  drop: Pick<TrendingDrop, 'colorName' | 'colorHex' | 'colorFamily'>,
  item: Pick<WardrobeItem, 'colorName' | 'colorHex' | 'colorFamily'>,
): { role: PalettePairingRole; reason: string; baseScore: number } | null {
  const dropColorLower = drop.colorName.toLowerCase();
  const itemColorLower = item.colorName.toLowerCase();

  if (drop.colorFamily === 'bold') {
    if (item.colorFamily === 'neutral') {
      return {
        role: 'Neutral Anchor',
        reason: `Grounds ${dropColorLower} cleanly without competing for attention.`,
        baseScore: 92,
      };
    }
    return null;
  }

  if (drop.colorFamily === 'earth') {
    if (item.colorFamily === 'cool') {
      return {
        role: 'Complementary',
        reason: `Cool ${itemColorLower} contrast sharpens earthy ${dropColorLower}.`,
        baseScore: 90,
      };
    }
    if (item.colorFamily === 'neutral') {
      return {
        role: 'Neutral Anchor',
        reason: `Crisp neutral balance that frames ${dropColorLower} effortlessly.`,
        baseScore: 94,
      };
    }
    if (item.colorFamily === 'earth') {
      return {
        role: 'Tonal Match',
        reason: `Warm tonal layering alongside ${dropColorLower}.`,
        baseScore: 86,
      };
    }
    return null;
  }

  if (drop.colorFamily === 'cool') {
    if (item.colorFamily === 'earth') {
      return {
        role: 'Complementary',
        reason: `Warm ${itemColorLower} softens and complements ${dropColorLower}.`,
        baseScore: 91,
      };
    }
    if (item.colorFamily === 'neutral') {
      return {
        role: 'Neutral Anchor',
        reason: `Clean neutral anchor that keeps ${dropColorLower} sharp.`,
        baseScore: 94,
      };
    }
    if (item.colorFamily === 'cool') {
      return {
        role: 'Tonal Match',
        reason: `Layered cool monochrome depth with ${dropColorLower}.`,
        baseScore: 84,
      };
    }
    return null;
  }

  // drop.colorFamily === 'neutral'
  if (item.colorFamily === 'earth') {
    return {
      role: 'Complementary',
      reason: `Adds organic warmth against neutral ${dropColorLower}.`,
      baseScore: 95,
    };
  }
  if (item.colorFamily === 'cool') {
    return {
      role: 'Complementary',
      reason: `Introduces rich cool depth beside ${dropColorLower}.`,
      baseScore: 92,
    };
  }
  if (item.colorFamily === 'neutral') {
    return {
      role: 'Tonal Match',
      reason: `Sleek tonal monochrome pairing with ${dropColorLower}.`,
      baseScore: 88,
    };
  }
  return null;
}

function hexColorDistance(hexA: string, hexB: string): number {
  const cleanA = hexA.trim().replace(/^#/, '');
  const cleanB = hexB.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleanA) || !/^[0-9a-fA-F]{6}$/.test(cleanB)) {
    return 999;
  }
  const dr = parseInt(cleanA.slice(0, 2), 16) - parseInt(cleanB.slice(0, 2), 16);
  const dg = parseInt(cleanA.slice(2, 4), 16) - parseInt(cleanB.slice(2, 4), 16);
  const db = parseInt(cleanA.slice(4, 6), 16) - parseInt(cleanB.slice(4, 6), 16);
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function buildColorPaletteSuggestions(
  drop: Pick<TrendingDrop, 'id' | 'category' | 'colorName' | 'colorHex' | 'colorFamily'>,
  wardrobe: WardrobeItem[],
  maxSuggestions = 4,
): ColorPaletteAnalysis {
  const candidates = wardrobe.filter(
    (item) => item.id !== drop.id && item.category !== drop.category,
  );

  const dropLum = getHexLuminance(drop.colorHex);
  const scored: ColorPaletteSuggestion[] = [];

  for (const item of candidates) {
    const classified = classifyColorPairing(drop, item);
    if (!classified) continue;

    const itemLum = getHexLuminance(item.colorHex);
    const contrastDiff = Math.abs(dropLum - itemLum);
    const contrastBonus = Math.round(contrastDiff * 8);
    const harmonyScore = Math.min(100, classified.baseScore + contrastBonus);

    scored.push({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      colorName: item.colorName,
      colorHex: item.colorHex,
      colorFamily: item.colorFamily,
      role: classified.role,
      reason: classified.reason,
      harmonyScore,
    });
  }

  scored.sort((a, b) => b.harmonyScore - a.harmonyScore);

  const uniqueByTone: ColorPaletteSuggestion[] = [];
  const seenColorKeys = new Set<string>();
  for (const entry of scored) {
    const key = entry.colorName.trim().toLowerCase();
    if (seenColorKeys.has(key)) continue;
    if (
      uniqueByTone.some(
        (existing) => hexColorDistance(existing.colorHex, entry.colorHex) < 32,
      )
    ) {
      continue;
    }
    seenColorKeys.add(key);
    uniqueByTone.push(entry);
  }

  // Ensure both Complementary & Neutral Anchor tones appear near the top when available
  const picked: ColorPaletteSuggestion[] = [];
  const rolesOrder: PalettePairingRole[] = [
    'Complementary',
    'Neutral Anchor',
    'Tonal Match',
  ];
  for (const role of rolesOrder) {
    const match = uniqueByTone.find(
      (s) => s.role === role && !picked.some((p) => p.itemId === s.itemId),
    );
    if (match && picked.length < maxSuggestions) {
      picked.push(match);
    }
  }
  for (const s of uniqueByTone) {
    if (picked.length >= maxSuggestions) break;
    if (!picked.some((p) => p.itemId === s.itemId)) {
      picked.push(s);
    }
  }

  picked.sort((a, b) => b.harmonyScore - a.harmonyScore);

  let headline: string;
  if (picked.length === 0) {
    headline = `No non-clashing ${drop.colorName.toLowerCase()} pairings found in your current closet—pair with black, white, or charcoal staples.`;
  } else if (drop.colorFamily === 'bold') {
    headline = `Anchor ${drop.colorName} with crisp wardrobe neutrals so the statement tone stays balanced.`;
  } else if (drop.colorFamily === 'earth') {
    headline = `Pair ${drop.colorName} with cool indigo contrasts or clean neutral tones already in your closet.`;
  } else if (drop.colorFamily === 'cool') {
    headline = `Warm up ${drop.colorName} with earthy tones and crisp neutrals from your wardrobe.`;
  } else {
    headline = `${drop.colorName} acts as a versatile base—layer with earthy, cool, or tonal neutrals below.`;
  }

  return {
    dropColorName: drop.colorName,
    dropColorHex: drop.colorHex,
    dropColorFamily: drop.colorFamily,
    headline,
    suggestions: picked,
  };
}


