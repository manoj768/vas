import { ValuationCase, SurveyDraft, PendingSyncAction, SyncStatus } from "../types";

const DB_NAME = "ValProSurveyDB";
const DB_VERSION = 1;

const STORE_CASES = "cases";
const STORE_DRAFTS = "survey_drafts";
const STORE_QUEUE = "pending_queue";

// Helper to open IndexedDB with Promise wrapper
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported in this browser environment."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Object store for local cases
      if (!db.objectStoreNames.contains(STORE_CASES)) {
        const caseStore = db.createObjectStore(STORE_CASES, { keyPath: "id" });
        caseStore.createIndex("syncStatus", "syncStatus", { unique: false });
      }

      // Object store for field survey step drafts
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: "caseId" });
      }

      // Object store for queued pending sync operations
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: "id" });
        queueStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });
}

// ==================== CASES IDB OPERATIONS ====================

export async function saveCaseToIDB(
  caseData: ValuationCase,
  syncStatus: SyncStatus = "synced"
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CASES, "readwrite");
    const store = tx.objectStore(STORE_CASES);
    const itemToSave = {
      ...caseData,
      _localSyncStatus: syncStatus,
      _lastModifiedLocally: Date.now(),
    };
    store.put(itemToSave);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error saving case to IDB:", err);
  }
}

export async function saveCasesToIDBBulk(cases: ValuationCase[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CASES, "readwrite");
    const store = tx.objectStore(STORE_CASES);
    cases.forEach((c) => {
      store.put({
        ...c,
        _localSyncStatus: "synced",
        _lastModifiedLocally: Date.now(),
      });
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error bulk saving cases:", err);
  }
}

export async function getAllCasesFromIDB(): Promise<ValuationCase[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CASES, "readonly");
    const store = tx.objectStore(STORE_CASES);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result || [];
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error getting cases from IDB:", err);
    return [];
  }
}

export async function getCaseFromIDB(id: string): Promise<ValuationCase | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CASES, "readonly");
    const store = tx.objectStore(STORE_CASES);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error getting case from IDB:", err);
    return null;
  }
}

// ==================== SURVEY DRAFTS IDB OPERATIONS ====================

export async function saveSurveyDraftToIDB(draft: SurveyDraft): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DRAFTS, "readwrite");
    const store = tx.objectStore(STORE_DRAFTS);
    store.put(draft);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error saving survey draft to IDB:", err);
  }
}

export async function getSurveyDraftFromIDB(caseId: string): Promise<SurveyDraft | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DRAFTS, "readonly");
    const store = tx.objectStore(STORE_DRAFTS);
    const request = store.get(caseId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error getting survey draft from IDB:", err);
    return null;
  }
}

export async function clearSurveyDraftFromIDB(caseId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DRAFTS, "readwrite");
    const store = tx.objectStore(STORE_DRAFTS);
    store.delete(caseId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error clearing draft from IDB:", err);
  }
}

// ==================== PENDING QUEUE IDB OPERATIONS ====================

export async function enqueuePendingAction(
  action: Omit<PendingSyncAction, "id" | "timestamp" | "retryCount">
): Promise<PendingSyncAction> {
  const fullAction: PendingSyncAction = {
    ...action,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    const store = tx.objectStore(STORE_QUEUE);
    store.put(fullAction);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(fullAction);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error enqueueing pending sync action:", err);
    return fullAction;
  }
}

export async function getPendingActionsFromIDB(): Promise<PendingSyncAction[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_QUEUE, "readonly");
    const store = tx.objectStore(STORE_QUEUE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = (request.result || []) as PendingSyncAction[];
        // Sort by timestamp asc
        items.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error getting pending actions:", err);
    return [];
  }
}

export async function removePendingActionFromIDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    const store = tx.objectStore(STORE_QUEUE);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error removing pending action:", err);
  }
}

export async function clearAllPendingActionsFromIDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    const store = tx.objectStore(STORE_QUEUE);
    store.clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error clearing queue:", err);
  }
}

// ==================== STORAGE USAGE METRICS ====================

export async function getIDBMetrics(): Promise<{
  totalCases: number;
  totalDrafts: number;
  pendingQueueCount: number;
  totalPhotosAndDocs: number;
  estimatedBytes: number;
}> {
  try {
    const cases = await getAllCasesFromIDB();
    const queue = await getPendingActionsFromIDB();

    const db = await openDB();
    const tx = db.transaction(STORE_DRAFTS, "readonly");
    const draftStore = tx.objectStore(STORE_DRAFTS);
    const draftRequest = draftStore.getAll();

    const drafts: SurveyDraft[] = await new Promise((res) => {
      draftRequest.onsuccess = () => res(draftRequest.result || []);
      draftRequest.onerror = () => res([]);
    });

    let photoDocCount = 0;
    cases.forEach((c) => {
      if (c.identityData?.photos) {
        Object.values(c.identityData.photos).forEach((p) => {
          if (p) photoDocCount++;
        });
      }
      if (c.mediaAttachments) {
        if (c.mediaAttachments.selfie) photoDocCount++;
        if (c.mediaAttachments.elevation) photoDocCount++;
        if (c.mediaAttachments.road) photoDocCount++;
        if (c.mediaAttachments.dataSheet) photoDocCount++;
        if (Array.isArray(c.mediaAttachments.photosVideos)) {
          photoDocCount += c.mediaAttachments.photosVideos.length;
        }
        if (Array.isArray(c.mediaAttachments.docs)) {
          photoDocCount += c.mediaAttachments.docs.length;
        }
      }
    });

    const jsonStr = JSON.stringify({ cases, queue, drafts });
    const bytes = new Blob([jsonStr]).size;

    return {
      totalCases: cases.length,
      totalDrafts: drafts.length,
      pendingQueueCount: queue.length,
      totalPhotosAndDocs: photoDocCount,
      estimatedBytes: bytes,
    };
  } catch (err) {
    return {
      totalCases: 0,
      totalDrafts: 0,
      pendingQueueCount: 0,
      totalPhotosAndDocs: 0,
      estimatedBytes: 0,
    };
  }
}
