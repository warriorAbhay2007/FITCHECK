import { WardrobeItem } from '../types/wardrobe';

const DB_NAME = 'fitcheck_personal_wardrobe_db';
const DB_VERSION = 1;
const STORE_NAME = 'garments';
const FALLBACK_KEY = 'fitcheck_personal_wardrobe_fallback_v1';

function readFallback(): WardrobeItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WardrobeItem[]) : [];
  } catch {
    return [];
  }
}

function writeFallback(items: WardrobeItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded in fallback storage; IndexedDB remains primary
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

export async function loadPersonalGarments(): Promise<WardrobeItem[]> {
  try {
    const db = await openDatabase();
    return await new Promise<WardrobeItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = Array.isArray(req.result) ? (req.result as WardrobeItem[]) : [];
        rows.sort((a, b) =>
          (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
        );
        db.close();
        resolve(rows);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return readFallback();
  }
}

export async function upsertPersonalGarment(item: WardrobeItem): Promise<void> {
  const normalized: WardrobeItem = {
    ...item,
    isCustom: true,
    isUserUploaded: true,
    createdAt: item.createdAt ?? new Date().toISOString(),
  };

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(normalized);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    const existing = readFallback().filter((g) => g.id !== normalized.id);
    writeFallback([normalized, ...existing]);
  }
}

export async function deletePersonalGarment(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    writeFallback(readFallback().filter((g) => g.id !== id));
  }
}

export async function clearPersonalGarments(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    writeFallback([]);
  }
}
