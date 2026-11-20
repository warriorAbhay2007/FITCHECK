import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CROP_ALPHA_THRESHOLD,
  DEFAULT_HARD_THRESHOLD,
  DEFAULT_SOFT_THRESHOLD,
  classifyRgbColorName,
  computeTargetDimensions,
  computeTightBoundingBox,
  cropPixelsToBoundingBox,
  extractDominantColorFromPixels,
  removeBackgroundFromPixels,
  rgbToHex,
} from './garmentImageProcessor';
import {
  GARMENT_ANCHORS,
  MANNEQUIN_STAGE_ASPECT_RATIO,
  clampFineTuneTransform,
  getAnchorForSlot,
} from './mannequinAnchors';

test('rgbToHex and computeTargetDimensions enforce maxWidth 600 scaling cleanly', () => {
  assert.equal(rgbToHex(12, 180, 255), '#0CB4FF');
  assert.deepEqual(computeTargetDimensions(1200, 1600, 600), {
    width: 600,
    height: 800,
  });
  assert.deepEqual(computeTargetDimensions(420, 560, 600), {
    width: 420,
    height: 560,
  });
});

test('classifyRgbColorName maps garment RGBs to accurate names and ColorFamily', () => {
  assert.deepEqual(classifyRgbColorName(18, 18, 20), {
    colorName: 'Jet Black',
    colorFamily: 'neutral',
  });
  assert.deepEqual(classifyRgbColorName(110, 22, 30), {
    colorName: 'Deep Maroon',
    colorFamily: 'earth',
  });
  assert.deepEqual(classifyRgbColorName(28, 48, 86), {
    colorName: 'Midnight Navy',
    colorFamily: 'cool',
  });
});

test('removeBackgroundFromPixels (42/68) and tight bounding-box crop (alpha>40) strip padding accurately', () => {
  const w = 16;
  const h = 16;
  const pixels = new Uint8ClampedArray(w * h * 4);

  // Fill studio off-white background (248, 248, 248) with a dark maroon garment at x:4..11, y:3..12
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const isGarment = x >= 4 && x <= 11 && y >= 3 && y <= 12;
      pixels[p] = isGarment ? 112 : 248;
      pixels[p + 1] = isGarment ? 24 : 248;
      pixels[p + 2] = isGarment ? 32 : 248;
      pixels[p + 3] = 255;
    }
  }

  const { data, foregroundRatio } = removeBackgroundFromPixels(
    pixels,
    w,
    h,
    DEFAULT_HARD_THRESHOLD,
    DEFAULT_SOFT_THRESHOLD,
  );

  // Corner background becomes transparent; center garment stays opaque
  assert.equal(data[3], 0);
  assert.equal(data[(7 * w + 7) * 4 + 3], 255);
  assert.ok(foregroundRatio > 0.25 && foregroundRatio < 0.4);

  // Tight bounding-box crop strips empty transparent padding around the 8x10 garment
  const box = computeTightBoundingBox(data, w, h, CROP_ALPHA_THRESHOLD);
  assert.deepEqual(box, { x: 4, y: 3, width: 8, height: 10 });

  const cropped = cropPixelsToBoundingBox(data, w, box);
  assert.equal(cropped.width, 8);
  assert.equal(cropped.height, 10);

  const dominant = extractDominantColorFromPixels(
    cropped.data,
    cropped.width,
    cropped.height,
  );
  assert.equal(dominant.colorName, 'Deep Maroon');
  assert.equal(dominant.colorFamily, 'earth');
  assert.equal(dominant.hex, '#701820');
});

test('mannequinAnchors locks anatomical percentages for 200/440 stage and clamps fine-tune bounds', () => {
  assert.equal(MANNEQUIN_STAGE_ASPECT_RATIO, '200 / 440');
  assert.deepEqual(
    {
      top: GARMENT_ANCHORS.baseUpper.topPct,
      width: GARMENT_ANCHORS.baseUpper.widthPct,
      maxHeight: GARMENT_ANCHORS.baseUpper.maxHeightPct,
      zIndex: GARMENT_ANCHORS.baseUpper.zIndex,
    },
    { top: 18, width: 46, maxHeight: 38, zIndex: 20 },
  );
  assert.deepEqual(
    {
      top: getAnchorForSlot('outerwear').topPct,
      width: getAnchorForSlot('outerwear').widthPct,
      maxHeight: getAnchorForSlot('outerwear').maxHeightPct,
      zIndex: getAnchorForSlot('outerwear').zIndex,
    },
    { top: 17.5, width: 50, maxHeight: 40, zIndex: 25 },
  );
  assert.deepEqual(
    {
      top: getAnchorForSlot('bottom').topPct,
      width: getAnchorForSlot('bottom').widthPct,
      maxHeight: getAnchorForSlot('bottom').maxHeightPct,
      zIndex: getAnchorForSlot('bottom').zIndex,
    },
    { top: 51, width: 38, maxHeight: 42, zIndex: 15 },
  );
  assert.deepEqual(
    {
      top: getAnchorForSlot('footwear').topPct,
      width: getAnchorForSlot('footwear').widthPct,
      maxHeight: getAnchorForSlot('footwear').maxHeightPct,
      zIndex: getAnchorForSlot('footwear').zIndex,
    },
    { top: 90, width: 28, maxHeight: 10, zIndex: 18 },
  );

  assert.deepEqual(clampFineTuneTransform({ scale: 1.4, offsetY: -25 }), {
    scale: 1.15,
    offsetY: -10,
  });
  assert.deepEqual(clampFineTuneTransform({ scale: 0.72, offsetY: 14 }), {
    scale: 0.85,
    offsetY: 10,
  });
});
