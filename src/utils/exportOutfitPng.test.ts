import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOutfitExportFilename,
  getEquippedSlotCount,
} from './exportOutfitPng';
import { OutfitSlots, WardrobeItem } from '../types/wardrobe';

const sampleTee: WardrobeItem = {
  id: 'w1',
  name: 'Oversized Black Tee',
  category: 'Tops',
  colorName: 'Black',
  colorHex: '#18181B',
  colorFamily: 'neutral',
  vibe: 'Streetwear',
  tags: ['neutral'],
  fit: 'Oversized',
  silhouette: 'tee',
};

test('buildOutfitExportFilename prefers sanitized lookTitle, falls back to contextTag, then default', () => {
  assert.equal(
    buildOutfitExportFilename('Rainy Campus Layer!', 'College Daily'),
    'fitcheck-rainy-campus-layer.png',
  );
  assert.equal(
    buildOutfitExportFilename('   ', 'Weekend Casual'),
    'fitcheck-weekend-casual-outfit.png',
  );
  assert.equal(buildOutfitExportFilename('', ''), 'fitcheck-outfit.png');
});

test('getEquippedSlotCount counts only populated outfit slots', () => {
  const emptySlots: OutfitSlots = {
    outerwear: null,
    top: null,
    bottom: null,
    footwear: null,
  };
  assert.equal(getEquippedSlotCount(emptySlots), 0);

  const partialSlots: OutfitSlots = {
    outerwear: null,
    top: sampleTee,
    bottom: null,
    footwear: null,
  };
  assert.equal(getEquippedSlotCount(partialSlots), 1);
});
