import { toPng } from 'html-to-image';
import { OutfitSlots } from '../types/wardrobe';

export interface ExportOutfitOptions {
  lookTitle?: string;
  contextTag?: string;
  pixelRatio?: number;
}

export interface ExportOutfitResult {
  filename: string;
  dataUrl: string;
}

function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildOutfitExportFilename(
  lookTitle?: string,
  contextTag?: string,
): string {
  const titleSlug = lookTitle ? slugifySegment(lookTitle) : '';
  if (titleSlug) {
    return `fitcheck-${titleSlug}.png`;
  }

  const tagSlug = contextTag ? slugifySegment(contextTag) : '';
  if (tagSlug) {
    return `fitcheck-${tagSlug}-outfit.png`;
  }

  return 'fitcheck-outfit.png';
}

export function getEquippedSlotCount(slots: OutfitSlots): number {
  return Object.values(slots).filter(Boolean).length;
}

export function shouldIncludeExportNode(node: Node): boolean {
  if (typeof HTMLElement !== 'undefined' && node instanceof HTMLElement) {
    return node.dataset.exportIgnore !== 'true';
  }
  return true;
}

export async function exportOutfitCanvasAsPng(
  element: HTMLElement,
  options: ExportOutfitOptions = {},
): Promise<ExportOutfitResult> {
  const filename = buildOutfitExportFilename(
    options.lookTitle,
    options.contextTag,
  );
  const pixelRatio =
    options.pixelRatio ?? Math.max(window.devicePixelRatio || 2, 3);

  // Allow any just-triggered slot-swap CSS animation to settle at opacity 1
  await new Promise((resolve) => window.setTimeout(resolve, 220));

  const captureOptions = {
    pixelRatio,
    cacheBust: true,
    backgroundColor: '#151922',
    filter: shouldIncludeExportNode,
  };

  let dataUrl: string;
  try {
    dataUrl = await toPng(element, captureOptions);
  } catch {
    // Fallback if a remote stylesheet blocks CSSRule inspection
    dataUrl = await toPng(element, {
      ...captureOptions,
      skipFonts: true,
    });
  }

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { filename, dataUrl };
}
