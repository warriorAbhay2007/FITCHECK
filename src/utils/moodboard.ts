import { Type } from '@google/genai';
import {
  BodyTypeId,
  FitPreference,
  MirrorLighting,
  SkinToneId,
  Undertone,
  WardrobeSize,
} from '../types/wardrobe';

export type LifestyleSceneKey =
  | 'campus_cafe'
  | 'urban_street'
  | 'rooftop_evening'
  | 'gallery_minimal'
  | 'festive_courtyard';

export interface LifestyleSceneMeta {
  key: LifestyleSceneKey;
  label: string;
  shortLabel: string;
  locationHint: string;
  defaultLighting: MirrorLighting;
  defaultBackdropPalette: {
    skyTop: string;
    skyBottom: string;
    surfaceTint: string;
    accentGlow: string;
  };
}

export interface MoodboardGarmentInput {
  id: string;
  slot: 'outerwear' | 'top' | 'bottom' | 'footwear';
  name: string;
  brand?: string;
  category: string;
  colorName: string;
  colorHex: string;
  fit: string;
  vibe: string;
  imageUrl?: string;
}

export interface MoodboardProfileInput {
  skinTone: SkinToneId;
  undertone: Undertone;
  size: WardrobeSize;
  fitPreference: FitPreference;
  bodyType: BodyTypeId;
}

export interface MoodboardSwatch {
  hex: string;
  name: string;
  role: string;
}

export interface MoodboardBackdropPalette {
  skyTop: string;
  skyBottom: string;
  surfaceTint: string;
  accentGlow: string;
}

export interface MoodboardPlan {
  title: string;
  subtitle: string;
  sceneKey: LifestyleSceneKey;
  sceneLabel: string;
  lightingMood: string;
  contextStory: string;
  collageCaptions: {
    lookCaption: string;
    textureNote: string;
    proportionNote: string;
  };
  paletteSwatches: MoodboardSwatch[];
  stylingProps: string[];
  backdropPalette: MoodboardBackdropPalette;
  editorialTagline: string;
}

export const LIFESTYLE_SCENES: LifestyleSceneMeta[] = [
  {
    key: 'campus_cafe',
    label: 'Campus & Coffee Terrace',
    shortLabel: 'Cafe Patio',
    locationHint: 'Sunlit Bandra / Indiranagar specialty coffee courtyard',
    defaultLighting: 'Daylight',
    defaultBackdropPalette: {
      skyTop: '#2f241c',
      skyBottom: '#6a4c35',
      surfaceTint: '#3e2d21',
      accentGlow: '#e8b968',
    },
  },
  {
    key: 'urban_street',
    label: 'Urban Architectural Walk',
    shortLabel: 'Urban Street',
    locationHint: 'Concrete promenade & sandstone steps at golden hour',
    defaultLighting: 'Warm Indoor',
    defaultBackdropPalette: {
      skyTop: '#24262b',
      skyBottom: '#594b3c',
      surfaceTint: '#2b2d33',
      accentGlow: '#d9a45b',
    },
  },
  {
    key: 'rooftop_evening',
    label: 'Twilight Rooftop Lounge',
    shortLabel: 'Rooftop Dusk',
    locationHint: 'Basalt terrace overlooking warm amber city skyline bokeh',
    defaultLighting: 'Evening',
    defaultBackdropPalette: {
      skyTop: '#121420',
      skyBottom: '#2d2332',
      surfaceTint: '#1b1a24',
      accentGlow: '#e8a956',
    },
  },
  {
    key: 'gallery_minimal',
    label: 'Gallery & Atelier Studio',
    shortLabel: 'Art Gallery',
    locationHint: 'Travertine plinths & soft diffused skylight architecture',
    defaultLighting: 'Daylight',
    defaultBackdropPalette: {
      skyTop: '#282623',
      skyBottom: '#4b443b',
      surfaceTint: '#312c26',
      accentGlow: '#dfd2bc',
    },
  },
  {
    key: 'festive_courtyard',
    label: 'Heritage Jali Courtyard',
    shortLabel: 'Festive Dusk',
    locationHint: 'Carved sandstone archway with warm brass lantern shadows',
    defaultLighting: 'Warm Indoor',
    defaultBackdropPalette: {
      skyTop: '#241815',
      skyBottom: '#633827',
      surfaceTint: '#36211a',
      accentGlow: '#f2b857',
    },
  },
];

export const VALID_SCENE_KEYS = new Set<LifestyleSceneKey>(
  LIFESTYLE_SCENES.map((s) => s.key),
);

export function getLifestyleSceneByKey(
  key?: string | null,
): LifestyleSceneMeta {
  const match = LIFESTYLE_SCENES.find((s) => s.key === key);
  return match ?? LIFESTYLE_SCENES[0];
}

export function normalizeHexColor(
  value: unknown,
  fallback = '#e0b973',
): string {
  const safeFallback = /^#[0-9a-fA-F]{6}$/.test(fallback)
    ? fallback.toLowerCase()
    : '#e0b973';
  if (typeof value !== 'string') return safeFallback;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return safeFallback;
}

export function buildMoodboardFilename(title?: string): string {
  const slug = (title ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `fitcheck-moodboard-${slug}.png` : 'fitcheck-moodboard.png';
}

export const MOODBOARD_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subtitle: { type: Type.STRING },
    sceneKey: { type: Type.STRING },
    sceneLabel: { type: Type.STRING },
    lightingMood: { type: Type.STRING },
    contextStory: { type: Type.STRING },
    collageCaptions: {
      type: Type.OBJECT,
      properties: {
        lookCaption: { type: Type.STRING },
        textureNote: { type: Type.STRING },
        proportionNote: { type: Type.STRING },
      },
      required: ['lookCaption', 'textureNote', 'proportionNote'],
    },
    paletteSwatches: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hex: { type: Type.STRING },
          name: { type: Type.STRING },
          role: { type: Type.STRING },
        },
        required: ['hex', 'name', 'role'],
      },
    },
    stylingProps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    backdropPalette: {
      type: Type.OBJECT,
      properties: {
        skyTop: { type: Type.STRING },
        skyBottom: { type: Type.STRING },
        surfaceTint: { type: Type.STRING },
        accentGlow: { type: Type.STRING },
      },
      required: ['skyTop', 'skyBottom', 'surfaceTint', 'accentGlow'],
    },
    editorialTagline: { type: Type.STRING },
  },
  required: [
    'title',
    'subtitle',
    'sceneKey',
    'sceneLabel',
    'lightingMood',
    'contextStory',
    'collageCaptions',
    'paletteSwatches',
    'stylingProps',
    'backdropPalette',
    'editorialTagline',
  ],
};

export function buildMoodboardPrompt(params: {
  items: MoodboardGarmentInput[];
  profile: MoodboardProfileInput;
  lighting: MirrorLighting;
  sceneKey: LifestyleSceneKey;
  customNote?: string;
}): string {
  const scene = getLifestyleSceneByKey(params.sceneKey);
  const itemLines = params.items.map(
    (item) =>
      `- [${item.slot.toUpperCase()}] ${item.name} (${item.colorName} ${item.colorHex}, ${item.fit} fit, ${item.vibe}${item.brand ? `, ${item.brand}` : ''})`,
  );

  const customLine = params.customNote?.trim()
    ? `User Lifestyle / Occasion Request: "${params.customNote.trim()}"`
    : 'User Lifestyle / Occasion Request: None specified — curate around the chosen scene.';

  return [
    'You are the Editorial Art Director for FitCheck AI, curating a visual fashion moodboard collage for an Indian wardrobe studio.',
    'Generate a concise, tactile, magazine-grade moodboard art direction JSON object tailored to the exact garments, wearer profile, and lifestyle setting below.',
    '',
    'SELECTED OUTFIT PIECES:',
    ...itemLines,
    '',
    `WEARER PROFILE: Size ${params.profile.size} · ${params.profile.fitPreference} fit · ${params.profile.bodyType} frame · ${params.profile.skinTone} skin (${params.profile.undertone} undertone) · Mirror Lighting: ${params.lighting}.`,
    `TARGET LIFESTYLE SCENE: ${scene.key} (${scene.label} — ${scene.locationHint}).`,
    customLine,
    '',
    'REQUIREMENTS:',
    `- Keep sceneKey equal to "${scene.key}".`,
    '- title: 2–5 evocative editorial words (e.g., "Indigo & Roasted Espresso").',
    '- subtitle: 6–12 words describing the mood in context.',
    '- lightingMood: Short ambient lighting note (4–8 words).',
    '- contextStory: 2 crisp sentences explaining how these fabrics, colors, and proportions work in this lifestyle setting and flatter the wearer.',
    '- collageCaptions: short 5–10 word captions for lookCaption, textureNote, and proportionNote.',
    '- paletteSwatches: exactly 4 swatches combining the equipped outfit hex colors + 1 complementary architectural backdrop tone (valid 6-digit #hex, concise name, short role like "Base Layer" or "Backdrop Warmth").',
    '- stylingProps: exactly 3 concise lifestyle props/accessories that elevate the collage (e.g., "Tortoise Wayfarers", "Brushed Steel Watch", "Canvas Tote").',
    '- backdropPalette: 4 moody, sophisticated 6-digit #hex colors (skyTop, skyBottom, surfaceTint, accentGlow) that complement the outfit without clashing.',
    '- editorialTagline: 4–8 word magazine footer line.',
  ].join('\n');
}

export function normalizeMoodboardPlan(
  raw: unknown,
  fallbackContext: {
    items: MoodboardGarmentInput[];
    sceneKey: LifestyleSceneKey;
    lighting: MirrorLighting;
  },
): MoodboardPlan {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >;
  const sceneKey = VALID_SCENE_KEYS.has(obj.sceneKey as LifestyleSceneKey)
    ? (obj.sceneKey as LifestyleSceneKey)
    : fallbackContext.sceneKey;
  const scene = getLifestyleSceneByKey(sceneKey);

  const str = (val: unknown, fallback: string) =>
    typeof val === 'string' && val.trim().length > 0 ? val.trim() : fallback;

  const rawCaptions = (
    obj.collageCaptions && typeof obj.collageCaptions === 'object'
      ? obj.collageCaptions
      : {}
  ) as Record<string, unknown>;

  const rawSwatches = Array.isArray(obj.paletteSwatches)
    ? obj.paletteSwatches
    : [];
  const parsedSwatches: MoodboardSwatch[] = rawSwatches
    .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === 'object'))
    .slice(0, 4)
    .map((s, idx) => ({
      hex: normalizeHexColor(
        s.hex,
        fallbackContext.items[idx]?.colorHex ?? scene.defaultBackdropPalette.accentGlow,
      ),
      name: str(s.name, fallbackContext.items[idx]?.colorName ?? 'Warm Brass'),
      role: str(s.role, idx === 0 ? 'Hero Tone' : 'Accent Tone'),
    }));

  while (parsedSwatches.length < 4) {
    const item = fallbackContext.items[parsedSwatches.length];
    parsedSwatches.push(
      item
        ? {
            hex: normalizeHexColor(item.colorHex, '#27272a'),
            name: item.colorName,
            role: item.category,
          }
        : {
            hex: scene.defaultBackdropPalette.accentGlow,
            name: 'Setting Glow',
            role: 'Environment',
          },
    );
  }

  const rawProps = Array.isArray(obj.stylingProps) ? obj.stylingProps : [];
  const stylingProps = rawProps
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .map((p) => p.trim())
    .slice(0, 3);
  if (stylingProps.length === 0) {
    stylingProps.push('Matte Sunglasses', 'Minimalist Watch', 'Canvas Carryall');
  }

  const rawBackdrop = (
    obj.backdropPalette && typeof obj.backdropPalette === 'object'
      ? obj.backdropPalette
      : {}
  ) as Record<string, unknown>;

  return {
    title: str(obj.title, 'Curated Context Lookbook'),
    subtitle: str(obj.subtitle, `Styled for ${scene.label.toLowerCase()}`),
    sceneKey,
    sceneLabel: str(obj.sceneLabel, scene.label),
    lightingMood: str(obj.lightingMood, `${fallbackContext.lighting} editorial glow`),
    contextStory: str(
      obj.contextStory,
      `Composed against ${scene.locationHint.toLowerCase()} to frame the outfit palette and silhouette cleanly.`,
    ),
    collageCaptions: {
      lookCaption: str(rawCaptions.lookCaption, 'Full silhouette anchored in setting'),
      textureNote: str(rawCaptions.textureNote, 'Balanced fabric contrast & layering'),
      proportionNote: str(rawCaptions.proportionNote, 'Clean top-to-shoe visual line'),
    },
    paletteSwatches: parsedSwatches,
    stylingProps,
    backdropPalette: {
      skyTop: normalizeHexColor(
        rawBackdrop.skyTop,
        scene.defaultBackdropPalette.skyTop,
      ),
      skyBottom: normalizeHexColor(
        rawBackdrop.skyBottom,
        scene.defaultBackdropPalette.skyBottom,
      ),
      surfaceTint: normalizeHexColor(
        rawBackdrop.surfaceTint,
        scene.defaultBackdropPalette.surfaceTint,
      ),
      accentGlow: normalizeHexColor(
        rawBackdrop.accentGlow,
        scene.defaultBackdropPalette.accentGlow,
      ),
    },
    editorialTagline: str(obj.editorialTagline, 'FitCheck Studio · Context Lookbook'),
  };
}
