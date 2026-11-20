import React from 'react';
import {
  BodyTypeId,
  FitPreference,
  MirrorLighting,
  OutfitSlots,
  SkinToneId,
  SlotKey,
  WardrobeItem,
} from '../types/wardrobe';
import {
  MANNEQUIN_STAGE_ASPECT_RATIO,
  clampFineTuneTransform,
  getAnchorForSlot,
} from '../utils/mannequinAnchors';
import { SKIN_TONE_OPTIONS } from '../utils/wardrobeStyling';

interface MannequinLookPreviewProps {
  slots: OutfitSlots;
  skinTone: SkinToneId;
  fitPreference: FitPreference;
  bodyType?: BodyTypeId;
  lighting: MirrorLighting;
  animateChanges?: boolean;
}

function getStroke(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 'rgba(245,239,230,0.35)';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.28 ? 'rgba(245,239,230,0.36)' : 'rgba(24,21,18,0.42)';
}

function darkenHex(hex: string, amount = 0.22): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#181512';
  const r = Math.max(0, Math.round(parseInt(clean.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(clean.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(clean.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hasPhotoOverlay(
  item: WardrobeItem | { imageUrl?: string } | null | undefined,
): item is WardrobeItem & { imageUrl: string } {
  return Boolean(item && item.imageUrl);
}

export const MannequinLookPreview: React.FC<MannequinLookPreviewProps> = ({
  slots,
  skinTone,
  fitPreference,
  bodyType = 'average',
  lighting,
  animateChanges = true,
}) => {
  const skinOption =
    SKIN_TONE_OPTIONS.find((s) => s.id === skinTone) ?? SKIN_TONE_OPTIONS[1];
  const skinHex = skinOption.swatchHex;
  const skinShade = darkenHex(skinHex, 0.18);

  const isRelaxed = fitPreference === 'Relaxed/Oversized';
  const isSlim = fitPreference === 'Slim';
  const bodyShoulderOffset =
    bodyType === 'broad' ? 4 : bodyType === 'athletic' ? 2 : bodyType === 'heavy' ? 3 : bodyType === 'lean' ? -2 : 0;
  const bodyWaistOffset =
    bodyType === 'heavy' ? 5 : bodyType === 'lean' ? -2 : 0;
  const shoulderDelta = (isRelaxed ? 4 : isSlim ? -2 : 0) + bodyShoulderOffset;
  const legDelta = (isRelaxed ? 3 : isSlim ? -2 : 0) + (bodyType === 'heavy' ? 2 : 0);

  const top = slots.top;
  const outer = slots.outerwear;
  const bottom = slots.bottom;
  const shoes = slots.footwear;

  const topColor = top?.colorHex ?? '#2A2520';
  const topStroke = top ? getStroke(topColor) : 'rgba(224,185,115,0.22)';
  const outerColor = outer?.colorHex ?? '#3B3028';
  const outerStroke = outer ? getStroke(outerColor) : 'transparent';
  const bottomColor = bottom?.colorHex ?? '#23201D';
  const bottomStroke = bottom ? getStroke(bottomColor) : 'rgba(224,185,115,0.2)';
  const shoeColor = shoes?.colorHex ?? '#1C1917';
  const shoeStroke = shoes ? getStroke(shoeColor) : 'rgba(224,185,115,0.2)';

  const lightingFilter =
    lighting === 'Daylight'
      ? 'brightness(1.04) contrast(1.02)'
      : lighting === 'Warm Indoor'
        ? 'sepia(0.09) saturate(1.06) brightness(1.01)'
        : 'brightness(0.88) contrast(1.08)';

  const isShortSleeveTop =
    top?.silhouette === 'tee' || top?.silhouette === 'polo';

  const slotAnimClass = animateChanges ? 'animate-slot-swap' : '';
  const photoAnimClass = animateChanges ? 'animate-garment-fade' : '';

  const renderAnchoredPhotoLayer = (
    item: WardrobeItem & { imageUrl: string },
    slotKey: SlotKey,
  ) => {
    const anchor = getAnchorForSlot(slotKey);
    const { scale, offsetY } = clampFineTuneTransform(item.mirrorTransform);
    const isCard = item.cutoutMode === 'rounded-card';

    return (
      <img
        key={`${slotKey}-${item.id}`}
        src={item.imageUrl}
        alt={item.name}
        data-testid={`anchored-garment-${slotKey}`}
        data-anchor-slot={anchor.slot}
        className={`pointer-events-none select-none ${
          isCard ? 'rounded-xl border border-[#e0b973]/35' : ''
        } ${photoAnimClass}`}
        style={{
          position: 'absolute',
          left: '50%',
          top: `${anchor.topPct}%`,
          width: `${anchor.widthPct}%`,
          maxHeight: `${anchor.maxHeightPct}%`,
          height: 'auto',
          zIndex: anchor.zIndex,
          objectFit: 'contain',
          objectPosition: 'top center',
          transform: `translateX(-50%) translateY(${offsetY}px) scale(${scale})`,
          transformOrigin: 'top center',
          filter: 'drop-shadow(0px 6px 10px rgba(0, 0, 0, 0.35))',
        }}
      />
    );
  };

  const hasAnyUploadedPhoto =
    hasPhotoOverlay(top) ||
    hasPhotoOverlay(outer) ||
    hasPhotoOverlay(bottom) ||
    hasPhotoOverlay(shoes);

  return (
    <div
      className="relative w-full h-full min-h-0 flex items-center justify-center select-none transition-all duration-300"
      style={{ filter: lightingFilter }}
    >
      {/* Fixed-ratio 200:440 Mannequin Stage */}
      <div
        data-testid="mannequin-stage"
        className="mannequin-stage"
        style={{ aspectRatio: MANNEQUIN_STAGE_ASPECT_RATIO }}
        role="img"
        aria-label="Full-length mannequin outfit preview"
      >
        {/* LAYER 0 (z-10): Calibrated Anatomical Mannequin Figure (200x440 coordinate space) */}
        <svg
          viewBox="0 0 200 440"
          className="absolute inset-0 w-full h-full drop-shadow-[0_14px_26px_rgba(0,0,0,0.45)]"
          style={{ zIndex: 10 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="mirrorFloorShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.65)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Floor reflection shadow */}
          <ellipse cx="100" cy="431" rx="52" ry="8" fill="url(#mirrorFloorShadow)" />

          {/* Head & Neck */}
          <ellipse
            cx="100"
            cy="40"
            rx="15"
            ry="19"
            fill={skinHex}
            stroke={skinShade}
            strokeWidth="1.4"
          />
          <path d="M92 57 L91 77 Q100 83 109 77 L108 57 Z" fill={skinShade} />

          {/* Torso Base Silhouette (shoulders at y=79 => 18%, waist at y=224 => 51%) */}
          <path
            d={`M${60 - shoulderDelta} 80 L100 76 L${140 + shoulderDelta} 80 L${132 + bodyWaistOffset} 162 L${134 + bodyWaistOffset} 224 H${66 - bodyWaistOffset} L${68 - bodyWaistOffset} 162 Z`}
            fill={skinShade}
            opacity="0.24"
          />

          {/* Arms (extending cleanly from shoulder anchor y=84) */}
          <path
            d={`M${62 - shoulderDelta} 86 L${46 - shoulderDelta} 226 L${54 - shoulderDelta} 228 L${70 - shoulderDelta} 94 Z`}
            fill={skinHex}
            stroke={skinShade}
            strokeWidth="1.2"
          />
          <path
            d={`M${138 + shoulderDelta} 86 L${154 + shoulderDelta} 226 L${146 + shoulderDelta} 228 L${130 + shoulderDelta} 94 Z`}
            fill={skinHex}
            stroke={skinShade}
            strokeWidth="1.2"
          />
          <circle cx={49 - shoulderDelta} cy="231" r="5" fill={skinHex} stroke={skinShade} strokeWidth="1" />
          <circle cx={151 + shoulderDelta} cy="231" r="5" fill={skinHex} stroke={skinShade} strokeWidth="1" />

          {/* Legs & Ankles (waist y=224 => 51% down to ankle line y=396 => 90%) */}
          <path
            d="M72 224 H97 L93 398 H78 Z"
            fill={skinShade}
            opacity="0.28"
          />
          <path
            d="M103 224 H128 L122 398 H107 Z"
            fill={skinShade}
            opacity="0.28"
          />
          <rect x="78" y="382" width="12" height="22" rx="4" fill={skinShade} />
          <rect x="110" y="382" width="12" height="22" rx="4" fill={skinShade} />
        </svg>

        {/* LAYER 1 (z-15): BOTTOMWEAR (Waistline lock: top 51%, width 38%, max-height 42%) */}
        {bottom ? (
          hasPhotoOverlay(bottom) ? (
            renderAnchoredPhotoLayer(bottom, 'bottom')
          ) : (
            <svg
              viewBox="0 0 200 440"
              className={`absolute inset-0 w-full h-full pointer-events-none ${slotAnimClass}`}
              style={{ zIndex: 15 }}
              fill="none"
              aria-hidden="true"
            >
              <path
                d={
                  bottom.silhouette === 'shorts'
                    ? `M${66 - legDelta} 224 H${134 + legDelta} L${140 + legDelta} 302 L${106 + legDelta / 2} 302 L100 264 L${94 - legDelta / 2} 302 L${60 - legDelta} 302 Z`
                    : bottom.silhouette === 'joggers'
                      ? `M${67 - legDelta} 224 H${133 + legDelta} L${136 + legDelta} 382 L${131 + legDelta / 2} 394 H${112 + legDelta / 2} L${110 + legDelta / 2} 382 L100 274 L${90 - legDelta / 2} 382 L${88 - legDelta / 2} 394 H${69 - legDelta / 2} L${64 - legDelta} 382 Z`
                      : `M${66 - legDelta} 224 H${134 + legDelta} L${140 + legDelta} 396 L${110 + legDelta / 2} 396 L100 274 L${90 - legDelta / 2} 396 L${60 - legDelta} 396 Z`
                }
                fill={bottomColor}
                stroke={bottomStroke}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <line
                x1={67 - legDelta}
                y1="232"
                x2={133 + legDelta}
                y2="232"
                stroke={bottomStroke}
                strokeWidth="1.5"
              />
              {bottom.silhouette === 'cargo' && (
                <>
                  <rect
                    x={58 - legDelta}
                    y="288"
                    width="13"
                    height="22"
                    rx="2"
                    fill={darkenHex(bottomColor, 0.1)}
                    stroke={bottomStroke}
                    strokeWidth="1.4"
                  />
                  <rect
                    x={129 + legDelta}
                    y="288"
                    width="13"
                    height="22"
                    rx="2"
                    fill={darkenHex(bottomColor, 0.1)}
                    stroke={bottomStroke}
                    strokeWidth="1.4"
                  />
                </>
              )}
              {bottom.silhouette === 'joggers' && (
                <>
                  <path d="M95 232 L92 248 M105 232 L108 248" stroke={bottomStroke} strokeWidth="1.4" strokeLinecap="round" />
                  <line x1={65 - legDelta} y1="382" x2={90 - legDelta / 2} y2="382" stroke={bottomStroke} strokeWidth="1.6" />
                  <line x1={110 + legDelta / 2} y1="382" x2={135 + legDelta} y2="382" stroke={bottomStroke} strokeWidth="1.6" />
                </>
              )}
              {bottom.silhouette === 'trousers' && (
                <>
                  <line x1="80" y1="238" x2="75" y2="388" stroke={bottomStroke} strokeWidth="1.2" strokeDasharray="3 2" />
                  <line x1="120" y1="238" x2="125" y2="388" stroke={bottomStroke} strokeWidth="1.2" strokeDasharray="3 2" />
                </>
              )}
              {bottom.silhouette === 'denim' && (
                <>
                  <path d="M69 240 Q79 247 85 235" stroke={bottomStroke} strokeWidth="1.4" />
                  <path d="M131 240 Q121 247 115 235" stroke={bottomStroke} strokeWidth="1.4" />
                </>
              )}
            </svg>
          )
        ) : (
          <svg
            viewBox="0 0 200 440"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 15 }}
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M66 224 H134 L138 394 H110 L100 274 L90 394 H62 Z"
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(224,185,115,0.25)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>
        )}

        {/* LAYER 2 (z-18): FOOTWEAR (Ankle/feet lock: top 90%, width 28%, max-height 10%) */}
        {shoes ? (
          hasPhotoOverlay(shoes) ? (
            renderAnchoredPhotoLayer(shoes, 'footwear')
          ) : (
            <svg
              viewBox="0 0 200 440"
              className={`absolute inset-0 w-full h-full pointer-events-none ${slotAnimClass}`}
              style={{ zIndex: 18 }}
              fill="none"
              aria-hidden="true"
            >
              <path
                d={
                  shoes.silhouette === 'boots'
                    ? 'M73 390 H91 L93 416 L60 420 C58 412 64 404 73 400 Z'
                    : 'M74 398 H91 L93 419 H60 C59 410 66 404 74 398 Z'
                }
                fill={shoeColor}
                stroke={shoeStroke}
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d={
                  shoes.silhouette === 'boots'
                    ? 'M109 390 H127 L127 400 C136 404 142 412 140 420 L107 416 Z'
                    : 'M109 398 H126 C134 404 141 410 140 419 H107 Z'
                }
                fill={shoeColor}
                stroke={shoeStroke}
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <rect
                x="59"
                y="418"
                width="35"
                height="5"
                rx="2"
                fill={shoes.silhouette === 'sneakers' ? '#F5EFE6' : '#14110F'}
                stroke={shoeStroke}
                strokeWidth="1.1"
              />
              <rect
                x="106"
                y="418"
                width="35"
                height="5"
                rx="2"
                fill={shoes.silhouette === 'sneakers' ? '#F5EFE6' : '#14110F'}
                stroke={shoeStroke}
                strokeWidth="1.1"
              />
            </svg>
          )
        ) : (
          <svg
            viewBox="0 0 200 440"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 18 }}
            fill="none"
            aria-hidden="true"
          >
            <rect x="65" y="402" width="28" height="16" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(224,185,115,0.25)" strokeDasharray="3 3" />
            <rect x="107" y="402" width="28" height="16" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(224,185,115,0.25)" strokeDasharray="3 3" />
          </svg>
        )}

        {/* LAYER 3 (z-20): BASE UPPERWEAR (Shoulder-line lock: top 18%, width 46%, max-height 38%) */}
        {top ? (
          hasPhotoOverlay(top) ? (
            renderAnchoredPhotoLayer(top, 'top')
          ) : (
            <svg
              viewBox="0 0 200 440"
              className={`absolute inset-0 w-full h-full pointer-events-none ${slotAnimClass}`}
              style={{ zIndex: 20 }}
              fill="none"
              aria-hidden="true"
            >
              <path
                d={
                  isShortSleeveTop
                    ? `M${62 - shoulderDelta} 82 L86 78 Q100 92 114 78 L${138 + shoulderDelta} 82 L${156 + shoulderDelta} 126 L${139 + shoulderDelta} 138 L${134 + shoulderDelta} 122 L${133 + shoulderDelta / 2} 232 H${67 - shoulderDelta / 2} L${66 - shoulderDelta} 122 L${61 - shoulderDelta} 138 L${44 - shoulderDelta} 126 Z`
                    : top.silhouette === 'kurta'
                      ? `M${62 - shoulderDelta} 82 L86 78 Q100 90 114 78 L${138 + shoulderDelta} 82 L${154 + shoulderDelta} 166 L${139 + shoulderDelta} 171 L${133 + shoulderDelta} 124 L${133 + shoulderDelta / 2} 262 H${67 - shoulderDelta / 2} L${67 - shoulderDelta} 124 L${61 - shoulderDelta} 171 L${46 - shoulderDelta} 166 Z`
                      : `M${62 - shoulderDelta} 82 L86 78 Q100 90 114 78 L${138 + shoulderDelta} 82 L${154 + shoulderDelta} 166 L${139 + shoulderDelta} 171 L${133 + shoulderDelta} 124 L${133 + shoulderDelta / 2} 232 H${67 - shoulderDelta / 2} L${67 - shoulderDelta} 124 L${61 - shoulderDelta} 171 L${46 - shoulderDelta} 166 Z`
                }
                fill={topColor}
                stroke={topStroke}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {(top.silhouette === 'shirt' || top.silhouette === 'polo') && (
                <>
                  <line
                    x1="100"
                    y1="88"
                    x2="100"
                    y2={top.silhouette === 'polo' ? '132' : '231'}
                    stroke={topStroke}
                    strokeWidth="1.5"
                  />
                  <path d="M84 80 L94 94 L100 88 L106 94 L116 80" stroke={topStroke} strokeWidth="1.5" strokeLinejoin="round" />
                </>
              )}
              {top.silhouette === 'kurta' && (
                <>
                  <path d="M85 79 Q100 90 115 79" stroke={topStroke} strokeWidth="2" />
                  <line x1="100" y1="86" x2="100" y2="152" stroke={topStroke} strokeWidth="1.6" />
                  <circle cx="100" cy="106" r="1.5" fill={topStroke} />
                  <circle cx="100" cy="122" r="1.5" fill={topStroke} />
                  <circle cx="100" cy="138" r="1.5" fill={topStroke} />
                </>
              )}
              {top.silhouette === 'hoodie' && (
                <>
                  <path d="M82 81 Q100 101 118 81" stroke={topStroke} strokeWidth="2" />
                  <rect x="78" y="176" width="44" height="28" rx="5" stroke={topStroke} strokeWidth="1.5" />
                </>
              )}
              {(top.silhouette === 'tee' || top.silhouette === 'knit') && (
                <path d="M85 79 Q100 94 115 79" stroke={topStroke} strokeWidth="2" />
              )}
            </svg>
          )
        ) : !outer ? (
          <svg
            viewBox="0 0 200 440"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 20 }}
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M64 82 L86 78 Q100 90 114 78 L136 82 L154 128 L134 136 L132 230 H68 L66 136 L46 128 Z"
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(224,185,115,0.25)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>
        ) : null}

        {/* LAYER 4 (z-25): OUTERWEAR (Layers cleanly over base tops: top 17.5%, width 50%, max-height 40%) */}
        {outer && (
          hasPhotoOverlay(outer) ? (
            renderAnchoredPhotoLayer(outer, 'outerwear')
          ) : (
            <svg
              viewBox="0 0 200 440"
              className={`absolute inset-0 w-full h-full pointer-events-none ${slotAnimClass}`}
              style={{ zIndex: 25 }}
              fill="none"
              aria-hidden="true"
            >
              {top ? (
                <>
                  <path
                    d={`M${59 - shoulderDelta} 79 L85 75 L91 92 L91 236 H${62 - shoulderDelta / 2} L${62 - shoulderDelta} 124 L${54 - shoulderDelta} 184 L${39 - shoulderDelta} 178 L${58 - shoulderDelta} 85 Z`}
                    fill={outerColor}
                    stroke={outerStroke}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d={`M${141 + shoulderDelta} 79 L115 75 L109 92 L109 236 H${138 + shoulderDelta / 2} L${138 + shoulderDelta} 124 L${146 + shoulderDelta} 184 L${161 + shoulderDelta} 178 L${142 + shoulderDelta} 85 Z`}
                    fill={outerColor}
                    stroke={outerStroke}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {(outer.silhouette === 'coat' ||
                    outer.silhouette === 'jacket' ||
                    outer.silhouette === 'blazer') && (
                    <>
                      <path d="M82 76 L91 96 L81 102" stroke={outerStroke} strokeWidth="1.5" />
                      <path d="M118 76 L109 96 L119 102" stroke={outerStroke} strokeWidth="1.5" />
                    </>
                  )}
                </>
              ) : (
                <>
                  <path
                    d={`M${59 - shoulderDelta} 79 L85 75 Q100 89 115 75 L${141 + shoulderDelta} 79 L${161 + shoulderDelta} 178 L${146 + shoulderDelta} 184 L${138 + shoulderDelta} 124 L${138 + shoulderDelta / 2} 236 H${62 - shoulderDelta / 2} L${62 - shoulderDelta} 124 L${54 - shoulderDelta} 184 L${39 - shoulderDelta} 178 Z`}
                    fill={outerColor}
                    stroke={outerStroke}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <line x1="100" y1="86" x2="100" y2="236" stroke={outerStroke} strokeWidth="1.8" />
                </>
              )}
            </svg>
          )
        )}

        {/* LAYER 5 (z-28): Subtle Torso-Contour Shading Overlay for Natural Photo Drape */}
        {hasAnyUploadedPhoto && (
          <div
            aria-hidden="true"
            data-testid="torso-contour-overlay"
            className="mannequin-contour-overlay pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-[28px]"
            style={{
              top: '17.5%',
              width: '50%',
              height: '74%',
              zIndex: 28,
            }}
          />
        )}
      </div>
    </div>
  );
};
