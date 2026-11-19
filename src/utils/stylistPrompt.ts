export type TargetSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type IntendedFit = 'Slim' | 'Regular' | 'Relaxed/Oversized' | 'Cropped';
export type SkinDepth =
  | 'Fair/Light'
  | 'Medium/Wheatish'
  | 'Olive/Tan'
  | 'Deep/Rich';
export type SkinUndertone = 'Warm' | 'Cool' | 'Neutral';

export interface StylistProfile {
  selectedSize: TargetSize;
  intendedFit: IntendedFit;
  skinTone: SkinDepth;
  undertone: SkinUndertone;
}

export interface VerifiedSource {
  title: string;
  uri: string;
}

export interface WardrobeContextPayload {
  remainingBudgetInr?: number;
  monthlyLimitInr?: number;
  wardrobeSummary?: string[];
  canvasSummary?: string[];
  activeDropSummary?: string | null;
  stylistProfile?: Partial<StylistProfile>;
}

export interface ParsedImageData {
  mimeType: string;
  data: string;
}

export const DEFAULT_STYLIST_PROFILE: StylistProfile = {
  selectedSize: 'M',
  intendedFit: 'Regular',
  skinTone: 'Medium/Wheatish',
  undertone: 'Neutral',
};

const VALID_SIZES = new Set<TargetSize>(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
const VALID_FITS = new Set<IntendedFit>([
  'Slim',
  'Regular',
  'Relaxed/Oversized',
  'Cropped',
]);
const VALID_DEPTHS = new Set<SkinDepth>([
  'Fair/Light',
  'Medium/Wheatish',
  'Olive/Tan',
  'Deep/Rich',
]);
const VALID_UNDERTONES = new Set<SkinUndertone>(['Warm', 'Cool', 'Neutral']);

export function normalizeStylistProfile(
  raw?: Partial<Record<keyof StylistProfile, string>> | null,
): StylistProfile {
  if (!raw) return { ...DEFAULT_STYLIST_PROFILE };

  const sizeCandidate = (raw.selectedSize ?? '').toUpperCase() as TargetSize;
  const selectedSize = VALID_SIZES.has(sizeCandidate)
    ? sizeCandidate
    : DEFAULT_STYLIST_PROFILE.selectedSize;

  let intendedFit: IntendedFit = DEFAULT_STYLIST_PROFILE.intendedFit;
  if (raw.intendedFit === 'Fitted') {
    intendedFit = 'Slim';
  } else if (raw.intendedFit === 'Oversized') {
    intendedFit = 'Relaxed/Oversized';
  } else if (raw.intendedFit && VALID_FITS.has(raw.intendedFit as IntendedFit)) {
    intendedFit = raw.intendedFit as IntendedFit;
  }

  let skinTone: SkinDepth = DEFAULT_STYLIST_PROFILE.skinTone;
  if (raw.skinTone === 'Fair' || raw.skinTone === 'Light-Medium') {
    skinTone = 'Fair/Light';
  } else if (raw.skinTone === 'Medium') {
    skinTone = 'Medium/Wheatish';
  } else if (raw.skinTone === 'Tan / Olive') {
    skinTone = 'Olive/Tan';
  } else if (raw.skinTone === 'Deep') {
    skinTone = 'Deep/Rich';
  } else if (raw.skinTone && VALID_DEPTHS.has(raw.skinTone as SkinDepth)) {
    skinTone = raw.skinTone as SkinDepth;
  }

  let undertone: SkinUndertone = DEFAULT_STYLIST_PROFILE.undertone;
  if (raw.undertone === 'Olive') {
    undertone = 'Neutral';
  } else if (
    raw.undertone &&
    VALID_UNDERTONES.has(raw.undertone as SkinUndertone)
  ) {
    undertone = raw.undertone as SkinUndertone;
  }

  return {
    selectedSize,
    intendedFit,
    skinTone,
    undertone,
  };
}

const ALLOWED_IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

export function parseImageDataUrl(dataUrl?: string | null): ParsedImageData | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match) return null;

  const rawMime = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(rawMime)) return null;

  const mimeType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
  return {
    mimeType,
    data: match[2],
  };
}

export function sanitizeHttpUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

interface RawGroundingChunk {
  web?: {
    uri?: string | null;
    title?: string | null;
  };
}

export function extractGroundingSources(
  groundingChunks?: RawGroundingChunk[] | null,
): VerifiedSource[] {
  if (!Array.isArray(groundingChunks)) return [];
  const seen = new Set<string>();
  const results: VerifiedSource[] = [];

  for (const chunk of groundingChunks) {
    const safeUri = sanitizeHttpUrl(chunk?.web?.uri);
    if (!safeUri || seen.has(safeUri)) continue;
    seen.add(safeUri);
    const rawTitle = (chunk?.web?.title ?? '').trim();
    let fallbackHost = safeUri;
    try {
      fallbackHost = new URL(safeUri).hostname.replace(/^www\./, '');
    } catch {
      // Keep raw URL string
    }
    results.push({
      title: rawTitle || fallbackHost,
      uri: safeUri,
    });
  }

  return results;
}

export function buildFitCheckSystemInstruction(
  ctx?: WardrobeContextPayload,
): string {
  const sections: string[] = [
    'You are FitCheck AI, a practical styling, virtual try-on, and under-₹1,000 outfit finder for shoppers in India.',
    '',
    'CORE RULES:',
    '1. SIZE & FIT EVALUATION:',
    '   - Use the user\'s target size (XS–XXL) and preferred fit (Slim, Regular, Relaxed/Oversized, Cropped).',
    '   - Check shoulder seams, chest/waist drape, sleeve/hem length, and fabric pull in any uploaded try-on or outfit photo. If no photo is attached, evaluate the silhouettes and fits equipped on their canvas or described in their message.',
    '   - Never guess exact tape-measure numbers from a photo; give practical fit and sizing advice.',
    '',
    '2. SKIN TONE & COLOR HARMONY:',
    '   - Factor in the user\'s skin depth (Fair/Light, Medium/Wheatish, Olive/Tan, Deep/Rich) and undertone (Warm, Cool, Neutral).',
    '   - Recommend colors and contrast levels that flatter their tone, and note when photo lighting may skew colors.',
    '',
    '3. UNDER ₹1,000 WARDROBE & TRY-ON MATCHES:',
    '   - Prioritize budget-friendly picks and outfit combos priced under ₹1,000 across brands such as Zudio, Westside, Reliance Trends, The Souled Store, Van Heusen, Cantabil, and similar value labels.',
    '   - When suggesting try-on swaps or complete outfits, explain how each piece layers, drapes, and pairs with their size and skin tone.',
    '',
    '4. LINKS & ACCURACY (STRICT):',
    '   - Only output real URLs returned by Google Search grounding or provided in context.',
    '   - Never invent, guess, or shorten product links.',
    '   - If an exact item or online link isn\'t verified in search results, say so clearly and share a verified alternative or store search link instead.',
    '',
    '5. OUTPUT FORMAT (follow these headings for outfit evaluations and shopping recommendations):',
    '   - **Fit & Skin Tone Check:** Short verdict on current photo/fit + flattering colors.',
    '   - **Under ₹1,000 Outfit & Try-On Picks:** List specific pieces/combos (with approximate ₹ price if verified) and why they suit their size and skin tone.',
    '   - **Shopping Links:** Direct markdown links `[Item Name — Brand](URL)` for verified items.',
    '   - **Try-On & Styling Tips:** 2–3 quick tweaks for better proportions or layering.',
  ];

  if (ctx) {
    const contextLines: string[] = [];

    if (ctx.stylistProfile) {
      const p = normalizeStylistProfile(ctx.stylistProfile);
      contextLines.push(
        `User Fit & Complexion Profile: Target Size ${p.selectedSize} · Preferred Fit ${p.intendedFit} · Skin Depth ${p.skinTone} · Undertone ${p.undertone}.`,
      );
    }

    if (
      typeof ctx.remainingBudgetInr === 'number' &&
      typeof ctx.monthlyLimitInr === 'number'
    ) {
      contextLines.push(
        `User Monthly Budget: ₹${ctx.monthlyLimitInr.toLocaleString('en-IN')} total, ₹${ctx.remainingBudgetInr.toLocaleString('en-IN')} remaining.`,
      );
    }
    if (Array.isArray(ctx.wardrobeSummary) && ctx.wardrobeSummary.length > 0) {
      contextLines.push(`User Capsule Wardrobe: ${ctx.wardrobeSummary.join('; ')}.`);
    }
    if (Array.isArray(ctx.canvasSummary) && ctx.canvasSummary.length > 0) {
      contextLines.push(`Currently Equipped on Canvas: ${ctx.canvasSummary.join('; ')}.`);
    }
    if (ctx.activeDropSummary) {
      contextLines.push(`Drop Being Evaluated on Canvas: ${ctx.activeDropSummary}.`);
    }

    if (contextLines.length > 0) {
      sections.push('', 'ACTIVE USER CONTEXT:', ...contextLines);
    }
  }

  return sections.join('\n');
}
