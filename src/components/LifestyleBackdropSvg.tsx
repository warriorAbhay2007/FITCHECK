import React from 'react';
import {
  LifestyleSceneKey,
  MoodboardBackdropPalette,
  getLifestyleSceneByKey,
} from '../utils/moodboard';

interface LifestyleBackdropSvgProps {
  sceneKey: LifestyleSceneKey;
  palette?: MoodboardBackdropPalette;
  className?: string;
}

export const LifestyleBackdropSvg: React.FC<LifestyleBackdropSvgProps> = ({
  sceneKey,
  palette,
  className = '',
}) => {
  const scene = getLifestyleSceneByKey(sceneKey);
  const colors = palette ?? scene.defaultBackdropPalette;
  const uid = `scene-${sceneKey}`;

  return (
    <svg
      viewBox="0 0 960 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`w-full h-full block select-none ${className}`}
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor={colors.skyTop} />
          <stop offset="55%" stopColor={colors.skyBottom} />
          <stop offset="100%" stopColor={colors.surfaceTint} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="68%" cy="28%" r="55%">
          <stop offset="0%" stopColor={colors.accentGlow} stopOpacity="0.45" />
          <stop offset="55%" stopColor={colors.accentGlow} stopOpacity="0.12" />
          <stop offset="100%" stopColor={colors.surfaceTint} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-beam`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.accentGlow} stopOpacity="0.26" />
          <stop offset="100%" stopColor={colors.accentGlow} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Atmospheric Base Sky & Surface */}
      <rect width="960" height="640" fill={`url(#${uid}-sky)`} />
      <rect width="960" height="640" fill={`url(#${uid}-glow)`} />

      {sceneKey === 'campus_cafe' && (
        <g>
          {/* Warm Plaster Arch Wall & Recessed Veranda */}
          <path
            d="M0 0 H960 V640 H0 Z M490 540 V250 C490 140 580 75 685 75 C790 75 880 140 880 250 V540 Z"
            fill={colors.surfaceTint}
            fillOpacity="0.72"
            fillRule="evenodd"
          />
          <path
            d="M490 540 V250 C490 140 580 75 685 75 C790 75 880 140 880 250 V540"
            fill="none"
            stroke={colors.accentGlow}
            strokeOpacity="0.28"
            strokeWidth="3"
          />
          {/* Sunlit Diagonal Shadow Shaft */}
          <polygon
            points="520,85 880,190 960,540 420,540"
            fill={`url(#${uid}-beam)`}
          />
          {/* Hanging Brass Pendant Lamp */}
          <line
            x1="685"
            y1="0"
            x2="685"
            y2="165"
            stroke={colors.accentGlow}
            strokeOpacity="0.55"
            strokeWidth="2"
          />
          <path
            d="M645 190 C650 165 720 165 725 190 Z"
            fill={colors.accentGlow}
            fillOpacity="0.75"
          />
          <circle
            cx="685"
            cy="196"
            r="14"
            fill={colors.accentGlow}
            fillOpacity="0.45"
          />
          {/* Tropical Foliage Silhouettes */}
          <g fill="#120e0b" fillOpacity="0.58">
            <path d="M500 540 C480 410 535 320 605 265 C570 350 565 435 585 540 Z" />
            <path d="M845 540 C860 390 810 290 745 235 C785 330 795 425 775 540 Z" />
            <ellipse cx="535" cy="360" rx="52" ry="18" transform="rotate(-32 535 360)" />
            <ellipse cx="820" cy="330" rx="56" ry="18" transform="rotate(28 820 330)" />
          </g>
          {/* Travertine Floor & Teak Bistro Table */}
          <rect x="0" y="540" width="960" height="100" fill="#17120e" fillOpacity="0.82" />
          <ellipse cx="725" cy="545" rx="135" ry="18" fill="#2c2119" stroke={colors.accentGlow} strokeOpacity="0.25" />
          <rect x="719" y="545" width="12" height="95" fill="#1b140f" />
          {/* Ceramic Espresso Cup on Table */}
          <rect x="692" y="520" width="22" height="18" rx="4" fill="#ebe3d5" fillOpacity="0.85" />
          <ellipse cx="703" cy="539" rx="16" ry="4" fill="#d8cfc0" fillOpacity="0.7" />
        </g>
      )}

      {sceneKey === 'urban_street' && (
        <g>
          {/* Brutalist Architectural Columns & Sunlit Concrete Plane */}
          <polygon
            points="0,0 440,0 320,520 0,520"
            fill={colors.surfaceTint}
            fillOpacity="0.65"
          />
          <polygon
            points="440,0 960,0 960,460 520,460"
            fill={`url(#${uid}-beam)`}
          />
          {/* Architectural Columns */}
          <rect x="520" y="30" width="56" height="455" fill="#18181b" fillOpacity="0.72" />
          <rect x="680" y="48" width="52" height="437" fill="#18181b" fillOpacity="0.58" />
          <rect x="830" y="65" width="46" height="420" fill="#18181b" fillOpacity="0.44" />
          {/* Sandstone Promenade Steps */}
          <rect x="0" y="485" width="960" height="32" fill="#3a3128" fillOpacity="0.82" />
          <rect x="0" y="517" width="960" height="38" fill="#2b241d" fillOpacity="0.88" />
          <rect x="0" y="555" width="960" height="85" fill="#161412" fillOpacity="0.92" />
          {/* Crisp Diagonal Golden Hour Shadow */}
          <polygon
            points="520,485 576,485 380,640 280,640"
            fill="#0c0a09"
            fillOpacity="0.45"
          />
          {/* Brushed Steel Handrail */}
          <line
            x1="410"
            y1="425"
            x2="960"
            y2="425"
            stroke={colors.accentGlow}
            strokeOpacity="0.48"
            strokeWidth="3"
          />
          <line x1="470" y1="425" x2="470" y2="485" stroke={colors.accentGlow} strokeOpacity="0.38" strokeWidth="2.5" />
          <line x1="760" y1="425" x2="760" y2="485" stroke={colors.accentGlow} strokeOpacity="0.38" strokeWidth="2.5" />
        </g>
      )}

      {sceneKey === 'rooftop_evening' && (
        <g>
          {/* Distant Evening Skyline Silhouettes */}
          <path
            d="M0 440 V310 H95 V240 H185 V330 H260 V210 H365 V300 H445 V180 H555 V290 H640 V225 H740 V315 H835 V195 H960 V440 Z"
            fill="#0f1018"
            fillOpacity="0.82"
          />
          {/* Warm Amber Skyline Window Bokeh */}
          <g fill={colors.accentGlow}>
            <circle cx="135" cy="285" r="3" fillOpacity="0.65" />
            <circle cx="305" cy="260" r="3.5" fillOpacity="0.7" />
            <circle cx="495" cy="235" r="4" fillOpacity="0.75" />
            <circle cx="515" cy="265" r="3" fillOpacity="0.6" />
            <circle cx="685" cy="275" r="3.5" fillOpacity="0.7" />
            <circle cx="885" cy="250" r="4" fillOpacity="0.75" />
            <circle cx="615" cy="365" r="22" fillOpacity="0.14" />
            <circle cx="775" cy="340" r="30" fillOpacity="0.12" />
            <circle cx="430" cy="355" r="18" fillOpacity="0.12" />
          </g>
          {/* Basalt Rooftop Parapet & String Lights */}
          <path
            d="M0 110 Q480 185 960 95"
            fill="none"
            stroke="#f5efe6"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
          {[180, 320, 465, 615, 760, 890].map((cx, i) => (
            <g key={cx}>
              <circle
                cx={cx}
                cy={125 + (i % 2 === 0 ? 18 : 8)}
                r="14"
                fill={colors.accentGlow}
                fillOpacity="0.16"
              />
              <circle
                cx={cx}
                cy={125 + (i % 2 === 0 ? 18 : 8)}
                r="4"
                fill={colors.accentGlow}
                fillOpacity="0.9"
              />
            </g>
          ))}
          <rect x="0" y="440" width="960" height="200" fill="#131117" fillOpacity="0.92" />
          <rect x="0" y="438" width="960" height="4" fill={colors.accentGlow} fillOpacity="0.3" />
          {/* Brass Terrace Lantern */}
          <rect x="780" y="388" width="38" height="50" rx="4" fill="#1c1815" stroke={colors.accentGlow} strokeOpacity="0.6" strokeWidth="1.5" />
          <ellipse cx="799" cy="415" rx="9" ry="14" fill={colors.accentGlow} fillOpacity="0.85" />
        </g>
      )}

      {sceneKey === 'gallery_minimal' && (
        <g>
          {/* Soft Diffused Skylight Shaft */}
          <polygon
            points="210,0 710,0 920,540 110,540"
            fill={`url(#${uid}-beam)`}
          />
          {/* Recessed Plaster Atelier Arch */}
          <path
            d="M0 0 H960 V540 H0 Z M540 540 V200 C540 105 620 55 710 55 C800 55 875 105 875 200 V540 Z"
            fill={colors.surfaceTint}
            fillOpacity="0.65"
            fillRule="evenodd"
          />
          <path
            d="M540 540 V200 C540 105 620 55 710 55 C800 55 875 105 875 200 V540"
            fill="none"
            stroke="#f5efe6"
            strokeOpacity="0.2"
            strokeWidth="2"
          />
          {/* Minimalist Framed Abstract Canvas on Wall */}
          <rect
            x="618"
            y="180"
            width="180"
            height="220"
            rx="3"
            fill="#1f1b17"
            stroke={colors.accentGlow}
            strokeOpacity="0.35"
            strokeWidth="2"
          />
          <circle cx="708" cy="275" r="46" fill={colors.accentGlow} fillOpacity="0.28" />
          <rect x="652" y="325" width="112" height="4" fill="#f5efe6" fillOpacity="0.25" />
          {/* Travertine Floor & Plinth */}
          <rect x="0" y="540" width="960" height="100" fill="#191613" fillOpacity="0.86" />
          <rect x="750" y="450" width="90" height="90" fill="#3b342c" fillOpacity="0.85" />
          <rect x="750" y="450" width="90" height="6" fill={colors.accentGlow} fillOpacity="0.35" />
        </g>
      )}

      {sceneKey === 'festive_courtyard' && (
        <g>
          {/* Heritage Carved Sandstone Jali Screen */}
          <rect x="0" y="0" width="960" height="530" fill={colors.surfaceTint} fillOpacity="0.58" />
          <path
            d="M520 530 V225 Q690 80 860 225 V530 Z"
            fill={colors.skyBottom}
            fillOpacity="0.68"
            stroke={colors.accentGlow}
            strokeOpacity="0.4"
            strokeWidth="3"
          />
          {/* Jali Lattice Diamond Geometry */}
          <g stroke={colors.accentGlow} strokeOpacity="0.22" strokeWidth="1.5">
            {[240, 290, 340, 390, 440, 490].map((y) => (
              <line key={`h-${y}`} x1="540" y1={y} x2="840" y2={y} />
            ))}
            {[565, 615, 665, 715, 765, 815].map((x) => (
              <line key={`v-${x}`} x1={x} y1="185" x2={x} y2="530" />
            ))}
          </g>
          {/* Warm Hanging Brass Diya Lanterns */}
          {[610, 690, 770].map((x, idx) => {
            const y = idx === 1 ? 205 : 245;
            return (
              <g key={x}>
                <line
                  x1={x}
                  y1="140"
                  x2={x}
                  y2={y}
                  stroke={colors.accentGlow}
                  strokeOpacity="0.6"
                  strokeWidth="1.5"
                />
                <circle cx={x} cy={y + 12} r="22" fill={colors.accentGlow} fillOpacity="0.22" />
                <polygon
                  points={`${x - 10},${y} ${x + 10},${y} ${x + 14},${y + 18} ${x - 14},${y + 18}`}
                  fill={colors.accentGlow}
                  fillOpacity="0.85"
                />
              </g>
            );
          })}
          {/* Sandstone Courtyard Steps */}
          <rect x="0" y="530" width="960" height="110" fill="#1b120e" fillOpacity="0.9" />
          <rect x="0" y="530" width="960" height="4" fill={colors.accentGlow} fillOpacity="0.35" />
        </g>
      )}
    </svg>
  );
};
