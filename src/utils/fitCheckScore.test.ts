import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_WARDROBE } from '../data/seedData';
import { OutfitSlots, WardrobeProfile } from '../types/wardrobe';
import { evaluateFitCheck } from './fitCheckScore';
import { DEFAULT_WARDROBE_PROFILE, applyGarmentSelection } from './wardrobeStyling';

const findById = (id: string) => {
  const item = STARTER_WARDROBE.find((i) => i.id === id);
  assert.ok(item, `Expected starter item ${id}`);
  return item;
};

test('evaluateFitCheck returns Sharp Fit / Strong Base / Needs Tweaks badge and 3-part breakdown', () => {
  const sharpSlots: OutfitSlots = {
    outerwear: findById('w-denim-trucker'),
    top: findById('w-black-tee'),
    bottom: findById('w-selvedge-denim'),
    footwear: findById('w-white-sneakers'),
  };
  const profile: WardrobeProfile = {
    ...DEFAULT_WARDROBE_PROFILE,
    skinTone: 'wheatish',
    undertone: 'Warm',
    bodyType: 'average',
    size: 'M',
    fitPreference: 'Regular',
  };

  const result = evaluateFitCheck(sharpSlots, profile, STARTER_WARDROBE);
  assert.ok(result.overallScore >= 85, `Expected Sharp Fit score >= 85, got ${result.overallScore}`);
  assert.equal(result.badgeLabel, 'Sharp Fit');
  assert.ok(result.breakdown.bodyTypeFit >= 70 && result.breakdown.bodyTypeFit <= 99);
  assert.ok(result.breakdown.colorHarmony >= 70 && result.breakdown.colorHarmony <= 99);
  assert.ok(result.breakdown.outfitCoordination >= 70 && result.breakdown.outfitCoordination <= 99);
  assert.equal(result.bodyTypeVerdict.bodyTypeLabel, 'Average');
});

test('evaluateFitCheck adapts score & drape verdict across body types and surfaces working upgrades', () => {
  const leanProfile: WardrobeProfile = {
    ...DEFAULT_WARDROBE_PROFILE,
    bodyType: 'broad',
    fitPreference: 'Regular',
    skinTone: 'wheatish',
    undertone: 'Warm',
  };

  // Slim top + slim jeans + no outer layer on a Broad / Muscular frame -> Needs Tweaks / Strong Base
  const tightSlots: OutfitSlots = {
    outerwear: null,
    top: findById('w-espresso-polo'),
    bottom: findById('w-slim-blue-jeans'),
    footwear: findById('w-white-sneakers'),
  };

  const initial = evaluateFitCheck(tightSlots, leanProfile, STARTER_WARDROBE);
  assert.ok(
    initial.badgeLabel === 'Needs Tweaks' || initial.badgeLabel === 'Strong Base',
    `Expected lower fit tier for slim-on-broad, got ${initial.badgeLabel}`,
  );
  assert.equal(initial.bodyTypeVerdict.bodyTypeLabel, 'Broad / Muscular');
  assert.ok(initial.upgrades.length >= 2 && initial.upgrades.length <= 3);

  // Applying the top recommended swap via applyGarmentSelection measurably improves the score
  const topUpgrade = initial.upgrades[0];
  const swappedSlots = applyGarmentSelection(tightSlots, topUpgrade.item, true);
  const afterSwap = evaluateFitCheck(swappedSlots, leanProfile, STARTER_WARDROBE);
  assert.ok(
    afterSwap.overallScore >= initial.overallScore,
    `Expected swap to improve or maintain score (${afterSwap.overallScore} vs ${initial.overallScore})`,
  );
});

test('evaluateFitCheck handles empty outfit slots gracefully', () => {
  const emptySlots: OutfitSlots = {
    outerwear: null,
    top: null,
    bottom: null,
    footwear: null,
  };
  const result = evaluateFitCheck(emptySlots, DEFAULT_WARDROBE_PROFILE, STARTER_WARDROBE);
  assert.equal(result.overallScore, 0);
  assert.equal(result.badgeLabel, 'Empty Look');
  assert.equal(result.upgrades.length, 0);
});
