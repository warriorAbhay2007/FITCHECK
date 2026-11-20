import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areItemsCompatible,
  buildColorPaletteSuggestions,
  buildVisibleDropsPriceData,
  calculateUnlockedOutfits,
  calculateWardrobeCompatibility,
  computeShoppingVerdict,
  formatINR,
} from './wardrobeLogic';
import { TrendingDrop, WardrobeItem } from '../types/wardrobe';

const sampleCloset: WardrobeItem[] = [
  {
    id: 'w1',
    name: 'Oversized Black Tee',
    category: 'Tops',
    colorName: 'Black',
    colorHex: '#18181B',
    colorFamily: 'neutral',
    vibe: 'Streetwear',
    tags: ['neutral', 'everyday', 'boxy'],
    fit: 'Oversized',
    silhouette: 'tee',
  },
  {
    id: 'w2',
    name: 'White Oxford Shirt',
    category: 'Tops',
    colorName: 'White',
    colorHex: '#F8FAFC',
    colorFamily: 'neutral',
    vibe: 'Smart Casual',
    tags: ['neutral', 'clean', 'layering'],
    fit: 'Regular',
    silhouette: 'shirt',
  },
  {
    id: 'w3',
    name: 'Olive Cargo Pants',
    category: 'Bottoms',
    colorName: 'Olive',
    colorHex: '#4D5D3B',
    colorFamily: 'earth',
    vibe: 'Streetwear',
    tags: ['utility', 'everyday'],
    fit: 'Relaxed',
    silhouette: 'cargo',
  },
  {
    id: 'w4',
    name: 'Dark Selvedge Denim',
    category: 'Bottoms',
    colorName: 'Indigo',
    colorHex: '#1E293B',
    colorFamily: 'cool',
    vibe: 'Minimalist',
    tags: ['denim', 'clean', 'everyday'],
    fit: 'Regular',
    silhouette: 'denim',
  },
  {
    id: 'w5',
    name: 'White Leather Sneakers',
    category: 'Footwear',
    colorName: 'White',
    colorHex: '#F1F5F9',
    colorFamily: 'neutral',
    vibe: 'Minimalist',
    tags: ['clean', 'everyday', 'neutral'],
    fit: 'Regular',
    silhouette: 'sneakers',
  },
  {
    id: 'w6',
    name: 'Chunky Black Boots',
    category: 'Footwear',
    colorName: 'Black',
    colorHex: '#111827',
    colorFamily: 'neutral',
    vibe: 'Streetwear',
    tags: ['neutral', 'statement'],
    fit: 'Chunky',
    silhouette: 'boots',
  },
];

test('formatINR formats positive and negative INR amounts accurately', () => {
  assert.equal(formatINR(5000), '₹5,000');
  assert.equal(formatINR(1499), '₹1,499');
  assert.equal(formatINR(-750), '-₹750');
});

test('neutral streetwear items pair cleanly across closet slots', () => {
  assert.equal(areItemsCompatible(sampleCloset[0], sampleCloset[2]), true);
  assert.equal(areItemsCompatible(sampleCloset[0], sampleCloset[0]), false);
});

test('high-compatibility affordable drop returns Strong Buy verdict', () => {
  const oliveBomber: TrendingDrop = {
    id: 'd1',
    name: 'Cropped Olive Bomber',
    brand: 'H&M Studio',
    category: 'Outerwear',
    priceInr: 2299,
    storeName: 'H&M',
    storeUrl: 'https://www2.hm.com/en_in/',
    colorName: 'Olive',
    colorHex: '#4F5D3A',
    colorFamily: 'earth',
    vibe: 'Streetwear',
    tags: ['utility', 'layering', 'everyday'],
    fit: 'Boxy',
    silhouette: 'bomber',
    fabricNote: 'Nylon twill shell',
  };

  const compat = calculateWardrobeCompatibility(oliveBomber, sampleCloset);
  const unlocked = calculateUnlockedOutfits(oliveBomber, sampleCloset);
  const verdict = computeShoppingVerdict(oliveBomber, sampleCloset, 5000);

  assert.ok(compat >= 70, `Expected compat >= 70, got ${compat}`);
  assert.ok(unlocked >= 4, `Expected unlocked >= 4, got ${unlocked}`);
  assert.equal(verdict.kind, 'strong-buy');
  assert.equal(verdict.headline, 'Strong Buy');
  assert.equal(verdict.budgetDelta, 2701);
});

test('high-compatibility drop over remaining budget returns Wait for Next Month', () => {
  const expensiveShell: TrendingDrop = {
    id: 'd2',
    name: '3L Matte Black Tech Shell',
    brand: 'Nike ACG',
    category: 'Outerwear',
    priceInr: 6499,
    storeName: 'Nike',
    storeUrl: 'https://www.nike.com/in/',
    colorName: 'Black',
    colorHex: '#111317',
    colorFamily: 'neutral',
    vibe: 'Streetwear',
    tags: ['neutral', 'layering'],
    fit: 'Relaxed',
    silhouette: 'shell',
    fabricNote: 'Waterproof ripstop',
  };

  const verdict = computeShoppingVerdict(expensiveShell, sampleCloset, 5000);
  assert.equal(verdict.kind, 'wait-budget');
  assert.equal(verdict.headline, 'Wait for Next Month');
  assert.equal(verdict.fitsBudget, false);
  assert.equal(verdict.budgetDelta, -1499);
});

test('clashing low-compatibility affordable drop returns Trap Buy (Skip)', () => {
  const neonCyberJacket: TrendingDrop = {
    id: 'd3',
    name: 'Acid Magenta Cyber Vest',
    brand: 'Zara TRF',
    category: 'Outerwear',
    priceInr: 1499,
    storeName: 'Zara',
    storeUrl: 'https://www.zara.com/in/',
    colorName: 'Acid Magenta',
    colorHex: '#D946EF',
    colorFamily: 'bold',
    vibe: 'Techwear',
    tags: ['neon', 'rave'],
    fit: 'Boxy',
    silhouette: 'jacket',
    fabricNote: 'Reflective synthetic',
  };

  const compat = calculateWardrobeCompatibility(neonCyberJacket, sampleCloset);
  const verdict = computeShoppingVerdict(neonCyberJacket, sampleCloset, 5000);

  assert.ok(compat < 45, `Expected compat < 45, got ${compat}`);
  assert.equal(verdict.kind, 'trap-buy');
  assert.equal(verdict.headline, 'Trap Buy (Skip)');
  assert.equal(verdict.fitsBudget, true);
});

test('buildVisibleDropsPriceData computes short labels, budget fit, average, and max price', () => {
  const empty = buildVisibleDropsPriceData([], 5000);
  assert.equal(empty.points.length, 0);
  assert.equal(empty.avgPriceInr, 0);
  assert.equal(empty.maxPriceInr, 0);

  const sampleDrops: TrendingDrop[] = [
    {
      id: 'd-a',
      name: 'Cropped Nylon MA-1 Bomber',
      brand: 'H&M',
      category: 'Outerwear',
      priceInr: 2000,
      storeName: 'H&M',
      storeUrl: 'https://www2.hm.com/en_in/',
      colorName: 'Olive',
      colorHex: '#515E3C',
      colorFamily: 'earth',
      vibe: 'Streetwear',
      tags: ['streetwear'],
      fit: 'Boxy',
      silhouette: 'bomber',
      fabricNote: 'Nylon',
    },
    {
      id: 'd-b',
      name: '3-Layer Alpine Shell Parka',
      brand: 'Nike ACG',
      category: 'Outerwear',
      priceInr: 6000,
      storeName: 'Nike',
      storeUrl: 'https://www.nike.com/in/',
      colorName: 'Black',
      colorHex: '#15171C',
      colorFamily: 'neutral',
      vibe: 'Techwear',
      tags: ['techwear'],
      fit: 'Relaxed',
      silhouette: 'shell',
      fabricNote: 'Ripstop',
    },
  ];

  const summary = buildVisibleDropsPriceData(sampleDrops, 3500);
  assert.equal(summary.avgPriceInr, 4000);
  assert.equal(summary.maxPriceInr, 6000);
  assert.equal(summary.points[0].shortLabel, 'Bomber');
  assert.equal(summary.points[0].fitsBudget, true);
  assert.equal(summary.points[1].shortLabel, 'Parka');
  assert.equal(summary.points[1].fitsBudget, false);
});

test('buildColorPaletteSuggestions recommends complementary and neutral wardrobe tones for drops', () => {
  const neutralHoodie: TrendingDrop = {
    id: 'd-hoodie',
    name: '460gsm Washed Boxy Hoodie',
    brand: 'Uniqlo U',
    category: 'Tops',
    priceInr: 1499,
    storeName: 'Myntra',
    storeUrl: 'https://www.myntra.com/',
    colorName: 'Washed Charcoal',
    colorHex: '#3F4248',
    colorFamily: 'neutral',
    vibe: 'Minimalist',
    tags: ['neutral'],
    fit: 'Boxy',
    silhouette: 'hoodie',
    fabricNote: 'Terry cotton',
  };

  const neutralPalette = buildColorPaletteSuggestions(neutralHoodie, sampleCloset);
  assert.ok(neutralPalette.suggestions.length >= 3);
  assert.ok(
    neutralPalette.suggestions.some((s) => s.role === 'Complementary' && s.colorName === 'Olive'),
  );
  assert.ok(
    neutralPalette.suggestions.some((s) => s.colorName === 'Indigo'),
  );
  assert.ok(
    neutralPalette.suggestions.every((s) => s.category !== 'Tops'),
  );

  const boldVest: TrendingDrop = {
    id: 'd-bold',
    name: 'Acid Magenta Tactical Vest',
    brand: 'Zara TRF',
    category: 'Outerwear',
    priceInr: 1699,
    storeName: 'Zara',
    storeUrl: 'https://www.zara.com/in/',
    colorName: 'Acid Magenta',
    colorHex: '#C026D3',
    colorFamily: 'bold',
    vibe: 'Techwear',
    tags: ['neon'],
    fit: 'Boxy',
    silhouette: 'jacket',
    fabricNote: 'Nylon',
  };

  const boldPalette = buildColorPaletteSuggestions(boldVest, sampleCloset);
  assert.ok(boldPalette.suggestions.length >= 2);
  assert.ok(
    boldPalette.suggestions.every((s) => s.role === 'Neutral Anchor'),
  );
});
