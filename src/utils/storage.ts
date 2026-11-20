import {
  INITIAL_BUDGET_STATE,
  STARTER_SAVED_OUTFITS,
  STARTER_WARDROBE,
} from '../data/seedData';
import {
  BudgetState,
  SavedOutfit,
  WardrobeItem,
  WardrobeProfile,
} from '../types/wardrobe';
import { DEFAULT_WARDROBE_PROFILE } from './wardrobeStyling';

const KEYS = {
  wardrobe: 'fitcheck_wardrobe_v2',
  budget: 'fitcheck_budget_v1',
  savedOutfits: 'fitcheck_saved_outfits_v1',
  profile: 'fitcheck_wardrobe_profile_v2',
};

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors cleanly
  }
}

export function loadWardrobe(): WardrobeItem[] {
  const data = safeRead<WardrobeItem[] | null>(KEYS.wardrobe, null);
  if (!Array.isArray(data) || data.length === 0) return STARTER_WARDROBE;

  const starterMap = new Map(STARTER_WARDROBE.map((s) => [s.id, s]));
  return data.map((item) => {
    const starter = starterMap.get(item.id);
    return starter ? { ...starter, ...item, railTab: item.railTab ?? starter.railTab } : item;
  });
}

export function saveWardrobe(items: WardrobeItem[]): void {
  safeWrite(KEYS.wardrobe, items);
}

export function loadBudget(): BudgetState {
  const data = safeRead<BudgetState | null>(KEYS.budget, null);
  if (
    data &&
    typeof data.monthlyLimitInr === 'number' &&
    typeof data.spentInr === 'number' &&
    Array.isArray(data.purchasedDropIds)
  ) {
    return data;
  }
  return INITIAL_BUDGET_STATE;
}

export function saveBudget(budget: BudgetState): void {
  safeWrite(KEYS.budget, budget);
}

export function loadSavedOutfits(): SavedOutfit[] {
  const data = safeRead<SavedOutfit[] | null>(KEYS.savedOutfits, null);
  return Array.isArray(data) ? data : STARTER_SAVED_OUTFITS;
}

export function saveSavedOutfits(outfits: SavedOutfit[]): void {
  safeWrite(KEYS.savedOutfits, outfits);
}

export function loadWardrobeProfile(): WardrobeProfile {
  const data = safeRead<Partial<WardrobeProfile> | null>(KEYS.profile, null);
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_WARDROBE_PROFILE };
  }
  const validBodyTypes = new Set(['lean', 'athletic', 'average', 'broad', 'heavy']);
  return {
    ...DEFAULT_WARDROBE_PROFILE,
    ...data,
    bodyType:
      data.bodyType && validBodyTypes.has(data.bodyType)
        ? data.bodyType
        : DEFAULT_WARDROBE_PROFILE.bodyType,
  };
}

export function saveWardrobeProfile(profile: WardrobeProfile): void {
  safeWrite(KEYS.profile, profile);
}

export function resetAllDemoData(): {
  wardrobe: WardrobeItem[];
  budget: BudgetState;
  savedOutfits: SavedOutfit[];
  profile: WardrobeProfile;
} {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(KEYS.wardrobe);
    window.localStorage.removeItem(KEYS.budget);
    window.localStorage.removeItem(KEYS.savedOutfits);
    window.localStorage.removeItem(KEYS.profile);
  }
  return {
    wardrobe: STARTER_WARDROBE,
    budget: INITIAL_BUDGET_STATE,
    savedOutfits: STARTER_SAVED_OUTFITS,
    profile: { ...DEFAULT_WARDROBE_PROFILE },
  };
}
