const DB_NAME = 'saas-workspace';
const STORE_NAME = 'form-drafts';
const DB_VERSION = 1;

function serializeDraft(data: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const request = fn(tx.objectStore(STORE_NAME));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
      }),
  );
}

export async function saveDraft(key: string, data: Record<string, unknown>) {
  try {
    await runTransaction('readwrite', (store) => store.put(serializeDraft(data), key));
  } catch (err) {
    console.error('[form-draft] save failed:', err);
  }
}

export async function loadDraft<T>(key: string): Promise<T | undefined> {
  try {
    return await runTransaction<T | undefined>('readonly', (store) => store.get(key));
  } catch (err) {
    console.error('[form-draft] load failed:', err);
    return undefined;
  }
}

export async function clearDraft(key: string) {
  try {
    await runTransaction('readwrite', (store) => store.delete(key));
  } catch (err) {
    console.error('[form-draft] clear failed:', err);
  }
}
