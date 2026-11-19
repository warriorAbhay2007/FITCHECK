import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFitCheckSystemInstruction,
  extractGroundingSources,
  normalizeStylistProfile,
  parseImageDataUrl,
  sanitizeHttpUrl,
} from './stylistPrompt';

test('buildFitCheckSystemInstruction embeds India under-1000 rubric, brands, link accuracy, and output sections', () => {
  const prompt = buildFitCheckSystemInstruction({
    monthlyLimitInr: 5000,
    remainingBudgetInr: 2701,
    stylistProfile: {
      selectedSize: 'L',
      intendedFit: 'Relaxed/Oversized',
      skinTone: 'Medium/Wheatish',
      undertone: 'Warm',
    },
    canvasSummary: ['top: Oversized Black Tee (Jet Black, Streetwear)'],
  });

  assert.match(prompt, /under-₹1,000 outfit finder for shoppers in India/);
  assert.match(prompt, /SIZE & FIT EVALUATION/);
  assert.match(prompt, /SKIN TONE & COLOR HARMONY/);
  assert.match(prompt, /Zudio, Westside, Reliance Trends, The Souled Store, Van Heusen, Cantabil/);
  assert.match(prompt, /LINKS & ACCURACY \(STRICT\)/);
  assert.match(prompt, /Fit & Skin Tone Check:/);
  assert.match(prompt, /Under ₹1,000 Outfit & Try-On Picks:/);
  assert.match(prompt, /Shopping Links:/);
  assert.match(prompt, /Try-On & Styling Tips:/);
  assert.match(prompt, /Target Size L/);
  assert.match(prompt, /Preferred Fit Relaxed\/Oversized/);
  assert.match(prompt, /Skin Depth Medium\/Wheatish/);
  assert.match(prompt, /Undertone Warm/);
  assert.match(prompt, /₹2,701 remaining/);
});

test('normalizeStylistProfile migrates legacy profile values cleanly', () => {
  assert.deepEqual(
    normalizeStylistProfile({
      selectedSize: 'xl',
      intendedFit: 'Fitted',
      skinTone: 'Tan / Olive',
      undertone: 'Olive',
    }),
    {
      selectedSize: 'XL',
      intendedFit: 'Slim',
      skinTone: 'Olive/Tan',
      undertone: 'Neutral',
    },
  );

  assert.deepEqual(
    normalizeStylistProfile({
      selectedSize: 'S',
      intendedFit: 'Oversized',
      skinTone: 'Medium',
      undertone: 'Cool',
    }),
    {
      selectedSize: 'S',
      intendedFit: 'Relaxed/Oversized',
      skinTone: 'Medium/Wheatish',
      undertone: 'Cool',
    },
  );
});

test('sanitizeHttpUrl and extractGroundingSources keep only valid unique http/https links', () => {
  assert.equal(sanitizeHttpUrl('https://www.zudio.com/collections/men'), 'https://www.zudio.com/collections/men');
  assert.equal(sanitizeHttpUrl('javascript:alert(1)'), null);
  assert.equal(sanitizeHttpUrl('not a url'), null);

  const sources = extractGroundingSources([
    { web: { uri: 'https://www.westside.com/collections/men', title: 'Westside Men' } },
    { web: { uri: 'https://www.westside.com/collections/men', title: 'Duplicate' } },
    { web: { uri: 'javascript:void(0)', title: 'Bad' } },
    { web: { uri: 'https://www.thesouledstore.com/men/t-shirts', title: '' } },
  ]);

  assert.deepEqual(sources, [
    { title: 'Westside Men', uri: 'https://www.westside.com/collections/men' },
    { title: 'thesouledstore.com', uri: 'https://www.thesouledstore.com/men/t-shirts' },
  ]);
});

test('parseImageDataUrl extracts valid image MIME types and rejects invalid/non-image URLs', () => {
  const valid = parseImageDataUrl('data:image/jpeg;base64,QUJDRA==');
  assert.deepEqual(valid, { mimeType: 'image/jpeg', data: 'QUJDRA==' });

  const normalizedJpg = parseImageDataUrl('data:image/jpg;base64,QUJDRA==');
  assert.deepEqual(normalizedJpg, { mimeType: 'image/jpeg', data: 'QUJDRA==' });

  assert.equal(parseImageDataUrl('data:text/plain;base64,QUJD'), null);
  assert.equal(parseImageDataUrl('https://example.com/photo.png'), null);
  assert.equal(parseImageDataUrl(''), null);
});
