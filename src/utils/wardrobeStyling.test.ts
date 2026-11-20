import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_WARDROBE } from '../data/seedData';
import { OutfitSlots } from '../types/wardrobe';
import {
  DEFAULT_WARDROBE_PROFILE,
  applyGarmentSelection,
  buildShareCardText,
  computeColorHarmony,
  filterByClosetSource,
  filterItemsByRailTab,
  filterWardrobeByOccasion,
  getBrandSizingNotes,
  shuffleWardrobeOutfit,
} from './wardrobeStyling';

const sampleSlots: OutfitSlots = {
  outerwear: STARTER_WARDROBE.find((i) => i.id === 'w-olive-bomber') ?? null,
  top: STARTER_WARDROBE.find((i) => i.id === 'w-black-tee') ?? null,
  bottom: STARTER_WARDROBE.find((i) => i.id === 'w-selvedge-denim') ?? null,
  footwear: STARTER_WARDROBE.find((i) => i.id === 'w-white-sneakers') ?? null,
};

test('computeColorHarmony rewards warm earth tones on wheatish warm skin and handles empty slots', () => {
  const warmResult = computeColorHarmony(
    sampleSlots,
    'wheatish',
    'Warm',
    'Warm Indoor',
  );
  assert.ok(warmResult.score >= 80 && warmResult.score <= 98);
  assert.match(warmResult.tip, /Wheatish \(Warm\)/);
  assert.match(warmResult.lightingNote, /Warm indoor LED/i);
  assert.match(warmResult.colorBlockingNote, /3-piece color block/i);

  const emptyResult = computeColorHarmony(
    { outerwear: null, top: null, bottom: null, footwear: null },
    'fair',
    'Cool',
    'Daylight',
  );
  assert.equal(emptyResult.score, 0);
  assert.equal(emptyResult.ratingLabel, 'No Garments');
});

test('getBrandSizingNotes returns tailored guidance for all six Indian retail brands', () => {
  const notes = getBrandSizingNotes('L', 'Relaxed/Oversized', sampleSlots);
  assert.deepEqual(
    notes.map((n) => n.brand),
    ['Zudio', 'Westside', 'Trends', 'The Souled Store', 'Van Heusen', 'Cantabil'],
  );
  const zudio = notes.find((n) => n.brand === 'Zudio');
  assert.equal(zudio?.recommendedSize, 'XL');

  const slimNotes = getBrandSizingNotes('M', 'Slim', sampleSlots);
  const souled = slimNotes.find((n) => n.brand === 'The Souled Store');
  assert.equal(souled?.recommendedSize, 'S');
});

test('filterWardrobeByOccasion, filterByClosetSource, and filterItemsByRailTab keep rails scoped cleanly', () => {
  const all = filterWardrobeByOccasion(STARTER_WARDROBE, 'All');
  assert.equal(all.length, STARTER_WARDROBE.length);

  const uploadedPiece = {
    ...STARTER_WARDROBE[0],
    id: 'user-hoodie-1',
    name: 'My Maroon Zip Hoodie',
    railTab: 'Hoodies & Sweatshirts' as const,
    layerable: true,
    isUserUploaded: true,
  };
  const mixed = [uploadedPiece, ...STARTER_WARDROBE];

  assert.equal(filterByClosetSource(mixed, 'mine').length, 1);
  assert.equal(filterByClosetSource(mixed, 'catalog').length, STARTER_WARDROBE.length);
  assert.equal(
    filterItemsByRailTab(mixed, 'Hoodies & Sweatshirts', 'All', 'mine').length,
    1,
  );
  assert.equal(
    filterItemsByRailTab(mixed, 'Jeans', 'All', 'mine').length,
    0,
  );
});

test('applyGarmentSelection supports 2-layer mixing with uploaded zip hoodies and single-layer mode', () => {
  const tee = STARTER_WARDROBE.find((i) => i.id === 'w-black-tee')!;
  const bomber = STARTER_WARDROBE.find((i) => i.id === 'w-olive-bomber')!;
  const userZipHoodie = {
    ...tee,
    id: 'user-zip',
    name: 'My Black Zip Hoodie',
    railTab: 'Hoodies & Sweatshirts' as const,
    layerable: true,
    isUserUploaded: true,
  };

  const baseOnly: OutfitSlots = { outerwear: null, top: tee, bottom: null, footwear: null };
  const layered = applyGarmentSelection(baseOnly, userZipHoodie, true);
  assert.equal(layered.top?.id, 'w-black-tee');
  assert.equal(layered.outerwear?.id, 'user-zip');

  const replaced = applyGarmentSelection(baseOnly, bomber, false);
  assert.equal(replaced.top, null);
  assert.equal(replaced.outerwear?.id, 'w-olive-bomber');
});

test('shuffleWardrobeOutfit pairs top, bottom, footwear, and honors layer toggle', () => {
  const layered = shuffleWardrobeOutfit(STARTER_WARDROBE, sampleSlots, true, 'All');
  assert.ok(layered.top);
  assert.ok(layered.bottom);
  assert.ok(layered.footwear);
  assert.ok(layered.outerwear);

  const unlayered = shuffleWardrobeOutfit(STARTER_WARDROBE, sampleSlots, false, 'Smart Casual');
  assert.equal(unlayered.outerwear, null);
  assert.ok(unlayered.top);
});

test('buildShareCardText produces readable summary containing harmony, profile, and equipped pieces', () => {
  const harmony = computeColorHarmony(sampleSlots, 'olive', 'Warm', 'Daylight');
  const summary = buildShareCardText(
    'Campus Bomber Fit',
    sampleSlots,
    harmony,
    { ...DEFAULT_WARDROBE_PROFILE, skinTone: 'olive', lighting: 'Daylight' },
  );
  assert.match(summary, /FitCheck AI Look — Campus Bomber Fit/);
  assert.match(summary, /Olive \(Warm\)/);
  assert.match(summary, /Olive MA-1 Bomber/);
  assert.match(summary, /Oversized Black Tee/);
});
