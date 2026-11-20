import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIFESTYLE_SCENES,
  MoodboardGarmentInput,
  buildMoodboardFilename,
  buildMoodboardPrompt,
  getLifestyleSceneByKey,
  normalizeHexColor,
  normalizeMoodboardPlan,
} from './moodboard';

const SAMPLE_ITEMS: MoodboardGarmentInput[] = [
  {
    id: 'w-denim-trucker',
    slot: 'outerwear',
    name: 'Washed Black Overshirt',
    brand: 'Zudio',
    category: 'Outerwear',
    colorName: 'Washed Slate',
    colorHex: '#27272A',
    fit: 'Boxy',
    vibe: 'Streetwear',
  },
  {
    id: 'w-black-tee',
    slot: 'top',
    name: 'Oversized Black Tee',
    brand: 'The Souled Store',
    category: 'Tops',
    colorName: 'Jet Black',
    colorHex: '#18181B',
    fit: 'Oversized',
    vibe: 'Streetwear',
  },
  {
    id: 'w-selvedge-denim',
    slot: 'bottom',
    name: 'Baggy Raw Indigo Jeans',
    brand: 'Zudio',
    category: 'Bottoms',
    colorName: 'Raw Indigo',
    colorHex: '#1E293B',
    fit: 'Oversized',
    vibe: 'Streetwear',
  },
];

test('buildMoodboardPrompt includes outfit garments, wearer profile, and lifestyle scene', () => {
  const prompt = buildMoodboardPrompt({
    items: SAMPLE_ITEMS,
    profile: {
      skinTone: 'wheatish',
      undertone: 'Warm',
      size: 'M',
      fitPreference: 'Regular',
      bodyType: 'average',
    },
    lighting: 'Warm Indoor',
    sceneKey: 'campus_cafe',
    customNote: 'Friday coffee meetup in Bandra',
  });

  assert.match(prompt, /Washed Black Overshirt/);
  assert.match(prompt, /Baggy Raw Indigo Jeans/);
  assert.match(prompt, /wheatish skin \(Warm undertone\)/);
  assert.match(prompt, /campus_cafe/);
  assert.match(prompt, /Friday coffee meetup in Bandra/);
});

test('normalizeMoodboardPlan sanitizes valid AI JSON and backfills missing swatches or invalid hexes', () => {
  const normalized = normalizeMoodboardPlan(
    {
      title: 'Bandra Dusk Slate',
      subtitle: 'Relaxed denim layered for warm coffee-house evenings',
      sceneKey: 'rooftop_evening',
      sceneLabel: 'Twilight Rooftop Lounge',
      lightingMood: 'Warm lantern amber glow',
      contextStory: 'Slate and indigo stay sharp under dusk bokeh.',
      collageCaptions: {
        lookCaption: 'Boxy overshirt frames the relaxed silhouette.',
        textureNote: 'Twill weave over heavyweight jersey.',
        proportionNote: 'Wide denim anchors white court sneakers.',
      },
      paletteSwatches: [
        { hex: '#27272A', name: 'Washed Slate', role: 'Outer Layer' },
        { hex: 'invalid-color', name: 'Accent', role: 'Glow' },
      ],
      stylingProps: ['Tortoise Sunglasses', 'Brushed Steel Watch'],
      backdropPalette: {
        skyTop: '#10121a',
        skyBottom: '#2d2230',
        surfaceTint: '#1b1a24',
        accentGlow: '#abc',
      },
      editorialTagline: 'FitCheck Studio Edition',
    },
    {
      items: SAMPLE_ITEMS,
      sceneKey: 'rooftop_evening',
      lighting: 'Evening',
    },
  );

  assert.equal(normalized.title, 'Bandra Dusk Slate');
  assert.equal(normalized.sceneKey, 'rooftop_evening');
  assert.equal(normalized.paletteSwatches.length, 4);
  assert.equal(normalized.paletteSwatches[1].hex, '#18181b');
  assert.equal(normalized.backdropPalette.accentGlow, '#aabbcc');
  assert.equal(normalized.stylingProps.length, 2);
});

test('getLifestyleSceneByKey, normalizeHexColor, and buildMoodboardFilename handle fallbacks cleanly', () => {
  assert.equal(getLifestyleSceneByKey('unknown').key, LIFESTYLE_SCENES[0].key);
  assert.equal(normalizeHexColor('#f0a', '#000000'), '#ff00aa');
  assert.equal(normalizeHexColor('nope', '#123456'), '#123456');
  assert.equal(
    buildMoodboardFilename('Monsoon Espresso & Slate'),
    'fitcheck-moodboard-monsoon-espresso-slate.png',
  );
  assert.equal(buildMoodboardFilename(), 'fitcheck-moodboard.png');
});
