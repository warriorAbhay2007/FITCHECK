import {
  BodyTypeId,
  BottomRailTab,
  ClosetSourceFilter,
  FitPreference,
  MirrorLighting,
  OccasionFilter,
  OccasionTag,
  OutfitSlots,
  RailSubcategory,
  ShoeRackTab,
  SkinToneId,
  Undertone,
  UpperRailTab,
  WardrobeItem,
  WardrobeProfile,
  WardrobeSize,
} from '../types/wardrobe';
import { areItemsCompatible } from './wardrobeLogic';

export const UPPER_RAIL_TABS: UpperRailTab[] = [
  'T-Shirts',
  'Shirts',
  'Hoodies & Sweatshirts',
  'Jackets & Outerwear',
];

export const BOTTOM_RAIL_TABS: BottomRailTab[] = [
  'Jeans',
  'Trousers & Chinos',
  'Cargos & Joggers',
  'Shorts',
];

export const SHOE_RACK_TABS: ShoeRackTab[] = [
  'Sneakers',
  'Casual & Loafers',
  'Boots & Formal',
];

export const OCCASION_FILTERS: OccasionFilter[] = [
  'All',
  'College Daily',
  'Streetwear',
  'Smart Casual',
  'Festive',
];

export interface SkinToneOption {
  id: SkinToneId;
  label: string;
  swatchHex: string;
  depthGroup: 'light' | 'medium' | 'deep';
  contrastPreference: string;
}

export const SKIN_TONE_OPTIONS: SkinToneOption[] = [
  {
    id: 'fair',
    label: 'Fair',
    swatchHex: '#F3D6C1',
    depthGroup: 'light',
    contrastPreference: 'Medium-soft charcoal, sage, and muted earth tones balance brightness without overpowering.',
  },
  {
    id: 'wheatish',
    label: 'Wheatish',
    swatchHex: '#DDA982',
    depthGroup: 'medium',
    contrastPreference: 'Warm ivory, olive, espresso, and deep indigo bring out natural golden clarity.',
  },
  {
    id: 'medium',
    label: 'Medium',
    swatchHex: '#C68B5E',
    depthGroup: 'medium',
    contrastPreference: 'Crisp off-white, navy, charcoal, and warm sand keep contrast sharp and balanced.',
  },
  {
    id: 'olive',
    label: 'Olive',
    swatchHex: '#AE7F52',
    depthGroup: 'medium',
    contrastPreference: 'Oatmeal, slate black, forest olive, and raw indigo avoid sallow greens.',
  },
  {
    id: 'tan',
    label: 'Tan',
    swatchHex: '#8E5A38',
    depthGroup: 'deep',
    contrastPreference: 'Cream, warm sand, roasted espresso, and clean charcoal create rich depth.',
  },
  {
    id: 'deep',
    label: 'Deep',
    swatchHex: '#5B3724',
    depthGroup: 'deep',
    contrastPreference: 'Crisp white, oatmeal, olive sage, and high-clarity dark neutrals pop effortlessly.',
  },
];

export interface BodyTypeOption {
  id: BodyTypeId;
  label: string;
  shortLabel: string;
  frameSummary: string;
}

export const BODY_TYPE_OPTIONS: BodyTypeOption[] = [
  {
    id: 'lean',
    label: 'Lean / Ectomorph',
    shortLabel: 'Lean',
    frameSummary: 'Narrower shoulders & slim torso that benefit from structured layering and relaxed drape.',
  },
  {
    id: 'athletic',
    label: 'Athletic',
    shortLabel: 'Athletic',
    frameSummary: 'Balanced shoulder-to-waist taper suited to clean regular or tailored cuts.',
  },
  {
    id: 'average',
    label: 'Average',
    shortLabel: 'Average',
    frameSummary: 'Versatile mid-frame proportions suited to crisp straight bottoms and light layering.',
  },
  {
    id: 'broad',
    label: 'Broad / Muscular',
    shortLabel: 'Broad',
    frameSummary: 'Wider shoulders & chest needing shoulder ease and straight-cut legs for proportion.',
  },
  {
    id: 'heavy',
    label: 'Heavy / Stocky',
    shortLabel: 'Heavy',
    frameSummary: 'Fuller torso benefiting from vertical open layers, monochrome columns, and structured straight fits.',
  },
];

export const DEFAULT_WARDROBE_PROFILE: WardrobeProfile = {
  skinTone: 'wheatish',
  undertone: 'Warm',
  size: 'M',
  fitPreference: 'Regular',
  bodyType: 'average',
  lighting: 'Warm Indoor',
  layerOverBase: true,
};

export interface ColorHarmonyResult {
  score: number;
  ratingLabel: string;
  tip: string;
  lightingNote: string;
  colorBlockingNote: string;
}

function getHexLuminance(hex: string): number {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return 0.5;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function computeColorHarmony(
  slots: OutfitSlots,
  skinToneId: SkinToneId,
  undertone: Undertone,
  lighting: MirrorLighting,
): ColorHarmonyResult {
  const equipped = Object.values(slots).filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );

  const skin =
    SKIN_TONE_OPTIONS.find((s) => s.id === skinToneId) ?? SKIN_TONE_OPTIONS[1];

  const lightingNote =
    lighting === 'Daylight'
      ? 'Natural daylight reveals true undertones and fabric contrast.'
      : lighting === 'Warm Indoor'
        ? 'Warm indoor LED light flatters earthy olives, sands, and espresso tones.'
        : 'Evening ambient light deepens dark neutrals—bright collars add crisp definition.';

  if (equipped.length === 0) {
    return {
      score: 0,
      ratingLabel: 'No Garments',
      tip: 'Pick garments from any rail tab to evaluate color harmony with your skin tone.',
      lightingNote,
      colorBlockingNote: 'Equip a top and bottom to evaluate color-blocking contrast.',
    };
  }

  const upperItems = [slots.outerwear, slots.top].filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
  const focalItems = upperItems.length > 0 ? upperItems : equipped;

  let baseScore = 76;
  const highlights: string[] = [];
  const cautions: string[] = [];

  for (const item of focalItems) {
    const fam = item.colorFamily;
    const lum = getHexLuminance(item.colorHex);

    if (undertone === 'Warm') {
      if (fam === 'earth') {
        baseScore += 10;
        highlights.push(`${item.colorName} echoes your warm undertone`);
      } else if (fam === 'neutral') {
        baseScore += 6;
      } else if (fam === 'cool') {
        baseScore += 2;
      } else if (fam === 'bold') {
        baseScore -= 12;
        cautions.push(`${item.colorName} may overpower warm skin`);
      }
    } else if (undertone === 'Cool') {
      if (fam === 'cool') {
        baseScore += 10;
        highlights.push(`${item.colorName} sharpens cool undertones`);
      } else if (fam === 'neutral') {
        baseScore += 8;
      } else if (fam === 'earth') {
        baseScore += 2;
      } else if (fam === 'bold') {
        baseScore -= 8;
        cautions.push(`${item.colorName} pulls sharp contrast near the face`);
      }
    } else {
      if (fam === 'neutral' || fam === 'earth' || fam === 'cool') {
        baseScore += 7;
        if (highlights.length === 0) {
          highlights.push(`${item.colorName} keeps balanced neutral harmony`);
        }
      } else if (fam === 'bold') {
        baseScore -= 10;
        cautions.push(`${item.colorName} needs neutral grounding`);
      }
    }

    if (skin.depthGroup === 'light' && lum > 0.82 && !slots.outerwear) {
      baseScore -= 5;
      cautions.push(`layer an overshirt over ${item.colorName} for facial contrast`);
    } else if (skin.depthGroup === 'deep' && lum > 0.55) {
      baseScore += 6;
      if (highlights.length < 2) {
        highlights.push(`${item.colorName} adds crisp luminance contrast`);
      }
    } else if (skin.depthGroup === 'medium' && lum >= 0.14 && lum <= 0.65) {
      baseScore += 4;
    }
  }

  if (slots.top && slots.bottom) {
    if (areItemsCompatible(slots.top, slots.bottom)) {
      baseScore += 5;
    } else {
      baseScore -= 10;
      cautions.push('top and bottom tones compete');
    }
  }

  if (slots.outerwear && slots.top) {
    if (areItemsCompatible(slots.outerwear, slots.top)) {
      baseScore += 4;
    } else {
      baseScore -= 6;
    }
  }

  if (
    lighting === 'Warm Indoor' &&
    focalItems.some((i) => i.colorFamily === 'earth')
  ) {
    baseScore += 3;
  } else if (
    lighting === 'Evening' &&
    focalItems.every((i) => getHexLuminance(i.colorHex) < 0.08)
  ) {
    baseScore -= 4;
    cautions.push('all-dark layers soften in evening light—try an ivory or white inner tee');
  }

  const score = Math.max(25, Math.min(98, Math.round(baseScore)));

  let ratingLabel = 'Balanced Pairing';
  if (score >= 88) ratingLabel = 'Signature Match';
  else if (score >= 74) ratingLabel = 'Flattering Match';
  else if (score >= 58) ratingLabel = 'Workable Mix';
  else ratingLabel = 'High Clash Risk';

  let tip: string;
  if (cautions.length > 0 && score < 76) {
    tip = `For ${skin.label} (${undertone}): ${cautions[0]}. ${skin.contrastPreference}`;
  } else if (highlights.length > 0) {
    tip = `Great on ${skin.label} (${undertone}) skin: ${highlights[0]}.`;
  } else {
    tip = `Clean pairing for ${skin.label} (${undertone}): ${skin.contrastPreference}`;
  }

  let colorBlockingNote = 'Single-piece tone—add a contrasting bottom or layer to complete color blocking.';
  const primaryUpper = slots.outerwear ?? slots.top;
  if (slots.outerwear && slots.top && slots.bottom) {
    colorBlockingNote = `3-piece color block: ${slots.outerwear.colorName} over ${slots.top.colorName} anchored by ${slots.bottom.colorName}.`;
  } else if (primaryUpper && slots.bottom) {
    const compat = areItemsCompatible(primaryUpper, slots.bottom);
    colorBlockingNote = compat
      ? `Balanced color block: ${primaryUpper.colorName} pairs cleanly with ${slots.bottom.colorName}.`
      : `High-contrast mix: ${primaryUpper.colorName} & ${slots.bottom.colorName}—anchor with neutral sneakers.`;
  } else if (slots.outerwear && slots.top) {
    colorBlockingNote = `Layered contrast: ${slots.outerwear.colorName} frames ${slots.top.colorName}.`;
  }

  return {
    score,
    ratingLabel,
    tip,
    lightingNote,
    colorBlockingNote,
  };
}

export interface BrandSizingNote {
  brand: string;
  recommendedSize: string;
  fitAdvice: string;
}

const SIZE_ORDER: WardrobeSize[] = ['S', 'M', 'L', 'XL'];

function shiftSize(size: WardrobeSize, delta: -1 | 0 | 1): string {
  const idx = SIZE_ORDER.indexOf(size);
  if (idx === -1) return size;
  const next = idx + delta;
  if (next < 0) return 'XS';
  if (next >= SIZE_ORDER.length) return 'XXL';
  return SIZE_ORDER[next];
}

export function getBrandSizingNotes(
  size: WardrobeSize,
  fitPreference: FitPreference,
  slots: OutfitSlots,
): BrandSizingNote[] {
  const isRelaxedPref = fitPreference === 'Relaxed/Oversized';
  const isSlimPref = fitPreference === 'Slim';
  const hasBoxyEquipped = [slots.outerwear, slots.top].some(
    (item) => item && (item.fit === 'Oversized' || item.fit === 'Boxy'),
  );

  return [
    {
      brand: 'Zudio',
      recommendedSize: isRelaxedPref ? shiftSize(size, 1) : size,
      fitAdvice: isRelaxedPref
        ? `Runs slightly tapered in regular tees—size up to ${shiftSize(size, 1)} for relaxed drape.`
        : `True to size in ${size} across everyday tees and cargos.`,
    },
    {
      brand: 'Westside',
      recommendedSize:
        hasBoxyEquipped && isSlimPref ? shiftSize(size, -1) : size,
      fitAdvice:
        'ETA & Nuon cuts lean relaxed across shoulders; stick to your regular size unless wanting boxy volume.',
    },
    {
      brand: 'Trends',
      recommendedSize: isRelaxedPref ? shiftSize(size, 1) : size,
      fitAdvice: isRelaxedPref
        ? `DNMX & Netplay shirts cut neat at the chest—pick ${shiftSize(size, 1)} for layering over tees.`
        : `Standard Indian regular block in ${size} across shirts and chinos.`,
    },
    {
      brand: 'The Souled Store',
      recommendedSize: isSlimPref ? shiftSize(size, -1) : size,
      fitAdvice: isSlimPref
        ? `Oversized heavy-jersey tees run roomy—step down to ${shiftSize(size, -1)} for cleaner shoulders.`
        : `Signature drop-shoulder cut hits naturally at ${size}.`,
    },
    {
      brand: 'Van Heusen',
      recommendedSize: isRelaxedPref ? shiftSize(size, 1) : size,
      fitAdvice: isRelaxedPref
        ? `Tailored Oxford & trouser blocks fit trim—take ${shiftSize(size, 1)} for breathable room.`
        : `Structured shoulder seams in ${size} work best for Smart Casual layers.`,
    },
    {
      brand: 'Cantabil',
      recommendedSize: size,
      fitAdvice:
        'Classic straight-cut trousers, blazers, and knits match standard sizing with comfortable waist ease.',
    },
  ];
}

export function inferItemOccasions(item: WardrobeItem): OccasionTag[] {
  if (item.occasionTags && item.occasionTags.length > 0) {
    return item.occasionTags;
  }
  const derived = new Set<OccasionTag>();
  if (item.vibe === 'Streetwear') derived.add('Streetwear');
  if (item.vibe === 'Smart Casual') derived.add('Smart Casual');
  if (item.vibe === 'Minimalist' || item.vibe === 'Casual') {
    derived.add('College Daily');
  }
  if (item.tags.includes('festive')) derived.add('Festive');
  if (derived.size === 0) derived.add('College Daily');
  return Array.from(derived);
}

export function inferItemRailTab(item: WardrobeItem): RailSubcategory {
  if (item.railTab) return item.railTab;

  if (item.category === 'Tops') {
    if (item.silhouette === 'shirt' || item.silhouette === 'kurta') return 'Shirts';
    if (item.silhouette === 'hoodie' || item.silhouette === 'knit') {
      return 'Hoodies & Sweatshirts';
    }
    return 'T-Shirts';
  }
  if (item.category === 'Outerwear') {
    if (item.silhouette === 'shirt') return 'Shirts';
    if (item.silhouette === 'hoodie') return 'Hoodies & Sweatshirts';
    return 'Jackets & Outerwear';
  }
  if (item.category === 'Bottoms') {
    if (item.silhouette === 'denim') return 'Jeans';
    if (item.silhouette === 'trousers') return 'Trousers & Chinos';
    if (item.silhouette === 'shorts') return 'Shorts';
    return 'Cargos & Joggers';
  }
  if (item.silhouette === 'loafers') return 'Casual & Loafers';
  if (item.silhouette === 'boots') return 'Boots & Formal';
  return 'Sneakers';
}

export function filterByClosetSource(
  items: WardrobeItem[],
  source: ClosetSourceFilter,
): WardrobeItem[] {
  if (source === 'mine') return items.filter((item) => Boolean(item.isUserUploaded));
  if (source === 'catalog') return items.filter((item) => !item.isUserUploaded);
  return items;
}

export function filterWardrobeByOccasion(
  items: WardrobeItem[],
  filter: OccasionFilter,
): WardrobeItem[] {
  if (filter === 'All') return items;
  return items.filter((item) => inferItemOccasions(item).includes(filter));
}

export function filterItemsByRailTab(
  items: WardrobeItem[],
  railTab: RailSubcategory,
  occasionFilter: OccasionFilter,
  closetSource: ClosetSourceFilter = 'all',
): WardrobeItem[] {
  const bySource = filterByClosetSource(items, closetSource);
  const byOccasion = filterWardrobeByOccasion(bySource, occasionFilter);
  return byOccasion.filter((item) => inferItemRailTab(item) === railTab);
}

export function isLayerableUpperGarment(item: WardrobeItem): boolean {
  if (item.layerable !== undefined) return item.layerable;
  return item.category === 'Outerwear';
}

export function applyGarmentSelection(
  currentSlots: OutfitSlots,
  item: WardrobeItem,
  layerOverBase: boolean,
): OutfitSlots {
  if (item.category === 'Bottoms') {
    return { ...currentSlots, bottom: item };
  }
  if (item.category === 'Footwear') {
    return { ...currentSlots, footwear: item };
  }

  // Upperwear: Layerable outer pieces (jackets, overshirts, zip hoodies, flannels)
  if (isLayerableUpperGarment(item)) {
    if (layerOverBase) {
      return {
        ...currentSlots,
        outerwear: currentSlots.outerwear?.id === item.id ? null : item,
      };
    }
    // Single-piece mode: wear jacket/zip-up without layering over a base tee
    return {
      ...currentSlots,
      outerwear: item,
      top: null,
    };
  }

  // Base Top (T-Shirts, Shirts, Pullover Hoodies)
  return {
    ...currentSlots,
    top: item,
  };
}

export function shuffleWardrobeOutfit(
  wardrobe: WardrobeItem[],
  currentSlots: OutfitSlots,
  includeOuterLayer: boolean,
  occasionFilter: OccasionFilter = 'All',
): OutfitSlots {
  const scoped = filterWardrobeByOccasion(wardrobe, occasionFilter);
  const pool = scoped.length >= 4 ? scoped : wardrobe;

  const tops = pool.filter((i) => i.category === 'Tops');
  const bottoms = pool.filter((i) => i.category === 'Bottoms');
  const footwear = pool.filter((i) => i.category === 'Footwear');
  const outerwear = pool.filter((i) => i.category === 'Outerwear');

  const safeTops = tops.length > 0 ? tops : wardrobe.filter((i) => i.category === 'Tops');
  const safeBottoms = bottoms.length > 0 ? bottoms : wardrobe.filter((i) => i.category === 'Bottoms');
  const safeShoes = footwear.length > 0 ? footwear : wardrobe.filter((i) => i.category === 'Footwear');
  const safeOuter = outerwear.length > 0 ? outerwear : wardrobe.filter((i) => i.category === 'Outerwear');

  const pickRandom = <T,>(arr: T[]): T | null =>
    arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

  const altTops =
    safeTops.length > 1 && currentSlots.top
      ? safeTops.filter((t) => t.id !== currentSlots.top?.id)
      : safeTops;
  const chosenTop = pickRandom(altTops);

  const compatBottoms = chosenTop
    ? safeBottoms.filter((b) => areItemsCompatible(chosenTop, b))
    : safeBottoms;
  const chosenBottom = pickRandom(
    compatBottoms.length > 0 ? compatBottoms : safeBottoms,
  );

  const compatShoes = safeShoes.filter(
    (f) =>
      (!chosenTop || areItemsCompatible(chosenTop, f)) &&
      (!chosenBottom || areItemsCompatible(chosenBottom, f)),
  );
  const chosenShoes = pickRandom(
    compatShoes.length > 0 ? compatShoes : safeShoes,
  );

  let chosenLayer: WardrobeItem | null = null;
  if (includeOuterLayer && safeOuter.length > 0) {
    const compatLayers = safeOuter.filter(
      (o) =>
        (!chosenTop || areItemsCompatible(chosenTop, o)) &&
        (!chosenBottom || areItemsCompatible(chosenBottom, o)),
    );
    chosenLayer = pickRandom(
      compatLayers.length > 0 ? compatLayers : safeOuter,
    );
  }

  return {
    outerwear: chosenLayer,
    top: chosenTop,
    bottom: chosenBottom,
    footwear: chosenShoes,
  };
}

export function buildShareCardText(
  title: string,
  slots: OutfitSlots,
  harmony: ColorHarmonyResult,
  profile: WardrobeProfile,
): string {
  const skin =
    SKIN_TONE_OPTIONS.find((s) => s.id === profile.skinTone)?.label ?? 'Wheatish';
  const pieces = (
    [
      ['Outer Layer', slots.outerwear],
      ['Base Top', slots.top],
      ['Bottomwear', slots.bottom],
      ['Footwear', slots.footwear],
    ] as const
  )
    .filter(([, item]) => item !== null)
    .map(([label, item]) => `• ${label}: ${item!.name} (${item!.colorName})`);

  return [
    `FitCheck AI Look — ${title}`,
    `Harmony: ${harmony.score}% (${harmony.ratingLabel}) · ${skin} (${profile.undertone}) · Size ${profile.size} (${profile.fitPreference}) · ${profile.lighting} Mirror`,
    ...pieces,
    `Styling Note: ${harmony.tip}`,
  ].join('\n');
}
