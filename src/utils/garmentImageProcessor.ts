import { ColorFamily } from '../types/wardrobe';

export const DEFAULT_HARD_THRESHOLD = 42;
export const DEFAULT_SOFT_THRESHOLD = 68;
export const CROP_ALPHA_THRESHOLD = 40;

export interface ProcessedGarmentImage {
  dataUrl: string;
  roundedCardDataUrl: string;
  transparentDataUrl: string;
  width: number;
  height: number;
  colorHex: string;
  colorName: string;
  colorFamily: ColorFamily;
  recommendedCutoutMode: 'transparent' | 'rounded-card';
  cutoutForegroundRatio: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: (h / 6) * 360, s, l };
}

export function classifyRgbColorName(
  r: number,
  g: number,
  b: number,
): { colorName: string; colorFamily: ColorFamily } {
  const { h, s, l } = rgbToHsl(r, g, b);

  // Neutral grayscale / off-white / charcoal
  if (s < 0.14) {
    if (l < 0.15) return { colorName: 'Jet Black', colorFamily: 'neutral' };
    if (l < 0.34) return { colorName: 'Charcoal Grey', colorFamily: 'neutral' };
    if (l < 0.68) return { colorName: 'Heather Grey', colorFamily: 'neutral' };
    if (l < 0.87) return { colorName: 'Off-White', colorFamily: 'neutral' };
    return { colorName: 'Crisp White', colorFamily: 'neutral' };
  }

  // Low-saturation warm neutrals (beige / khaki / espresso / cream)
  if (s < 0.32 && h >= 18 && h <= 58) {
    if (l < 0.24) return { colorName: 'Espresso Brown', colorFamily: 'earth' };
    if (l < 0.45) return { colorName: 'Mocha Brown', colorFamily: 'earth' };
    if (l < 0.72) return { colorName: 'Sand Khaki', colorFamily: 'earth' };
    return { colorName: 'Warm Oatmeal', colorFamily: 'neutral' };
  }

  // Reds / Maroons / Pinks
  if (h < 16 || h >= 340) {
    if (l < 0.3) return { colorName: 'Deep Maroon', colorFamily: 'earth' };
    if (l > 0.68) return { colorName: 'Blush Pink', colorFamily: 'cool' };
    if (s > 0.58) return { colorName: 'Crimson Red', colorFamily: 'bold' };
    return { colorName: 'Terracotta Red', colorFamily: 'earth' };
  }

  // Oranges / Rust / Terracotta
  if (h < 40) {
    if (l < 0.32) return { colorName: 'Espresso Brown', colorFamily: 'earth' };
    if (s > 0.65 && l > 0.46) return { colorName: 'Burnt Orange', colorFamily: 'bold' };
    return { colorName: 'Camel Tan', colorFamily: 'earth' };
  }

  // Yellows / Mustard / Sand
  if (h < 68) {
    if (l > 0.74) return { colorName: 'Ivory Cream', colorFamily: 'neutral' };
    if (s > 0.55) return { colorName: 'Mustard Gold', colorFamily: 'earth' };
    return { colorName: 'Warm Khaki', colorFamily: 'earth' };
  }

  // Greens / Olive / Sage / Forest
  if (h < 165) {
    if (h < 98 && l < 0.48) return { colorName: 'Olive Green', colorFamily: 'earth' };
    if (s < 0.34 && l >= 0.45) return { colorName: 'Sage Green', colorFamily: 'cool' };
    if (l < 0.32) return { colorName: 'Forest Green', colorFamily: 'cool' };
    if (s > 0.62 && l > 0.52) return { colorName: 'Lime Green', colorFamily: 'bold' };
    return { colorName: 'Moss Green', colorFamily: 'earth' };
  }

  // Teals & Cyans
  if (h < 198) {
    if (l < 0.36) return { colorName: 'Deep Teal', colorFamily: 'cool' };
    return { colorName: 'Slate Teal', colorFamily: 'cool' };
  }

  // Blues / Denim / Navy / Indigo
  if (h < 258) {
    if (l < 0.25) return { colorName: 'Midnight Navy', colorFamily: 'cool' };
    if (s < 0.45 && l < 0.5) return { colorName: 'Raw Indigo', colorFamily: 'cool' };
    if (l > 0.62) return { colorName: 'Ice Blue', colorFamily: 'cool' };
    return { colorName: 'Cobalt Blue', colorFamily: 'cool' };
  }

  // Purples / Lavender / Plum
  if (h < 312) {
    if (l < 0.32) return { colorName: 'Deep Plum', colorFamily: 'cool' };
    if (l > 0.65) return { colorName: 'Muted Lavender', colorFamily: 'cool' };
    return { colorName: 'Royal Purple', colorFamily: 'bold' };
  }

  // Magenta / Berry
  return s > 0.55
    ? { colorName: 'Berry Magenta', colorFamily: 'bold' }
    : { colorName: 'Dusty Rose', colorFamily: 'earth' };
}

export function computeTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth = 600,
): { width: number; height: number } {
  const safeW = Math.max(1, Math.round(srcWidth));
  const safeH = Math.max(1, Math.round(srcHeight));
  if (safeW <= maxWidth) {
    return { width: safeW, height: safeH };
  }
  const scale = maxWidth / safeW;
  return {
    width: maxWidth,
    height: Math.max(1, Math.round(safeH * scale)),
  };
}

/**
 * Samples the 4 corners of an RGBA image to determine the background RGB colors.
 */
function sampleCornerBackgroundColors(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): { avg: [number, number, number]; corners: [number, number, number][] } {
  const patchX = Math.max(1, Math.min(6, Math.floor(width / 10)));
  const patchY = Math.max(1, Math.min(6, Math.floor(height / 10)));

  const cornerOrigins: [number, number][] = [
    [0, 0],
    [Math.max(0, width - patchX), 0],
    [0, Math.max(0, height - patchY)],
    [Math.max(0, width - patchX), Math.max(0, height - patchY)],
  ];

  const corners: [number, number, number][] = [];
  for (const [ox, oy] of cornerOrigins) {
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let y = oy; y < Math.min(height, oy + patchY); y++) {
      for (let x = ox; x < Math.min(width, ox + patchX); x++) {
        const p = (y * width + x) * 4;
        if (rgba[p + 3] < 20) continue;
        r += rgba[p];
        g += rgba[p + 1];
        b += rgba[p + 2];
        count++;
      }
    }
    if (count > 0) {
      corners.push([r / count, g / count, b / count]);
    }
  }

  if (corners.length === 0) {
    return { avg: [255, 255, 255], corners: [[255, 255, 255]] };
  }

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (const [r, g, b] of corners) {
    sumR += r;
    sumG += g;
    sumB += b;
  }
  return {
    avg: [sumR / corners.length, sumG / corners.length, sumB / corners.length],
    corners,
  };
}

function minCornerColorDistance(
  r: number,
  g: number,
  b: number,
  corners: [number, number, number][],
): number {
  let minD = Infinity;
  for (const [cr, cg, cb] of corners) {
    const dr = r - cr;
    const dg = g - cg;
    const db = b - cb;
    const d = Math.sqrt(dr * dr + dg * dg + db * db);
    if (d < minD) minD = d;
  }
  return minD;
}

/**
 * Corner-sampled, border-seeded background removal with soft edge feathering
 * (default hardThreshold = 42, softThreshold = 68).
 */
export function removeBackgroundFromPixels(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  hardThreshold = DEFAULT_HARD_THRESHOLD,
  softThreshold = Math.max(hardThreshold + 12, DEFAULT_SOFT_THRESHOLD),
): { data: Uint8ClampedArray; foregroundRatio: number } {
  const out = new Uint8ClampedArray(rgba);
  const totalPixels = width * height;
  if (totalPixels === 0) {
    return { data: out, foregroundRatio: 0 };
  }

  const effectiveSoft = Math.max(hardThreshold + 8, softThreshold);
  const { avg, corners } = sampleCornerBackgroundColors(rgba, width, height);

  const visited = new Uint8Array(totalPixels);
  const removed = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  const midThreshold = (hardThreshold + effectiveSoft) * 0.52;

  const colorDistToBg = (idx: number): number => {
    const p = idx * 4;
    if (rgba[p + 3] <= CROP_ALPHA_THRESHOLD) return 0;
    const r = rgba[p];
    const g = rgba[p + 1];
    const b = rgba[p + 2];
    const cornerDist = minCornerColorDistance(r, g, b, corners);
    const avgDist = Math.sqrt(
      (r - avg[0]) ** 2 + (g - avg[1]) ** 2 + (b - avg[2]) ** 2,
    );
    return Math.min(cornerDist, avgDist);
  };

  const canFloodPixel = (idx: number, refR: number, refG: number, refB: number): boolean => {
    const p = idx * 4;
    if (rgba[p + 3] <= CROP_ALPHA_THRESHOLD) return true;
    const bgDist = colorDistToBg(idx);
    if (bgDist <= hardThreshold) return true;
    const localDist = Math.sqrt(
      (rgba[p] - refR) ** 2 + (rgba[p + 1] - refG) ** 2 + (rgba[p + 2] - refB) ** 2,
    );
    return bgDist <= midThreshold && localDist <= hardThreshold * 0.65;
  };

  const enqueueBorder = (idx: number) => {
    if (visited[idx]) return;
    const dist = colorDistToBg(idx);
    if (dist <= midThreshold) {
      visited[idx] = 1;
      removed[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < width; x++) {
    enqueueBorder(x);
    enqueueBorder((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    enqueueBorder(y * width);
    enqueueBorder(y * width + (width - 1));
  }

  while (head < tail) {
    const cur = queue[head++];
    const curP = cur * 4;
    const cr = rgba[curP];
    const cg = rgba[curP + 1];
    const cb = rgba[curP + 2];
    const cx = cur % width;
    const cy = (cur - cx) / width;

    const neighbors: number[] = [];
    if (cx > 0) neighbors.push(cur - 1);
    if (cx < width - 1) neighbors.push(cur + 1);
    if (cy > 0) neighbors.push(cur - width);
    if (cy < height - 1) neighbors.push(cur + width);

    for (const next of neighbors) {
      if (visited[next]) continue;
      visited[next] = 1;
      if (canFloodPixel(next, cr, cg, cb)) {
        removed[next] = 1;
        queue[tail++] = next;
      }
    }
  }

  let fgCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    const p = i * 4;
    if (removed[i]) {
      out[p + 3] = 0;
      continue;
    }

    // Soft edge feathering between hardThreshold (42) and softThreshold (68)
    const x = i % width;
    const y = (i - x) / width;
    const touchesRemoved =
      (x > 0 && removed[i - 1]) ||
      (x < width - 1 && removed[i + 1]) ||
      (y > 0 && removed[i - width]) ||
      (y < height - 1 && removed[i + width]);

    if (touchesRemoved) {
      const dist = colorDistToBg(i);
      if (dist <= hardThreshold) {
        out[p + 3] = 0;
      } else if (dist < effectiveSoft) {
        const t = (dist - hardThreshold) / (effectiveSoft - hardThreshold);
        out[p + 3] = Math.round(out[p + 3] * Math.max(0.15, Math.min(1, t)));
      }
    }

    if (out[p + 3] > CROP_ALPHA_THRESHOLD) fgCount++;
  }

  return {
    data: out,
    foregroundRatio: fgCount / totalPixels,
  };
}

/**
 * Scans non-transparent pixels (alpha > 40) to compute the tight garment bounding box.
 */
export function computeTightBoundingBox(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  alphaThreshold = CROP_ALPHA_THRESHOLD,
): BoundingBox {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = rgba[(y * width + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width, height };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export function cropPixelsToBoundingBox(
  rgba: Uint8ClampedArray,
  srcWidth: number,
  box: BoundingBox,
): { data: Uint8ClampedArray; width: number; height: number } {
  const out = new Uint8ClampedArray(box.width * box.height * 4);
  for (let y = 0; y < box.height; y++) {
    const srcRowStart = ((box.y + y) * srcWidth + box.x) * 4;
    const dstRowStart = y * box.width * 4;
    out.set(rgba.subarray(srcRowStart, srcRowStart + box.width * 4), dstRowStart);
  }
  return {
    data: out,
    width: box.width,
    height: box.height,
  };
}

/**
 * Extracts dominant garment color from opaque foreground pixels,
 * weighting the central garment region higher than outer seams.
 */
export function extractDominantColorFromPixels(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): { hex: string; colorName: string; colorFamily: ColorFamily } {
  const bins = new Map<number, { count: number; rSum: number; gSum: number; bSum: number }>();

  const minX = Math.floor(width * 0.1);
  const maxX = Math.ceil(width * 0.9);
  const minY = Math.floor(height * 0.1);
  const maxY = Math.ceil(height * 0.9);

  const collect = (useBounds: boolean) => {
    bins.clear();
    const x0 = useBounds ? minX : 0;
    const x1 = useBounds ? maxX : width;
    const y0 = useBounds ? minY : 0;
    const y1 = useBounds ? maxY : height;

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const p = (y * width + x) * 4;
        if (rgba[p + 3] < 120) continue;
        const r = rgba[p];
        const g = rgba[p + 1];
        const b = rgba[p + 2];
        const qr = r >> 4;
        const qg = g >> 4;
        const qb = b >> 4;
        const key = (qr << 8) | (qg << 4) | qb;
        const weight =
          x > width * 0.25 && x < width * 0.75 && y > height * 0.22 && y < height * 0.78
            ? 2
            : 1;
        const entry = bins.get(key);
        if (entry) {
          entry.count += weight;
          entry.rSum += r * weight;
          entry.gSum += g * weight;
          entry.bSum += b * weight;
        } else {
          bins.set(key, {
            count: weight,
            rSum: r * weight,
            gSum: g * weight,
            bSum: b * weight,
          });
        }
      }
    }
  };

  collect(true);
  if (bins.size === 0) {
    collect(false);
  }

  if (bins.size === 0) {
    return { hex: '#2B2B2E', colorName: 'Charcoal Grey', colorFamily: 'neutral' };
  }

  let best: { count: number; rSum: number; gSum: number; bSum: number } | null = null;
  for (const entry of bins.values()) {
    if (!best || entry.count > best.count) {
      best = entry;
    }
  }

  if (!best || best.count === 0) {
    return { hex: '#2B2B2E', colorName: 'Charcoal Grey', colorFamily: 'neutral' };
  }

  const r = Math.round(best.rSum / best.count);
  const g = Math.round(best.gSum / best.count);
  const b = Math.round(best.bSum / best.count);
  const hex = rgbToHex(r, g, b);
  const { colorName, colorFamily } = classifyRgbColorName(r, g, b);
  return { hex, colorName, colorFamily };
}

function encodeCanvasCompressed(
  canvas: HTMLCanvasElement,
  needsAlpha: boolean,
): string {
  const webp = canvas.toDataURL('image/webp', 0.8);
  if (webp.startsWith('data:image/webp')) {
    return webp;
  }
  if (needsAlpha) {
    return canvas.toDataURL('image/png');
  }
  return canvas.toDataURL('image/jpeg', 0.8);
}

function loadImageElement(srcUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode selected image file.'));
    img.src = srcUrl;
  });
}

export async function processUploadedGarmentImage(
  file: File,
  options?: { sensitivity?: number; maxWidth?: number },
): Promise<ProcessedGarmentImage> {
  const maxWidth = options?.maxWidth ?? 600;
  const hardThreshold = options?.sensitivity ?? DEFAULT_HARD_THRESHOLD;
  const softThreshold = Math.max(hardThreshold + 26, DEFAULT_SOFT_THRESHOLD);
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImageElement(objectUrl);
    const { width, height } = computeTargetDimensions(
      img.naturalWidth || img.width || 600,
      img.naturalHeight || img.height || 600,
      maxWidth,
    );

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = width;
    baseCanvas.height = height;
    const baseCtx = baseCanvas.getContext('2d');
    if (!baseCtx) {
      throw new Error('Canvas 2D context unavailable.');
    }
    baseCtx.drawImage(img, 0, 0, width, height);

    const imgData = baseCtx.getImageData(0, 0, width, height);
    const { data: cutoutPixels, foregroundRatio } = removeBackgroundFromPixels(
      imgData.data,
      width,
      height,
      hardThreshold,
      softThreshold,
    );

    const isGoodCutout = foregroundRatio >= 0.05 && foregroundRatio <= 0.96;
    const recommendedCutoutMode: 'transparent' | 'rounded-card' = isGoodCutout
      ? 'transparent'
      : 'rounded-card';

    // Tight bounding-box auto-crop scanning alpha > 40
    const box = isGoodCutout
      ? computeTightBoundingBox(cutoutPixels, width, height, CROP_ALPHA_THRESHOLD)
      : { x: 0, y: 0, width, height };

    const croppedCutout = cropPixelsToBoundingBox(cutoutPixels, width, box);

    const cutoutCanvas = document.createElement('canvas');
    cutoutCanvas.width = croppedCutout.width;
    cutoutCanvas.height = croppedCutout.height;
    const cutoutCtx = cutoutCanvas.getContext('2d');
    if (!cutoutCtx) {
      throw new Error('Cutout canvas context unavailable.');
    }
    const outImgData = cutoutCtx.createImageData(
      croppedCutout.width,
      croppedCutout.height,
    );
    outImgData.data.set(croppedCutout.data);
    cutoutCtx.putImageData(outImgData, 0, 0);

    // Also crop clean card canvas tightly to the same garment bounds when valid
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = box.width;
    cardCanvas.height = box.height;
    const cardCtx = cardCanvas.getContext('2d');
    if (!cardCtx) {
      throw new Error('Card canvas context unavailable.');
    }
    cardCtx.drawImage(
      baseCanvas,
      box.x,
      box.y,
      box.width,
      box.height,
      0,
      0,
      box.width,
      box.height,
    );

    // Extract dominant RGB/Hex from tightly cropped foreground pixels
    const colorSource = isGoodCutout ? croppedCutout.data : imgData.data;
    const colorW = isGoodCutout ? croppedCutout.width : width;
    const colorH = isGoodCutout ? croppedCutout.height : height;
    const { hex, colorName, colorFamily } = extractDominantColorFromPixels(
      colorSource,
      colorW,
      colorH,
    );

    const transparentDataUrl = encodeCanvasCompressed(cutoutCanvas, true);
    const roundedCardDataUrl = encodeCanvasCompressed(cardCanvas, false);

    return {
      dataUrl:
        recommendedCutoutMode === 'transparent'
          ? transparentDataUrl
          : roundedCardDataUrl,
      roundedCardDataUrl,
      transparentDataUrl,
      width: croppedCutout.width,
      height: croppedCutout.height,
      colorHex: hex,
      colorName,
      colorFamily,
      recommendedCutoutMode,
      cutoutForegroundRatio: foregroundRatio,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
