import { GarmentTransform, SlotKey } from '../types/wardrobe';

export const MANNEQUIN_STAGE_ASPECT_RATIO = '200 / 440';

export type GarmentAnchorSlot = 'baseUpper' | 'outerwear' | 'bottomwear' | 'footwear';

export interface GarmentAnchorBox {
  slot: GarmentAnchorSlot;
  topPct: number;
  widthPct: number;
  maxHeightPct: number;
  zIndex: number;
  lockLabel: string;
}

export const GARMENT_ANCHORS: Record<GarmentAnchorSlot, GarmentAnchorBox> = {
  baseUpper: {
    slot: 'baseUpper',
    topPct: 18,
    widthPct: 46,
    maxHeightPct: 38,
    zIndex: 20,
    lockLabel: 'Shoulder-line lock',
  },
  outerwear: {
    slot: 'outerwear',
    topPct: 17.5,
    widthPct: 50,
    maxHeightPct: 40,
    zIndex: 25,
    lockLabel: 'Outerwear shoulder lock',
  },
  bottomwear: {
    slot: 'bottomwear',
    topPct: 51,
    widthPct: 38,
    maxHeightPct: 42,
    zIndex: 15,
    lockLabel: 'Waistline lock',
  },
  footwear: {
    slot: 'footwear',
    topPct: 90,
    widthPct: 28,
    maxHeightPct: 10,
    zIndex: 18,
    lockLabel: 'Ankle lock',
  },
};

export function getAnchorForSlot(slotKey: SlotKey): GarmentAnchorBox {
  switch (slotKey) {
    case 'outerwear':
      return GARMENT_ANCHORS.outerwear;
    case 'bottom':
      return GARMENT_ANCHORS.bottomwear;
    case 'footwear':
      return GARMENT_ANCHORS.footwear;
    case 'top':
    default:
      return GARMENT_ANCHORS.baseUpper;
  }
}

export const FINE_TUNE_SCALE_MIN = 0.85;
export const FINE_TUNE_SCALE_MAX = 1.15;
export const FINE_TUNE_OFFSET_MIN = -10;
export const FINE_TUNE_OFFSET_MAX = 10;

export function clampFineTuneTransform(transform?: GarmentTransform): GarmentTransform {
  const rawScale = transform?.scale ?? 1;
  const rawOffsetY = transform?.offsetY ?? 0;
  return {
    scale: Math.round(Math.max(FINE_TUNE_SCALE_MIN, Math.min(FINE_TUNE_SCALE_MAX, rawScale)) * 100) / 100,
    offsetY: Math.round(Math.max(FINE_TUNE_OFFSET_MIN, Math.min(FINE_TUNE_OFFSET_MAX, rawOffsetY))),
  };
}
