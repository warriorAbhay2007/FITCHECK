import React, { useState } from 'react';
import { GarmentSilhouette } from '../types/wardrobe';

interface GarmentArtworkProps {
  silhouette: GarmentSilhouette;
  colorHex: string;
  name: string;
  imageUrl?: string;
  className?: string;
}

function getStrokeColor(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 'rgba(15,23,42,0.35)';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.35 ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.28)';
}

export const GarmentArtwork: React.FC<GarmentArtworkProps> = ({
  silhouette,
  colorHex,
  name,
  imageUrl,
  className = 'w-full h-full',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (imageUrl && !imgFailed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  const stroke = getStrokeColor(colorHex);

  return (
    <div
      className={`flex items-center justify-center bg-[#F4F3EF] ${className}`}
      aria-label={name}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-4/5 h-4/5 drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {silhouette === 'tee' && (
          <g>
            <path
              d="M36 24 L48 22 C51 29 69 29 72 22 L84 24 L104 42 L93 57 L83 50 L83 98 L37 98 L37 50 L27 57 L16 42 Z"
              fill={colorHex}
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M48 22 C52 31 68 31 72 22"
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}

        {silhouette === 'shirt' && (
          <g>
            <path
              d="M38 22 L49 18 L60 25 L71 18 L82 22 L102 44 L96 86 L84 85 L84 48 L82 99 L38 99 L36 48 L36 85 L24 86 L18 44 Z"
              fill={colorHex}
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <line x1="60" y1="26" x2="60" y2="99" stroke={stroke} strokeWidth="1.6" />
            <path d="M48 19 L55 31 L60 25 L65 31 L72 19" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          </g>
        )}

        {(silhouette === 'hoodie' || silhouette === 'knit') && (
          <g>
            <path
              d="M38 25 C43 13 77 13 82 25 L103 44 L96 88 L83 87 L83 50 L82 98 L38 98 L37 50 L37 87 L24 88 L17 44 Z"
              fill={colorHex}
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {silhouette === 'hoodie' && (
              <>
                <path d="M44 26 C50 36 70 36 76 26" stroke={stroke} strokeWidth="2" />
                <rect x="44" y="67" width="32" height="19" rx="4" stroke={stroke} strokeWidth="1.7" />
              </>
            )}
            {silhouette === 'knit' && (
              <path d="M46 25 C52 33 68 33 74 25" stroke={stroke} strokeWidth="2.2" />
            )}
          </g>
        )}

        {(silhouette === 'jacket' || silhouette === 'bomber' || silhouette === 'shell' || silhouette === 'coat') && (
          <g>
            <path
              d="M36 22 L49 19 L60 24 L71 19 L84 22 L104 44 L96 89 L83 88 L83 48 L83 100 L37 100 L37 48 L37 88 L24 89 L16 44 Z"
              fill={colorHex}
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <line x1="60" y1="24" x2="60" y2="100" stroke={stroke} strokeWidth="2" />
            <path d="M44 54 H54 M66 54 H76" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
            {silhouette === 'coat' && (
              <path d="M46 21 L54 34 L60 25 L66 34 L74 21" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
            )}
            {silhouette === 'bomber' && (
              <rect x="37" y="92" width="46" height="8" rx="1" stroke={stroke} strokeWidth="1.6" />
            )}
          </g>
        )}

        {(silhouette === 'cargo' || silhouette === 'denim' || silhouette === 'trousers' || silhouette === 'shorts') && (
          <g>
            <path
              d={
                silhouette === 'shorts'
                  ? 'M33 22 H87 L92 68 L66 68 L60 46 L54 68 L28 68 Z'
                  : 'M34 18 H86 L92 103 L66 103 L60 49 L54 103 L28 103 Z'
              }
              fill={colorHex}
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <line x1="34" y1="26" x2="86" y2="26" stroke={stroke} strokeWidth="1.6" />
            {silhouette === 'cargo' && (
              <>
                <rect x="31" y="54" width="12" height="16" rx="2" stroke={stroke} strokeWidth="1.7" />
                <rect x="77" y="54" width="12" height="16" rx="2" stroke={stroke} strokeWidth="1.7" />
              </>
            )}
            {silhouette === 'trousers' && (
              <>
                <line x1="47" y1="28" x2="42" y2="96" stroke={stroke} strokeWidth="1.3" strokeDasharray="3 2" />
                <line x1="73" y1="28" x2="78" y2="96" stroke={stroke} strokeWidth="1.3" strokeDasharray="3 2" />
              </>
            )}
          </g>
        )}

        {silhouette === 'sneakers' && (
          <g>
            <path
              d="M20 74 C22 60 32 49 44 46 L54 55 C62 59 74 62 96 66 C103 68 106 75 104 82 L20 82 Z"
              fill={colorHex}
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <rect x="19" y="81" width="86" height="9" rx="3" fill="#FFFFFF" stroke={stroke} strokeWidth="2" />
            <path d="M56 56 L66 63 M62 59 L72 64" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}

        {silhouette === 'boots' && (
          <g>
            <path
              d="M31 28 H59 L62 58 C72 63 85 65 98 68 C103 70 104 78 102 84 L28 84 L31 28 Z"
              fill={colorHex}
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path d="M27 84 H103 V93 H66 L62 90 H50 L46 93 H27 Z" fill="#0F172A" stroke={stroke} strokeWidth="1.8" />
          </g>
        )}

        {silhouette === 'loafers' && (
          <g>
            <path
              d="M22 66 C26 56 38 51 50 51 C58 51 64 58 76 62 C90 65 102 68 102 79 L20 79 Z"
              fill={colorHex}
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <rect x="49" y="54" width="16" height="6" rx="2" stroke={stroke} strokeWidth="1.5" />
            <path d="M19 79 H103 V87 H65 L61 84 H46 L42 87 H19 Z" fill="#1E1B18" stroke={stroke} strokeWidth="1.8" />
          </g>
        )}
      </svg>
    </div>
  );
};
