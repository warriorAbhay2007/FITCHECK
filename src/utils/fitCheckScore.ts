import {
  BodyTypeId,
  OutfitSlots,
  SlotKey,
  WardrobeItem,
  WardrobeProfile,
} from '../types/wardrobe';
import { areItemsCompatible } from './wardrobeLogic';
import {
  BODY_TYPE_OPTIONS,
  ColorHarmonyResult,
  applyGarmentSelection,
  computeColorHarmony,
  isLayerableUpperGarment,
} from './wardrobeStyling';

export type FitBadgeTier = 'Sharp Fit' | 'Strong Base' | 'Needs Tweaks' | 'Empty Look';

export interface FitCheckBreakdown {
  bodyTypeFit: number;
  colorHarmony: number;
  outfitCoordination: number;
}

export interface BodyTypeVerdict {
  bodyTypeId: BodyTypeId;
  bodyTypeLabel: string;
  headline: string;
  drapeSummary: string;
  proportionTip: string;
}

export interface FitUpgradeSuggestion {
  item: WardrobeItem;
  targetSlot: SlotKey;
  slotAction: string;
  reason: string;
  projectedScore: number;
  scoreDelta: number;
}

export interface FitCheckEvaluation {
  overallScore: number;
  badgeLabel: FitBadgeTier;
  breakdown: FitCheckBreakdown;
  harmony: ColorHarmonyResult;
  bodyTypeVerdict: BodyTypeVerdict;
  upgrades: FitUpgradeSuggestion[];
}

function clampScore(val: number): number {
  return Math.max(20, Math.min(99, Math.round(val)));
}

function evaluateBodyTypeFit(
  slots: OutfitSlots,
  profile: WardrobeProfile,
): { score: number; headline: string; drapeSummary: string; proportionTip: string } {
  const bodyOpt =
    BODY_TYPE_OPTIONS.find((b) => b.id === profile.bodyType) ?? BODY_TYPE_OPTIONS[2];
  const upper = slots.outerwear ?? slots.top;
  const baseTop = slots.top;
  const bottom = slots.bottom;

  let score = 74;
  const notes: string[] = [];
  let tip = '';

  const isWideTop =
    upper && (upper.fit === 'Oversized' || upper.fit === 'Boxy' || upper.fit === 'Relaxed');
  const isSlimTop = upper && (upper.fit === 'Slim' || upper.fit === 'Tailored');
  const isWideBottom =
    bottom && (bottom.fit === 'Oversized' || bottom.fit === 'Relaxed' || bottom.silhouette === 'cargo');
  const isSlimBottom =
    bottom && (bottom.fit === 'Slim' || bottom.fit === 'Tailored');
  const isStraightBottom =
    bottom && (bottom.fit === 'Straight' || bottom.fit === 'Regular');

  switch (profile.bodyType) {
    case 'lean': {
      if (slots.outerwear && slots.top) {
        score += 12;
        notes.push(
          `${slots.outerwear.name} layered over ${slots.top.name} builds clean shoulder breadth across a lean frame.`,
        );
      } else if (isWideTop) {
        score += 9;
        notes.push(`${upper!.name} adds natural chest and shoulder structure without clinging.`);
      } else if (isSlimTop && !slots.outerwear) {
        score -= 10;
        notes.push(
          `${upper!.name} in a trim cut can look narrow on lean shoulders without an outer layer.`,
        );
      }

      if (isWideBottom || isStraightBottom) {
        score += 8;
        notes.push(`${bottom!.name} keeps leg volume proportional from hip to ankle.`);
      } else if (isSlimBottom) {
        score -= 8;
        tip = 'Swap skinny/slim bottoms for straight or relaxed cuts to add lower-body balance.';
      }
      if (!tip) {
        tip = slots.outerwear
          ? `Size ${profile.size} gives crisp shoulder definition—keep the outer layer unbuttoned for vertical depth.`
          : 'Adding an overshirt or boxy jacket instantly broadens your upper silhouette.';
      }
      break;
    }

    case 'athletic': {
      if (upper && (upper.fit === 'Regular' || upper.fit === 'Tailored' || upper.fit === 'Relaxed')) {
        score += 11;
        notes.push(
          `${upper.name} follows an athletic chest-to-waist V-taper cleanly without pulling.`,
        );
      } else if (isWideTop && isWideBottom) {
        score -= 8;
        notes.push('Double oversized volume hides natural athletic shoulder-to-waist definition.');
      }

      if (isStraightBottom || isSlimBottom) {
        score += 9;
        notes.push(`${bottom!.name} frames thigh and calf proportions cleanly.`);
      } else if (bottom?.fit === 'Oversized') {
        score -= 4;
        tip = 'Try a cleaner straight or tapered chino/jean to sharpen your lower silhouette.';
      }
      if (!tip) {
        tip = `Size ${profile.size} (${profile.fitPreference}) highlights shoulder structure while keeping waist drape neat.`;
      }
      break;
    }

    case 'broad': {
      if (upper && (upper.fit === 'Regular' || upper.fit === 'Relaxed' || upper.fit === 'Oversized')) {
        score += 10;
        notes.push(
          `${upper.name} leaves comfortable ease across broad shoulders and chest seams.`,
        );
      } else if (isSlimTop) {
        score -= 12;
        notes.push(
          `${upper!.name} may pull across broad shoulders and upper back in Size ${profile.size}.`,
        );
        tip = 'Pick a regular or relaxed upper layer so shoulder seams sit smoothly without tension.';
      }

      if (isStraightBottom || isWideBottom) {
        score += 9;
        notes.push(`${bottom!.name} anchors wider shoulders with balanced straight-leg drape.`);
      } else if (isSlimBottom) {
        score -= 11;
        notes.push(`${bottom!.name} tapers too aggressively beneath a broad upper frame.`);
        tip = 'Swap slim bottoms for straight jeans or relaxed trousers to avoid top-heavy proportions.';
      }
      if (!tip) {
        tip = 'Open-front layering and straight-leg hems keep upper and lower proportions balanced.';
      }
      break;
    }

    case 'heavy': {
      if (slots.outerwear && slots.top) {
        score += 13;
        notes.push(
          `Open ${slots.outerwear.name} over ${slots.top.name} creates vertical framing lines that streamline the midsection.`,
        );
      } else if (upper && (upper.fit === 'Regular' || upper.fit === 'Straight')) {
        score += 7;
        notes.push(`${upper.name} skims cleanly over the torso without clinging.`);
      } else if (isSlimTop) {
        score -= 12;
        notes.push(`${upper!.name} in a slim block risks pulling at the chest and midsection.`);
      } else if (upper?.fit === 'Boxy' && bottom?.fit === 'Oversized') {
        score -= 8;
        notes.push('Boxy top paired with baggy bottoms adds extra horizontal bulk.');
      }

      if (isStraightBottom) {
        score += 9;
        notes.push(`${bottom!.name} gives a clean, unbroken leg line from waist to shoe.`);
      } else if (bottom?.silhouette === 'shorts' || isSlimBottom) {
        score -= 7;
        tip = 'Straight-cut trousers or dark indigo jeans elongate your frame best.';
      }
      if (!tip) {
        tip = slots.outerwear
          ? 'Keep inner tee tucked or hem-matched so the open outer layer forms a clean vertical column.'
          : 'Layer a structured overshirt or dark zip-up to add clean vertical lines.';
      }
      break;
    }

    case 'average':
    default: {
      if (upper && (upper.fit === 'Regular' || upper.fit === 'Relaxed' || upper.fit === 'Oversized')) {
        score += 9;
        notes.push(`${upper.name} drapes naturally across an average frame in Size ${profile.size}.`);
      }
      if (bottom && (isStraightBottom || isWideBottom || isSlimBottom)) {
        score += 8;
        notes.push(`${bottom.name} keeps clean hip-to-shoe balance.`);
      }
      if (slots.outerwear && slots.top) {
        score += 4;
      }
      if (
        profile.fitPreference === 'Slim' &&
        upper?.fit === 'Oversized' &&
        bottom?.fit === 'Oversized'
      ) {
        score -= 9;
        tip = 'Your profile prefers Slim, while both layers run Oversized—swap one piece to Regular/Slim.';
      }
      if (!tip) {
        tip = `Balanced Size ${profile.size} proportions—pairing a crisp top hem with clean shoes completes the silhouette.`;
      }
      break;
    }
  }

  // Fit-preference alignment bonus/penalty
  if (baseTop) {
    if (profile.fitPreference === 'Relaxed/Oversized' && (baseTop.fit === 'Oversized' || baseTop.fit === 'Relaxed')) {
      score += 4;
    } else if (profile.fitPreference === 'Slim' && (baseTop.fit === 'Slim' || baseTop.fit === 'Tailored')) {
      score += 4;
    } else if (profile.fitPreference === 'Regular' && (baseTop.fit === 'Regular' || baseTop.fit === 'Straight')) {
      score += 4;
    }
  }

  const finalScore = clampScore(score);
  const headline =
    finalScore >= 85
      ? `Sharp Proportions for ${bodyOpt.shortLabel} Frame`
      : finalScore >= 68
        ? `Solid Base for ${bodyOpt.shortLabel} Frame`
        : `Proportion Tweaks Recommended`;

  const drapeSummary =
    notes.length > 0
      ? notes.slice(0, 2).join(' ')
      : bodyOpt.frameSummary;

  return {
    score: finalScore,
    headline,
    drapeSummary,
    proportionTip: tip,
  };
}

function evaluateOutfitCoordination(slots: OutfitSlots): number {
  const hasUpper = Boolean(slots.top || slots.outerwear);
  const hasBottom = Boolean(slots.bottom);
  const hasShoes = Boolean(slots.footwear);

  let score = 50;
  if (hasUpper) score += 12;
  if (hasBottom) score += 12;
  if (hasShoes) score += 10;

  if (slots.top && slots.bottom) {
    score += areItemsCompatible(slots.top, slots.bottom) ? 6 : -10;
  }
  if (slots.outerwear && slots.top) {
    score += areItemsCompatible(slots.outerwear, slots.top) ? 5 : -7;
  }
  if (slots.outerwear && slots.bottom) {
    score += areItemsCompatible(slots.outerwear, slots.bottom) ? 4 : -6;
  }
  if (slots.bottom && slots.footwear) {
    score += areItemsCompatible(slots.bottom, slots.footwear) ? 5 : -6;
  }

  // Formal shoes + athletic shorts or joggers mismatch check
  if (
    slots.bottom?.silhouette === 'shorts' &&
    slots.footwear?.silhouette === 'boots'
  ) {
    score -= 10;
  }

  // 2-layer depth bonus
  if (slots.outerwear && slots.top && slots.bottom && slots.footwear) {
    score += 3;
  }

  return clampScore(score);
}

function computeScoreOnly(
  slots: OutfitSlots,
  profile: WardrobeProfile,
): { overallScore: number; bodyTypeFit: number; colorHarmony: number; outfitCoordination: number } {
  const equippedCount = Object.values(slots).filter(Boolean).length;
  if (equippedCount === 0) {
    return { overallScore: 0, bodyTypeFit: 0, colorHarmony: 0, outfitCoordination: 0 };
  }
  const harmony = computeColorHarmony(
    slots,
    profile.skinTone,
    profile.undertone,
    profile.lighting,
  );
  const body = evaluateBodyTypeFit(slots, profile);
  const coordination = evaluateOutfitCoordination(slots);
  const overallScore = clampScore(
    body.score * 0.35 + harmony.score * 0.35 + coordination * 0.3,
  );
  return {
    overallScore,
    bodyTypeFit: body.score,
    colorHarmony: harmony.score,
    outfitCoordination: coordination,
  };
}

function buildUpgradeReason(
  candidate: WardrobeItem,
  targetSlot: SlotKey,
  slots: OutfitSlots,
  profile: WardrobeProfile,
  scoreDelta: number,
  bodyDelta: number,
  colorDelta: number,
): string {
  if (targetSlot === 'outerwear' && !slots.outerwear) {
    return `Adds structured shoulder framing in ${candidate.colorName} over your base top (${scoreDelta > 0 ? `+${scoreDelta}%` : 'depth boost'}).`;
  }
  if (colorDelta >= 4) {
    return `${candidate.colorName} flatters ${profile.undertone.toLowerCase()} undertones better (${colorDelta > 0 ? `+${colorDelta}% color` : 'clean match'}).`;
  }
  if (bodyDelta >= 4) {
    return `${candidate.fit} ${candidate.silhouette} cut balances your ${profile.bodyType} frame proportions.`;
  }
  if (targetSlot === 'bottom' && slots.bottom) {
    return `Swaps ${slots.bottom.fit.toLowerCase()} ${slots.bottom.silhouette} for a cleaner ${candidate.fit.toLowerCase()} ${candidate.colorName} line.`;
  }
  if (targetSlot === 'footwear') {
    return `Grounds the outfit in ${candidate.colorName} for sharper head-to-toe co-ordination.`;
  }
  return `Refines fit balance and ${candidate.colorName} contrast (+${Math.max(1, scoreDelta)}% Fit Check).`;
}

export function evaluateFitCheck(
  slots: OutfitSlots,
  profile: WardrobeProfile,
  wardrobe: WardrobeItem[],
): FitCheckEvaluation {
  const equippedCount = Object.values(slots).filter(Boolean).length;
  const harmony = computeColorHarmony(
    slots,
    profile.skinTone,
    profile.undertone,
    profile.lighting,
  );

  if (equippedCount === 0) {
    const bodyOpt =
      BODY_TYPE_OPTIONS.find((b) => b.id === profile.bodyType) ?? BODY_TYPE_OPTIONS[2];
    return {
      overallScore: 0,
      badgeLabel: 'Empty Look',
      breakdown: {
        bodyTypeFit: 0,
        colorHarmony: 0,
        outfitCoordination: 0,
      },
      harmony,
      bodyTypeVerdict: {
        bodyTypeId: profile.bodyType,
        bodyTypeLabel: bodyOpt.label,
        headline: `Select Clothes for Your ${bodyOpt.shortLabel} Frame`,
        drapeSummary: bodyOpt.frameSummary,
        proportionTip: 'Pick a top and bottom from the wardrobe rails to unlock a live Fit Check score.',
      },
      upgrades: [],
    };
  }

  const bodyEval = evaluateBodyTypeFit(slots, profile);
  const coordination = evaluateOutfitCoordination(slots);
  const overallScore = clampScore(
    bodyEval.score * 0.35 + harmony.score * 0.35 + coordination * 0.3,
  );

  let badgeLabel: FitBadgeTier = 'Needs Tweaks';
  if (overallScore >= 85) badgeLabel = 'Sharp Fit';
  else if (overallScore >= 68) badgeLabel = 'Strong Base';

  const bodyOpt =
    BODY_TYPE_OPTIONS.find((b) => b.id === profile.bodyType) ?? BODY_TYPE_OPTIONS[2];

  // Generate 2–3 concrete upgrade recommendations across different slots
  const equippedIds = new Set(
    Object.values(slots)
      .filter((i): i is NonNullable<typeof i> => i !== null)
      .map((i) => i.id),
  );

  const candidates: FitUpgradeSuggestion[] = [];
  for (const item of wardrobe) {
    if (equippedIds.has(item.id)) continue;

    const targetSlot: SlotKey =
      item.category === 'Bottoms'
        ? 'bottom'
        : item.category === 'Footwear'
          ? 'footwear'
          : isLayerableUpperGarment(item)
            ? 'outerwear'
            : 'top';

    const nextSlots = applyGarmentSelection(slots, item, true);
    const projected = computeScoreOnly(nextSlots, profile);
    const scoreDelta = projected.overallScore - overallScore;
    const bodyDelta = projected.bodyTypeFit - bodyEval.score;
    const colorDelta = projected.colorHarmony - harmony.score;

    // Prefer positive upgrades; allow subtle +0/-1 stylish alternatives only if few positives exist
    if (scoreDelta < -2) continue;

    const slotAction =
      targetSlot === 'outerwear'
        ? slots.outerwear
          ? 'Swap Layer'
          : 'Add Layer'
        : targetSlot === 'top'
          ? 'Swap Top'
          : targetSlot === 'bottom'
            ? 'Swap Bottom'
            : 'Swap Shoes';

    candidates.push({
      item,
      targetSlot,
      slotAction,
      reason: buildUpgradeReason(
        item,
        targetSlot,
        slots,
        profile,
        scoreDelta,
        bodyDelta,
        colorDelta,
      ),
      projectedScore: projected.overallScore,
      scoreDelta,
    });
  }

  // Sort by highest score improvement, preferring user-uploaded or diverse slots
  candidates.sort((a, b) => {
    if (b.scoreDelta !== a.scoreDelta) return b.scoreDelta - a.scoreDelta;
    if (b.projectedScore !== a.projectedScore) return b.projectedScore - a.projectedScore;
    return Number(Boolean(b.item.isUserUploaded)) - Number(Boolean(a.item.isUserUploaded));
  });

  const upgrades: FitUpgradeSuggestion[] = [];
  const usedSlots = new Set<SlotKey>();

  // First pass: max 1 recommendation per slot so upgrades cover distinct parts of the look
  for (const cand of candidates) {
    if (usedSlots.has(cand.targetSlot)) continue;
    usedSlots.add(cand.targetSlot);
    upgrades.push(cand);
    if (upgrades.length === 3) break;
  }

  // Second pass if fewer than 2 distinct-slot upgrades exist
  if (upgrades.length < 2) {
    for (const cand of candidates) {
      if (upgrades.some((u) => u.item.id === cand.item.id)) continue;
      upgrades.push(cand);
      if (upgrades.length === 3) break;
    }
  }

  return {
    overallScore,
    badgeLabel,
    breakdown: {
      bodyTypeFit: bodyEval.score,
      colorHarmony: harmony.score,
      outfitCoordination: coordination,
    },
    harmony,
    bodyTypeVerdict: {
      bodyTypeId: profile.bodyType,
      bodyTypeLabel: bodyOpt.label,
      headline: bodyEval.headline,
      drapeSummary: bodyEval.drapeSummary,
      proportionTip: bodyEval.proportionTip,
    },
    upgrades,
  };
}
