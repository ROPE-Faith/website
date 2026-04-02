import { RopeEntry } from "./store";

const DB_NAME = "rope_db";
const DB_VERSION = 1;
const STORE_NAME = "rope_entries";

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRopeEntries(entries: RopeEntry[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    // For simplicity with the existing array-based logic, 
    // we'll clear and re-add or just put each. 
    // Clearing and re-adding is safer for maintaining order if we treat it as a list.
    store.clear();
    entries.forEach(entry => store.add(entry));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadRopeEntries(): Promise<RopeEntry[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as RopeEntry[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Migrates data from localStorage to IndexedDB if needed.
 */
export async function migrateFromLocalStorage(): Promise<void> {
  const raw = localStorage.getItem("rope_entries");
  if (!raw) return;

  try {
    const entries = JSON.parse(raw) as RopeEntry[];
    if (entries.length > 0) {
      await saveRopeEntries(entries);
      // We keep localStorage for now as a backup, 
      // but we could clear it or mark it as migrated.
      localStorage.setItem("rope_entries_migrated", "true");
    }
  } catch (e) {
    console.error("Migration failed", e);
  }
}

export async function deleteRopeEntries(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
